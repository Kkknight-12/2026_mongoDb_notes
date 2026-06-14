# Doubts Delete Hooks — Updated Notes

This note replaces older `pre/post remove` wording with modern Mongoose `deleteOne` / `deleteMany` middleware.

## 1. Code line explanation

```ts
{ user: null, details: { ...doc.toObject(), anonymized: true } }
```

This update object means:

```ts
{
  user: null,
  details: {
    ...doc.toObject(),
    anonymized: true
  }
}
```

### `user: null`

This removes the direct reference from an activity/log document to the deleted user.

Before:

```json
{
  "user": "60d5f3b5c3b3b30015c5e1b0",
  "action": "login"
}
```

After:

```json
{
  "user": null,
  "action": "login"
}
```

### `details: { ...doc.toObject(), anonymized: true }`

- `doc.toObject()` converts the Mongoose document into a plain JavaScript object.
- `...doc.toObject()` copies that user data into `details`.
- `anonymized: true` marks the log as processed/anonymized.

## Important privacy correction

If you copy the full user document into `details`, especially fields like email, phone, name, or address, the data may **not actually be anonymized**. It is only de-referenced from the user id.

A safer pattern is to store only non-identifying fields, or redact PII.

```ts
await UserActivity.updateMany(
  { user: doc._id },
  {
    $set: {
      user: null,
      details: {
        deletedUserRole: doc.role,
        deletedAt: new Date(),
        anonymized: true
      }
    }
  }
);
```

If you need audit logs, decide carefully what data you are legally allowed to retain.

---

# 2. Modern delete middleware: `remove()` is outdated

Older tutorials use:

```ts
schema.pre('remove', function () {});
await doc.remove();
```

In modern Mongoose, use `deleteOne()` / `deleteMany()` instead.

## A. Document-level delete hook

Use this when you first load a document and then delete that specific document.

```ts
UserSchema.pre('deleteOne', { document: true, query: false }, async function () {
  // this = document being deleted
  if (this.role === 'admin') {
    throw new Error('Admin users cannot be deleted');
  }

  await UserPost.deleteMany({ user: this._id });
});

UserSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  // doc = deleted document
  await UserActivity.updateMany(
    { user: doc._id },
    {
      $set: {
        user: null,
        details: {
          deletedUserRole: doc.role,
          anonymized: true,
          deletedAt: new Date()
        }
      }
    }
  );
});
```

Usage:

```ts
const user = await User.findById(userId);
if (!user) throw new Error('User not found');
await user.deleteOne(); // document middleware runs
```

## B. Query-level `Model.deleteOne()` hook

By default, `Model.deleteOne()` triggers query middleware. In query middleware, `this` is the query object, not the document.

```ts
UserSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const filter = this.getFilter();
  const user = await this.model.findOne(filter).lean();

  if (!user) return;
  if (user.role === 'admin') {
    throw new Error('Admin users cannot be deleted');
  }

  await UserPost.deleteMany({ user: user._id });
});
```

Usage:

```ts
await User.deleteOne({ _id: userId }); // query middleware runs
```

## C. Query-level `deleteMany()` hook

`deleteMany()` can have middleware, but it runs once for the whole delete operation, not once per deleted document.

```ts
UserSchema.pre('deleteMany', async function () {
  const filter = this.getFilter();

  const users = await this.model.find(filter).select('_id role').lean();
  const userIds = users.map(user => user._id);

  if (users.some(user => user.role === 'admin')) {
    throw new Error('Bulk delete contains admin user');
  }

  await UserPost.deleteMany({ user: { $in: userIds } });
});
```

Usage:

```ts
await User.deleteMany({ isActive: false });
```

## D. Service-layer cleanup is often clearer

For complex delete logic, a service function is often easier to understand and test than hiding everything in middleware.

```ts
async function deleteUserWithCleanup(userId: string) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');
      if (user.role === 'admin') throw new Error('Admin users cannot be deleted');

      await UserPost.deleteMany({ user: user._id }).session(session);
      await UserActivity.updateMany(
        { user: user._id },
        { $set: { user: null, 'details.anonymized': true } },
        { session }
      );
      await user.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }
}
```

## Final takeaway

- Do not use `remove()` in modern Mongoose notes.
- Use document middleware when deleting a specific loaded document.
- Use query middleware for `Model.deleteOne()` / `Model.deleteMany()`.
- `deleteMany()` middleware runs once per operation, not per affected document.
- For complex cleanup, service-layer code plus transactions is often the cleanest approach.
