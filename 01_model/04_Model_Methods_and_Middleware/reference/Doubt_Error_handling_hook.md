# Doubt Error Handling Hook — Updated Notes

## Code

```ts
OrderSchema.post('save', function (error: Error, doc: IOrder, next: Function) {
  console.error('Error during save operation:', error.message);

  if (error.name === 'ValidationError') {
    console.log('Validation error detected, providing additional context');
  }

  next(error);
});
```

## Why does this post hook have 3 parameters?

This is **error-handling middleware**. It is different from a normal successful `post('save')` hook.

## Normal successful post-save hook

Runs after save succeeds.

```ts
OrderSchema.post('save', function (doc) {
  console.log('Save successful:', doc._id);
});
```

Async version without `next`:

```ts
OrderSchema.post('save', async function (doc) {
  await AuditLog.create({ order: doc._id, action: 'saved' });
});
```

Async version with `next`:

```ts
OrderSchema.post('save', async function (doc, next) {
  try {
    await AuditLog.create({ order: doc._id, action: 'saved' });
    next();
  } catch (err) {
    next(err);
  }
});
```

If your hook has a `next` parameter, you must call `next()`.

## Error-handling post-save hook

Runs only when the save operation throws/rejects.

```ts
OrderSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    return next(new Error('Duplicate key error'));
  }

  next(error);
});
```

Parameters:

1. `error` — the error that occurred.
2. `doc` — the document involved in the failed operation.
3. `next` — pass the error forward, or pass a transformed error.

## Important caveat

Error-handling middleware can **transform** an error, but it cannot fully remove/swallow the fact that the operation failed. Even if you call `next()` with no error in an error-handling middleware, the original operation still rejects/errors.

So this is correct:

```ts
next(error); // preserve original error
```

Or this, when transforming:

```ts
next(new Error('User-friendly message'));
```

## Common use cases

- Convert duplicate key errors into cleaner app messages.
- Add context to validation errors.
- Log errors to monitoring tools.
- Normalize MongoDB/Mongoose error shapes before they reach route handlers.

## Example with Express route

```ts
try {
  await order.save();
  res.status(201).json(order);
} catch (err) {
  // error-handling middleware may have transformed err
  res.status(400).json({ message: err.message });
}
```

## Final takeaway

Normal `post('save')` handles success. `post('save', function(error, doc, next) {})` is special error middleware and handles failure.
