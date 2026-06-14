# Doubts — Mongoose Hooks + Common Methods (Updated)

## Question

> Does hooks run on particular document or on whole collection?

## Answer

Mongoose hooks/middleware are defined on the **schema**, but when they run depends on the middleware type.

## 1. Document middleware

Document middleware runs for a **single document instance**. In document middleware, `this` refers to the document.

Common document middleware:

- `validate`
- `save`
- `updateOne` when registered as document middleware
- `deleteOne` when registered as document middleware
- `init`

Example:

```ts
userSchema.pre('save', function () {
  console.log(this.email); // this = current document
});

const user = new User({ email: 'a@test.com' });
await user.save(); // pre('save') runs for this one document
```

### Important correction about `insertMany()`

`Model.insertMany()` is **not the same as calling `.save()` for every document**.

- `insertMany()` has its own model middleware: `pre('insertMany')`, `post('insertMany')`.
- `insertMany()` does **not** run `pre('save')` / `post('save')` for each document.
- If you need save hooks for every document, use `Model.create([...])` or loop and call `.save()`.

```ts
await User.create([
  { email: 'a@test.com' },
  { email: 'b@test.com' }
]);
// create() triggers save hooks

await User.insertMany([
  { email: 'a@test.com' },
  { email: 'b@test.com' }
]);
// insertMany() triggers insertMany middleware, not save middleware
```

## 2. Query middleware

Query middleware runs once for the **query operation**, not once per document matched by that query. In query middleware, `this` refers to the query object.

Common query middleware:

- `find`
- `findOne`
- `findOneAndUpdate`
- `findOneAndDelete`
- `updateOne`
- `updateMany`
- `deleteOne`
- `deleteMany`

Example:

```ts
userSchema.pre('updateMany', function () {
  console.log(this.getFilter()); // this = query object
});

await User.updateMany({ isActive: false }, { $set: { archived: true } });
// hook runs once, even if 1000 documents match
```

## 3. Model middleware

Model middleware runs on static model functions. In model middleware, `this` refers to the model.

Common model middleware:

- `insertMany`
- `bulkWrite`
- `createCollection`

```ts
userSchema.pre('insertMany', function (next, docs) {
  console.log(docs.length);
  next();
});
```

## Simple rule

- `doc.save()` → document middleware, one document.
- `Model.find()` → query middleware, one query operation.
- `Model.updateMany()` / `Model.deleteMany()` → query middleware, one operation, possibly many documents.
- `Model.insertMany()` → model middleware, not save hooks.

---

# `isModified()` and `isNew`

## `isModified()`

`isModified()` is a Mongoose document method. It checks whether a document path has changed since the document was loaded or created.

```ts
userSchema.pre('save', function () {
  if (!this.isModified('password')) {
    return;
  }

  // hash password only when password changed
});
```

Usage:

```ts
this.isModified('password'); // true if password changed
this.isModified();           // true if any path changed
```

This is very useful in `pre('save')` hooks because you can avoid unnecessary work, like re-hashing an already hashed password.

## `isNew`

`isNew` tells whether the document has never been saved to MongoDB before.

```ts
const user = new User({ email: 'a@test.com' });
console.log(user.isNew); // true

await user.save();
console.log(user.isNew); // false
```

### Important post-save caveat

Inside `post('save')`, `this.isNew` is already false after a successful save. So if you need to know whether the document was new, store it in `pre('save')`.

```ts
userSchema.pre('save', function () {
  this.$locals.wasNew = this.isNew;
});

userSchema.post('save', function (doc) {
  if (doc.$locals.wasNew) {
    console.log('Created new user');
  } else {
    console.log('Updated existing user');
  }
});
```

---

# Common Mongoose methods/properties

## Document methods/properties

```ts
doc.save();
doc.validate();
doc.deleteOne();
doc.isModified('field');
doc.isNew;
doc.toObject();
doc.toJSON();
doc.populate('path');
```

## Model methods

```ts
Model.create();
Model.insertMany();
Model.find();
Model.findOne();
Model.findById();
Model.updateOne();
Model.updateMany();
Model.deleteOne();
Model.deleteMany();
Model.findOneAndUpdate();
Model.findOneAndDelete();
Model.aggregate();
```

## Query methods

```ts
Model.find({ role: 'admin' })
  .select('name email')
  .sort('-createdAt')
  .limit(10)
  .skip(20)
  .populate('team')
  .lean();
```

## Middleware methods

```ts
schema.pre('save', function () {});
schema.post('save', function (doc) {});
schema.pre('find', function () {});
schema.post('find', function (docs) {});
schema.pre('deleteOne', { document: true, query: false }, function () {});
schema.pre('deleteMany', function () {});
```

## Final takeaway

Hooks do **not** simply run on “whole collection” or “particular document” always. The correct answer is:

> Document middleware runs on one document. Query middleware runs once per query operation, and that query may affect one, many, or zero documents.
