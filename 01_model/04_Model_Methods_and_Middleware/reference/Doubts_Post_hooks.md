# Doubts Post Hooks — Updated Notes

## Question 1

> Does parameter `doc` mean `this` here?
>
> ```ts
> ProductSchema.post('save', async function(doc, next) {})
> ```

## Answer

For `post('save')` document middleware, `doc` and `this` usually refer to the same saved document.

```ts
ProductSchema.post('save', function (doc) {
  console.log(doc.name);  // saved document
  console.log(this.name); // same document in normal function syntax
});
```

But keep these differences clear:

1. `doc` is the document passed by Mongoose to the post hook.
2. `this` is the function context.
3. In query middleware like `pre('find')`, `this` is a query object, not a document.
4. Do **not** use arrow functions when you need `this`.

```ts
// Good
schema.pre('save', function () {
  console.log(this.email);
});

// Avoid when you need `this`
schema.pre('save', () => {
  console.log(this); // not the Mongoose document
});
```

## Async post hook styles

There are two correct styles.

### Style 1: Promise/async style, no `next`

```ts
ProductSchema.post('save', async function (doc) {
  await ProductActivity.create({ product: doc._id, action: 'saved' });
});
```

### Style 2: Callback style with `next`

```ts
ProductSchema.post('save', async function (doc, next) {
  try {
    await ProductActivity.create({ product: doc._id, action: 'saved' });
    next();
  } catch (err) {
    next(err);
  }
});
```

If your post hook has a `next` parameter, you are responsible for calling `next()`.

## Important caveat: `isNew` in `post('save')`

After a successful save, Mongoose sets `isNew` / `$isNew` to `false` before `post('save')` runs. So this is not reliable:

```ts
schema.post('save', function (doc) {
  if (this.isNew) {        // usually false here
    console.log('created');
  }
});
```

Use `$locals` to store it in `pre('save')`:

```ts
schema.pre('save', function () {
  this.$locals.wasNew = this.isNew;
});

schema.post('save', function (doc) {
  if (doc.$locals.wasNew) {
    console.log('created');
  } else {
    console.log('updated');
  }
});
```

---

# Getters and Setters in Mongoose

## Getters

Getters run when you **read/access** a property on a hydrated Mongoose document. They transform the value for your application, but they do not change the raw value stored in MongoDB.

```ts
const productSchema = new Schema({
  price: {
    type: Number,
    get: v => `₹${v}`
  }
});

const product = await Product.findOne();
console.log(product.price); // getter runs
```

Common use cases:

- formatting values for display
- hiding/obfuscating sensitive values
- converting units while reading

## Setters

Setters run when you **set/write** a value. They transform data before Mongoose stores/sends it to MongoDB.

```ts
const userSchema = new Schema({
  email: {
    type: String,
    set: v => v.toLowerCase().trim()
  }
});

const user = new User({ email: '  TEST@EXAMPLE.COM ' });
console.log(user.email); // test@example.com
```

Mongoose also runs setters on update operations like `updateOne()`.

```ts
await User.updateOne(
  { _id },
  { email: 'TEST@EXAMPLE.COM' }
);
// email setter can run and lowercase the value
```

In update setters, `this` can be the query object instead of a document. If you only want a setter to run for document assignment, guard it:

```ts
function toLower(email: string) {
  if (!(this instanceof mongoose.Document)) {
    return email; // skip query updates
  }
  return email.toLowerCase();
}
```

---

# Lean Queries

`lean()` tells Mongoose to skip hydrating results into full Mongoose documents. Result: faster and lighter queries, but plain JavaScript objects.

```ts
const normalDoc = await User.findOne();       // Mongoose document
const leanDoc = await User.findOne().lean();  // plain object
```

Lean result objects do not have:

- change tracking
- getters/setters on returned values
- virtuals
- document methods like `.save()`

Important correction: saying “lean has no middleware triggers” is misleading. Query middleware like `pre('find')` still runs because the query still runs. What lean skips is document hydration and document features on the returned objects.

```ts
schema.pre('find', function () {
  console.log('find middleware still runs');
});

await User.find().lean(); // pre('find') still runs
```

Use lean for read-only API responses or large list queries where you do not need Mongoose document features.

---

# Query Object

Mongoose queries are chainable objects. They do not execute until you `await`, `.then()`, or `.exec()` them.

```ts
const query = User.find({ age: { $gte: 18 } })
  .select('name email')
  .sort('-createdAt')
  .limit(10);

const users = await query;
```

In query middleware, `this` is the query object.

```ts
userSchema.pre('find', function () {
  console.log(this.getFilter());
  this.select('-password');
});
```

---

# Getters/Setters vs Validations Timing

## Getters

Run when reading/accessing a value.

```ts
console.log(user.email); // getter can run here
```

## Setters

Run when assigning a value or in many update operations.

```ts
user.email = 'TEST@EXAMPLE.COM'; // setter runs
await user.save();

await User.updateOne({ _id }, { email: 'NEW@EXAMPLE.COM' }); // setter can run
```

## Validations

- Run on `save()`, `validate()`, and `create()`.
- Do not run on updates by default.
- For updates, set `runValidators: true`.
- Update validators only run on updated paths and only for some update operators.

```ts
await User.updateOne(
  { _id },
  { email: 'invalid' },
  { runValidators: true }
);
```

## Final comparison

| Feature | Runs when? | Changes DB value? |
|---|---|---|
| Getter | When value is read | No |
| Setter | When value is set or update is cast | Yes, value sent/stored is transformed |
| Validation | On save/validate/create; updates only with `runValidators` | No, it checks validity |
