# Model Methods aur Middleware in Mongoose

> Scope note: yeh topic **Mongoose** ka hai, plain MongoDB ka nahi. MongoDB database hai. Mongoose Node.js app ke andar ODM layer provide karta hai: schema, model, validation, methods, middleware/hooks, getters/setters, query helpers, etc.

## Big Picture

Mongoose model sirf database collection ka wrapper nahi hota. Model ke through hum app-level behavior bhi add kar sakte hain.

Simple mental model:

```text
Schema = document ka structure + rules + behavior
Model = collection ke saath kaam karne ka class-like object
Document = model se bana hua single record/object
Query = database operation ka pending object
Middleware/Hook = operation se pehle ya baad automatic run hone wala function
```

Is chapter mein main confusion yeh hota hai:

```text
method kis par call hoga?
this kis cheez ko point karega?
hook kab run hoga?
operation one document par hai ya query par?
```

Yeh notes isi order mein samjho:

1. Instance methods: single document ke methods.
2. Static methods: model-level methods.
3. Query helpers: query chain ko readable banana.
4. Pre-save hooks: save se pehle kaam.
5. Post-save hooks: save ke baad kaam.
6. Validation hooks: validation ke before/after kaam.
7. Getters/setters: read/write ke time value transform.
8. Delete hooks: delete operations ke before/after kaam.
9. Error handling middleware.
10. Common method map.

---

## 1. Instance Methods

### Why

Instance method ka matlab: ek custom function jo **single document instance** par available hota hai.

Example:

```ts
const user = await User.findById(userId);
user.getFullName();
user.updateLastLogin();
```

Yahan `user` ek single document hai. Isliye jo method `user` par call hota hai, woh instance method hai.

Use cases:

- user ka full name calculate karna
- password verify karna
- public profile banana
- document ki field update karke `save()` karna

### Code

```ts
import mongoose, { Schema, model, Model, HydratedDocument } from 'mongoose';

interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'editor';
  isActive: boolean;
  lastLogin?: Date;
}

interface IUserMethods {
  getFullName(): string;
  getPublicProfile(): object;
  verifyPassword(password: string): boolean;
  updateLastLogin(): Promise<void>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['user', 'admin', 'editor'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

UserSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

UserSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

UserSchema.methods.verifyPassword = function (password: string) {
  // Real apps mein bcrypt.compare() use karna chahiye.
  return this.password === password;
};

UserSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

const User = model<IUser, UserModel>('User', UserSchema);
```

Usage:

```ts
const user = await User.findOne({ email: 'amit@example.com' });

if (user) {
  console.log(user.getFullName());
  console.log(user.getPublicProfile());

  if (user.verifyPassword('secret123')) {
    await user.updateLastLogin();
  }
}
```

### Code Samjho

```ts
UserSchema.methods.getFullName = function () {}
```

Iska matlab: `User` document par `getFullName()` naam ka custom method available hoga.

Important:

- Instance method hamesha document par call hota hai: `user.getFullName()`.
- Instance method ke andar `this` current document hota hai.
- Isliye `this.firstName`, `this.lastName`, `this.password` access kar pa rahe hain.
- Arrow function use mat karo jab `this` chahiye.

Wrong pattern:

```ts
UserSchema.methods.getFullName = () => {
  return `${this.firstName} ${this.lastName}`; // this document nahi hoga
};
```

Correct pattern:

```ts
UserSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};
```

`updateLastLogin()` mein:

```ts
this.lastLogin = new Date();
await this.save();
```

Yeh current user document ko modify karta hai aur phir same document ko save karta hai. Kyunki `save()` use ho raha hai, save middleware bhi run ho sakta hai.

Related doubts:

- [Common Methods Section 1: document middleware and instance methods](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: `isModified()` and `isNew`](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: document methods/properties](reference/Doubts_middleware_types_and_common_methods.md)

---

## 2. Static Methods

### Why

Static method ka matlab: custom function jo **Model** par available hota hai, document par nahi.

Example:

```ts
Product.findByCategory('laptop');
Product.findOutOfStock();
Product.updateStock(productId, 5);
```

Yahan `Product` model hai. Isliye yeh static methods hain.

Use cases:

- common query ko reusable banana
- model-level business operation banana
- aggregate calculation karna
- helper method jisme pehle document find hota hai, phir save hota hai

### Code

```ts
interface IProduct {
  name: string;
  category: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

interface IProductModel extends Model<IProduct> {
  findByCategory(category: string): Promise<HydratedDocument<IProduct>[]>;
  findOutOfStock(): Promise<HydratedDocument<IProduct>[]>;
  getAvgPriceByCategory(category: string): Promise<number>;
  updateStock(productId: string, quantity: number): Promise<HydratedDocument<IProduct>>;
}

const ProductSchema = new Schema<IProduct, IProductModel>({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

ProductSchema.statics.findOutOfStock = function () {
  return this.find({ stock: 0 });
};

ProductSchema.statics.getAvgPriceByCategory = async function (category: string) {
  const result = await this.aggregate([
    { $match: { category } },
    { $group: { _id: null, averagePrice: { $avg: '$price' } } }
  ]);

  return result.length ? result[0].averagePrice : 0;
};

ProductSchema.statics.updateStock = async function (productId: string, quantity: number) {
  const product = await this.findById(productId);
  if (!product) throw new Error('Product not found');

  product.stock += quantity;
  product.isAvailable = product.stock > 0;

  if (product.stock < 0) {
    product.stock = 0;
    product.isAvailable = false;
  }

  return product.save(); // save hooks run here
};

const Product = model<IProduct, IProductModel>('Product', ProductSchema);
```

Usage:

```ts
const laptops = await Product.findByCategory('laptop');
const outOfStockProducts = await Product.findOutOfStock();
const avgPrice = await Product.getAvgPriceByCategory('laptop');
const updatedProduct = await Product.updateStock(productId, -2);
```

### Code Samjho

```ts
ProductSchema.statics.findByCategory = function (category) {
  return this.find({ category });
};
```

Static method ke andar `this` model hota hai. Is example mein `this` roughly `Product` model hai. Isliye `this.find()`, `this.aggregate()`, `this.findById()` use ho raha hai.

Instance vs static difference:

```text
user.getFullName()
= document par method
= instance method

Product.findByCategory('laptop')
= model par method
= static method
```

`updateStock()` example important hai:

```ts
const product = await this.findById(productId);
product.stock += quantity;
return product.save();
```

Yahan static method pehle model se document find karta hai. Phir document ko update karta hai. Phir `product.save()` call karta hai. Isliye save hooks run ho sakte hain.

### Important `insertMany()` Note

Seed data insert karte waqt yeh common confusion hota hai:

```ts
await Product.create(products);     // save hooks run ho sakte hain
await Product.insertMany(products); // insertMany middleware run hota hai, save hooks nahi
```

`insertMany()` fast bulk insert ke liye hota hai. Yeh har document par `save()` call nahi karta. Isliye `pre('save')` / `post('save')` per document run nahi hote.

### Model Middleware Example: `insertMany()`

Model middleware static model functions par run hota hai. Isme `this` model hota hai.

```ts
ProductSchema.pre('insertMany', function (next, docs) {
  console.log(`Inserting ${docs.length} products`);
  next();
});

await Product.insertMany([
  { name: 'Keyboard', category: 'accessories', price: 1200, stock: 10 },
  { name: 'Mouse', category: 'accessories', price: 700, stock: 25 }
]);
```

Simple rule:

```text
doc.save()
= document middleware
= one document

Model.find()
= query middleware
= one query operation

Model.updateMany() / Model.deleteMany()
= query middleware
= one query operation, but many documents affect ho sakte hain

Model.insertMany()
= model middleware
= save hooks per document nahi
```

Related doubts:

- [Common Methods Section 3: model middleware and `insertMany()`](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: model methods](reference/Doubts_middleware_types_and_common_methods.md)

---

## 3. Query Helpers

### Why

Query helper ka kaam query chain ko readable aur reusable banana hai.

Without query helper:

```ts
await BlogPost.find({ status: 'published', tags: 'mongodb' })
  .sort({ likes: -1 })
  .limit(10);
```

With query helper:

```ts
await BlogPost.find()
  .published()
  .popular()
  .withTag('mongodb')
  .limit(10);
```

Second version zyada readable hai. Yeh business language jaisa lagta hai.

### Code

```ts
interface IBlogPost {
  title: string;
  author: string;
  tags: string[];
  likes: number;
  comments: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
}

interface BlogPostQueryHelpers {
  published(): mongoose.QueryWithHelpers<any, HydratedDocument<IBlogPost>, BlogPostQueryHelpers>;
  popular(): mongoose.QueryWithHelpers<any, HydratedDocument<IBlogPost>, BlogPostQueryHelpers>;
  withTag(tag: string): mongoose.QueryWithHelpers<any, HydratedDocument<IBlogPost>, BlogPostQueryHelpers>;
}

const BlogPostSchema = new Schema<IBlogPost, Model<IBlogPost, BlogPostQueryHelpers>, {}, BlogPostQueryHelpers>({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, index: true },
  tags: { type: [String], index: true },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date
}, { timestamps: true });

BlogPostSchema.query.published = function () {
  return this.where({ status: 'published' });
};

BlogPostSchema.query.popular = function () {
  return this.where({ likes: { $gte: 10 } }).sort({ likes: -1 });
};

BlogPostSchema.query.withTag = function (tag: string) {
  return this.where({ tags: tag });
};

const BlogPost = model('BlogPost', BlogPostSchema);

const posts = await BlogPost.find()
  .published()
  .popular()
  .withTag('mongodb')
  .limit(10);
```

### Code Samjho

```ts
BlogPostSchema.query.published = function () {
  return this.where({ status: 'published' });
};
```

Query helper ke andar `this` query object hota hai. Isliye `this.where()`, `this.sort()`, `this.limit()` jaise query methods use kar sakte hain.

Important:

- Query helper query execute nahi karta.
- Query tab execute hoti hai jab `await`, `.then()`, ya `.exec()` use hota hai.
- Query helper ko chain mein use karte hain.

### Query Object

Mongoose query ek chainable object hota hai. Yeh immediately database query run nahi karta.

```ts
const query = User.find({ role: 'admin' })
  .select('firstName lastName email')
  .sort('-createdAt')
  .limit(10);

const users = await query;
```

Yahan `User.find()` ke baad jo object milta hai, woh query object hai. Jab tak `await query` nahi hota, database se result nahi aata.

Query middleware mein bhi `this` query object hota hai:

```ts
UserSchema.pre('find', function () {
  console.log(this.getFilter());
  this.select('-password');
});
```

Is code ka meaning:

- `pre('find')` find query se pehle run hoga.
- `this.getFilter()` current query filter return karega.
- `this.select('-password')` query result se password hide karega.

### `lean()`

By default Mongoose result ko hydrated Mongoose document banata hai. Hydrated document ke paas methods, getters, virtuals, change tracking, `.save()` etc. hote hain.

`lean()` bolta hai:

```text
Mujhe simple JavaScript object chahiye, full Mongoose document nahi.
```

```ts
const normalDoc = await User.findOne();       // Mongoose document
const leanDoc = await User.findOne().lean();  // plain object
```

Lean result objects mein yeh nahi hote:

- document methods like `.save()`
- change tracking
- getters/setters on returned values
- virtuals

Important nuance:

```text
lean() query middleware ko stop nahi karta.
lean() hydration/document features skip karta hai.
```

Example:

```ts
UserSchema.pre('find', function () {
  console.log('find middleware still runs');
});

await User.find().lean(); // pre('find') still runs
```

Related doubts:

- [Post Hooks Section: Query Object](reference/Doubts_Post_hooks.md)
- [Post Hooks Section: Lean Queries](reference/Doubts_Post_hooks.md)
- [Common Methods Section 2: query middleware](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: query methods](reference/Doubts_middleware_types_and_common_methods.md)

---

## 4. Pre-save Hooks

### Why

Pre-save hook `save()` se pehle run hota hai. Iska use tab hota hai jab document database mein save hone se pehle kuch automatic kaam karna ho.

Common use cases:

- password hash karna
- slug generate karna
- default display name set karna
- last modified date set karna
- invalid condition par save stop karna

Mental model:

```text
new User(...)
  -> validate
  -> pre('save') hooks
  -> MongoDB write
  -> post('save') hooks
```

In `pre('save')`, `this` current document hota hai.

### Code

```ts
import crypto from 'crypto';

interface IUserAccount {
  username: string;
  email: string;
  password: string;
  passwordSalt?: string;
  displayName?: string;
  slug?: string;
  lastModified?: Date;
}

const UserAccountSchema = new Schema<IUserAccount>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  passwordSalt: String,
  displayName: { type: String, trim: true },
  slug: { type: String, unique: true },
  lastModified: { type: Date, default: Date.now }
});

UserAccountSchema.pre('save', function () {
  if (!this.displayName) {
    this.displayName = this.username.charAt(0).toUpperCase() + this.username.slice(1);
  }
});

UserAccountSchema.pre('save', function () {
  if (this.isModified('username') || this.isNew) {
    this.slug = this.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
});

UserAccountSchema.pre('save', function () {
  if (!this.isModified('password')) return;

  const salt = crypto.randomBytes(16).toString('hex');
  this.passwordSalt = salt;
  this.password = crypto.pbkdf2Sync(this.password, salt, 1000, 64, 'sha512').toString('hex');
});

UserAccountSchema.pre('save', function () {
  if (this.isModified()) {
    this.lastModified = new Date();
  }
});

UserAccountSchema.pre('save', function () {
  if (this.email === 'test@example.com') {
    throw new Error('test@example.com emails are not allowed');
  }
});
```

### Code Samjho

```ts
UserAccountSchema.pre('save', function () {})
```

Iska meaning:

```text
Jab bhi document save hone wala ho, save se pehle yeh function run karo.
```

`this` current document hai, so:

```ts
this.displayName = ...
this.slug = ...
this.password = ...
```

direct document fields update kar rahe hain.

### `isModified()` and `isNew`

`isModified()` batata hai ki document ka specific path change hua hai ya nahi.

```ts
UserAccountSchema.pre('save', function () {
  if (!this.isModified('password')) {
    return;
  }

  // hash password only when password changed
});
```

Why useful?

```text
Password har save par re-hash nahi hona chahiye.
Sirf password change hua hai tab hash karo.
```

`isNew` batata hai document pehli baar save ho raha hai ya pehle se database mein tha.

```ts
const user = new User({ firstName: 'Amit', lastName: 'Kumar', email: 'amit@example.com' });
console.log(user.isNew); // true

await user.save();
console.log(user.isNew); // false
```

Important caveat:

```text
post('save') ke andar isNew already false ho sakta hai.
Create/update ka difference post hook mein chahiye toh pre('save') mein $locals mein store karo.
```

### `next` kab use karein?

Modern Mongoose mein aap promise/async style use kar sakte ho:

```ts
UserAccountSchema.pre('save', async function () {
  await doSomething();
});
```

Callback style bhi possible hai:

```ts
UserAccountSchema.pre('save', function (next) {
  if (!this.email) {
    return next(new Error('Email required'));
  }

  next();
});
```

If you use `next`, then `return next(...)` useful hota hai taaki function aage accidentally continue na kare.

Related doubts:

- [Common Methods Section: `isModified()` and `isNew`](reference/Doubts_middleware_types_and_common_methods.md)

---

## 5. Post-save Hooks

### Why

Post-save hook document save hone ke baad run hota hai.

Use cases:

- activity log create karna
- notification bhejna
- audit entry banana
- low stock alert create karna

Important:

```text
post('save') mein DB write already ho chuka hota hai.
Lekin post hook error throw kare, toh save() ka returned promise reject ho sakta hai.
```

### Create vs Update Logs

Common mistake:

```ts
ProductSchema.post('save', function (doc) {
  if (this.isNew) {
    // unreliable
  }
});
```

Problem:

```text
Successful save ke baad Mongoose isNew ko false kar deta hai.
Isliye post('save') mein direct isNew par rely mat karo.
```

Correct approach:

```text
pre('save') mein flags $locals mein store karo.
post('save') mein wahi flags read karo.
```

### Code

```ts
interface IProductActivity {
  product: mongoose.Types.ObjectId;
  action: 'created' | 'stock_changed' | 'price_changed' | 'low_stock';
  details: any;
}

const ProductActivitySchema = new Schema<IProductActivity>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  action: { type: String, required: true },
  details: Schema.Types.Mixed
}, { timestamps: true });

const ProductActivity = model<IProductActivity>('ProductActivity', ProductActivitySchema);

ProductSchema.pre('save', async function () {
  this.$locals.wasNew = this.isNew;
  this.$locals.stockModified = this.isModified('stock');
  this.$locals.priceModified = this.isModified('price');

  if (!this.isNew && (this.isModified('stock') || this.isModified('price'))) {
    const previous = await this.constructor.findById(this._id).select('stock price').lean();
    this.$locals.previousStock = previous?.stock;
    this.$locals.previousPrice = previous?.price;
  }

  this.isAvailable = this.stock > 0;
});

ProductSchema.post('save', async function (doc) {
  if (doc.$locals.wasNew) {
    await ProductActivity.create({
      product: doc._id,
      action: 'created',
      details: {
        name: doc.name,
        category: doc.category,
        initialStock: doc.stock,
        initialPrice: doc.price
      }
    });
    return;
  }

  if (doc.$locals.stockModified) {
    await ProductActivity.create({
      product: doc._id,
      action: 'stock_changed',
      details: {
        previousStock: doc.$locals.previousStock,
        newStock: doc.stock,
        change: doc.stock - doc.$locals.previousStock
      }
    });
  }

  if (doc.$locals.priceModified) {
    await ProductActivity.create({
      product: doc._id,
      action: 'price_changed',
      details: {
        previousPrice: doc.$locals.previousPrice,
        newPrice: doc.price
      }
    });
  }

  if (doc.stock > 0 && doc.stock < 5) {
    await ProductActivity.create({
      product: doc._id,
      action: 'low_stock',
      details: { stock: doc.stock }
    });
  }
});
```

### Code Samjho

In `pre('save')`:

```ts
this.$locals.wasNew = this.isNew;
this.$locals.stockModified = this.isModified('stock');
```

`$locals` temporary storage hai. Yeh database mein save nahi hota. Yeh same document lifecycle ke during pre hook se post hook tak data carry karne ke kaam aata hai.

In `post('save')`:

```ts
ProductSchema.post('save', async function (doc) {})
```

`doc` saved document hai. Document middleware mein usually `doc` aur `this` same saved document ko point karte hain.

Important:

- Previous DB values post hook mein automatically available nahi hote.
- Agar old value chahiye, pre hook mein query karke `$locals` mein store karo.
- Post hook side effects ke liye useful hai, jaise activity log.

### Async Post-hook Styles

Promise/async style:

```ts
ProductSchema.post('save', async function (doc) {
  await ProductActivity.create({
    product: doc._id,
    action: 'created',
    details: { name: doc.name }
  });
});
```

Callback style with `next`:

```ts
ProductSchema.post('save', async function (doc, next) {
  try {
    await ProductActivity.create({
      product: doc._id,
      action: 'created',
      details: { name: doc.name }
    });

    next();
  } catch (error) {
    next(error);
  }
});
```

Simple rule:

```text
async function style use kar rahe ho -> next usually needed nahi.
callback style use kar rahe ho -> next() / next(error) call karo.
```

Related doubts:

- [Post Hooks Question 1: does `doc` mean `this`?](reference/Doubts_Post_hooks.md)
- [Post Hooks Section: async post hook styles](reference/Doubts_Post_hooks.md)
- [Post Hooks Section: important `isNew` caveat in `post('save')`](reference/Doubts_Post_hooks.md)
- [Common Methods Section: important post-save `isNew` caveat](reference/Doubts_middleware_types_and_common_methods.md)

---

## 6. Pre/Post Validation Hooks

### Why

Validation hooks validation phase ke around run hote hain.

Use `pre('validate')` when:

- validation se pehle derived value calculate karni ho
- kisi field ko validation ke before set karna ho
- cross-field validation karni ho

Use `post('validate')` when:

- validation pass hone ke baad logging/side effect karna ho
- validation ke result ke baad non-critical work karna ho

Important order:

```text
pre('validate')
validation
post('validate')
pre('save')
MongoDB write
post('save')
```

### Code

```ts
interface IOrder {
  customerName: string;
  email: string;
  phone?: string;
  items: { product: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'cod';
}

const OrderSchema = new Schema<IOrder>({
  customerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  items: [{
    product: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['credit_card', 'debit_card', 'upi', 'cod'], required: true }
});

OrderSchema.pre('validate', function () {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
});

OrderSchema.pre('validate', function () {
  if (this.paymentMethod === 'cod' && !this.phone) {
    this.invalidate('phone', 'Phone number is required for Cash on Delivery orders');
  }
});

OrderSchema.post('validate', function (doc) {
  if (doc.totalAmount > 10000) {
    console.log(`HIGH VALUE ORDER: Rs. ${doc.totalAmount}`);
  }
});
```

### Code Samjho

```ts
OrderSchema.pre('validate', function () {
  this.totalAmount = ...
});
```

Validation se pehle `totalAmount` calculate ho raha hai. Iska benefit:

```text
totalAmount required/min validator run hone se pehle value ready ho jayegi.
```

```ts
this.invalidate('phone', 'Phone number is required for Cash on Delivery orders');
```

`invalidate()` manually field ko invalid mark karta hai. Isse Mongoose validation error create karega.

Yahan rule hai:

```text
paymentMethod cod hai -> phone required
otherwise phone optional
```

Related concept:

```text
save() automatically validation trigger karta hai.
validate() manually validation run karta hai.
create() bhi validation run karta hai.
```

---

## 7. Getters, Setters, and Validation Timing

### Why

Getter/setter ka kaam value ko read/write ke time transform karna hai.

Simple difference:

```text
Getter = value read karte waqt transform
Setter = value set/save/update karte waqt transform
Validation = value allowed hai ya nahi check
```

### Getters

Getter tab run hota hai jab hydrated Mongoose document se value read/access hoti hai.

```ts
const ProductPriceSchema = new Schema({
  price: {
    type: Number,
    get: v => `Rs. ${v}`
  }
});

const product = await Product.findOne();
console.log(product.price); // getter runs
```

Code samjho:

```text
MongoDB mein price number ke form mein store ho sakta hai.
App mein read karte waqt getter usko formatted string bana sakta hai.
Getter raw DB value ko change nahi karta.
```

### Setters

Setter tab run hota hai jab value assign hoti hai ya update casting ke during value process hoti hai.

```ts
const UserEmailSchema = new Schema({
  email: {
    type: String,
    set: v => v.toLowerCase().trim()
  }
});

const user = new User({ email: '  TEST@EXAMPLE.COM ' });
console.log(user.email); // test@example.com
```

Mongoose update operations mein bhi setters run ho sakte hain:

```ts
await User.updateOne(
  { _id },
  { email: 'TEST@EXAMPLE.COM' }
);
```

In update setters, `this` document nahi, query object ho sakta hai. Agar setter sirf document assignment ke liye run karna hai, guard laga sakte ho:

```ts
function toLower(email: string) {
  if (!(this instanceof mongoose.Document)) {
    return email; // skip query updates
  }

  return email.toLowerCase();
}
```

### Timing Summary

| Feature | Kab run hota hai? | DB value change karta hai? |
|---|---|---|
| Getter | Jab value read/access hoti hai | No |
| Setter | Jab value set hoti hai ya update cast hota hai | Yes, transformed value store/send hoti hai |
| Validation | `save()`, `validate()`, `create()`; updates only with `runValidators` | No, validity check karta hai |

Related doubts:

- [Post Hooks Section: getters and setters](reference/Doubts_Post_hooks.md)
- [Post Hooks Section: getters/setters vs validations timing](reference/Doubts_Post_hooks.md)

---

## 8. Delete Hooks

### Why

Delete hooks delete operation ke before/after run hote hain.

Use cases:

- user delete hone par uske posts cleanup karna
- admin user delete prevent karna
- activity logs anonymize karna
- cascading cleanup karna

Modern Mongoose notes ke liye important:

```text
remove() outdated hai.
deleteOne() / deleteMany() use karo.
```

Delete hooks mein biggest confusion:

```text
doc.deleteOne() -> document middleware
Model.deleteOne() -> query middleware
Model.deleteMany() -> query middleware, once per operation
```

### Document-level Delete Middleware

Document-level middleware tab useful hai jab aap pehle document load kar rahe ho, phir us document par delete call kar rahe ho.

```ts
UserSchema.pre('deleteOne', { document: true, query: false }, async function () {
  if (this.role === 'admin') {
    throw new Error('Admin users cannot be deleted');
  }

  await UserPost.deleteMany({ user: this._id });
});

UserSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  await UserActivity.updateMany(
    { user: doc._id },
    {
      $set: {
        user: null,
        details: {
          anonymized: true,
          deletedAt: new Date(),
          deletedUserRole: doc.role
        }
      }
    }
  );
});
```

Usage:

```ts
const user = await User.findById(userId);
await user.deleteOne(); // document middleware runs
```

Code samjho:

- `this` document hai.
- `this.role` access kar sakte hain.
- `this._id` se related posts delete kar sakte hain.
- `post('deleteOne')` mein `doc` deleted document ko represent karta hai.
- `user: null` ka use activity logs ko anonymize karne ke liye ho sakta hai.

### Query-level `deleteMany()` Middleware

Query-level middleware query operation par run hota hai. Yeh affected har document ke liye alag se run nahi hota.

```ts
UserSchema.pre('deleteMany', async function () {
  const filter = this.getFilter();
  const users = await this.model.find(filter).select('_id role').lean();

  if (users.some(user => user.role === 'admin')) {
    throw new Error('Cannot bulk delete admin users');
  }

  await UserPost.deleteMany({ user: { $in: users.map(u => u._id) } });
});
```

Usage:

```ts
await User.deleteMany({ isActive: false }); // query middleware runs once
```

Code samjho:

- `this` query object hai.
- `this.getFilter()` delete query ka filter return karta hai.
- Query middleware ke paas deleted documents automatically nahi hote.
- Agar document fields chahiye, pehle `this.model.find(filter)` se documents fetch karo.

### Query-level `Model.deleteOne()` Middleware

`Model.deleteOne()` bhi query middleware trigger karta hai by default.

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

### Service-layer Cleanup for Complex Deletes

Complex delete logic hooks mein hide karne se debugging hard ho sakti hai. Service function explicit hota hai aur transaction use kar sakta hai.

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

When service-layer better hai:

- multiple collections update/delete ho rahi hain
- transaction chahiye
- business flow clearly visible rakhna hai
- testing easier chahiye

Related doubts:

- [Delete Hooks Section 1: `user: null` and anonymized details](reference/Doubts_delete_hooks.md)
- [Delete Hooks Section 2: modern delete middleware, not `remove()`](reference/Doubts_delete_hooks.md)
- [Delete Hooks Section A: document-level delete hook](reference/Doubts_delete_hooks.md)
- [Delete Hooks Section B/C: query-level `deleteOne()` and `deleteMany()` hooks](reference/Doubts_delete_hooks.md)
- [Delete Hooks Section D: service-layer cleanup is often clearer](reference/Doubts_delete_hooks.md)

---

## 9. Error Handling in Middleware

### Why

Middleware ke andar error throw/reject karne se operation stop ho sakta hai.

Use cases:

- invalid business condition par save stop karna
- async process fail ho toh operation abort karna
- duplicate key error ko clean message mein convert karna
- non-critical post-save work fail ho toh main operation ko fail na karna

### Pre-hook Errors

If pre hook throws or rejects, Mongoose operation stop kar deta hai.

```ts
OrderSchema.pre('save', function () {
  if (!this.items || this.items.length === 0) {
    throw new Error('Order must have at least one item');
  }
});
```

Code samjho:

```text
Order save hone se pehle check hoga.
Items missing hain toh error throw hoga.
Save operation abort ho jayega.
```

### Async Pre-hook Errors

```ts
OrderSchema.pre('save', async function () {
  await this.calculateTotal();
});
```

If `calculateTotal()` throw/reject karta hai, save abort ho jayega.

### Recoverable Errors

Kabhi-kabhi error aane par operation stop nahi karna hota, balki document ko failed state mein save karna hota hai.

```ts
OrderSchema.pre('save', async function () {
  try {
    await this.processPayment();
  } catch (err) {
    if (err instanceof PaymentError) {
      this.status = 'failed';
      this.paymentStatus = 'failed';
      return; // continue saving failed order state
    }

    throw err; // unknown error par abort
  }
});
```

Code samjho:

- Payment fail hua but known business failure hai -> order failed state mein save ho sakta hai.
- Unknown error hai -> throw karo, save abort.

### Post-save Non-critical Work

Post-save hook mein non-critical kaam fail ho sakta hai, jaise notification. Agar aap nahi chahte ki caller ka `save()` fail ho, error catch karo.

```ts
OrderSchema.post('save', async function (doc) {
  try {
    await doc.notifyCustomer();
  } catch (err) {
    console.error('Notification failed, queue retry:', err);
  }
});
```

### Error-handling Middleware

Error-handling middleware special post middleware hota hai jisme first parameter `error` hota hai.

Normal successful post-save hook:

```ts
OrderSchema.post('save', function (doc) {
  console.log('Order saved:', doc._id);
});
```

Error-handling post-save hook:

```ts
OrderSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    return next(new Error('Duplicate order number'));
  }

  next(error);
});
```

Code samjho:

```text
post('save', function (doc) {})
= success ke baad run hota hai

post('save', function (error, doc, next) {})
= save ke during error aaya toh run hota hai
```

Important caveat:

```text
Error-handling middleware error ko transform kar sakta hai.
Lekin original operation failed hi rehta hai.
Route/service ko try/catch handle karna hoga.
```

### Express Route Example

```ts
app.post('/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({
      message: err.message
    });
  }
});
```

Yahan flow:

1. Route `order.save()` call karta hai.
2. Save ke during validation/save middleware/error middleware run ho sakta hai.
3. Error transform hua toh catch block transformed message bhej sakta hai.
4. Route mein `try/catch` still zaroori hai.

Related doubts:

- [Error Hook Section: why post-save error hook has 3 parameters](reference/Doubt_Error_handling_hook.md)
- [Error Hook Section: normal post-save vs error-handling post-save hook](reference/Doubt_Error_handling_hook.md)
- [Error Hook Section: important caveat about transforming errors](reference/Doubt_Error_handling_hook.md)
- [Error Hook Section: Express route example](reference/Doubt_Error_handling_hook.md)

---

## 10. Common Mongoose Method Map

### Why

Revision ke time sabse useful cheez yeh hai ki aap identify kar pao:

```text
yeh document method hai?
yeh model method hai?
yeh query method hai?
yeh middleware registration hai?
```

### Document Methods / Properties

Single document instance par:

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

Examples:

```ts
const user = await User.findById(userId);

await user.save();
await user.deleteOne();
console.log(user.isModified('email'));
```

### Model Methods

Model par:

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

Examples:

```ts
await User.create({ name: 'Amit' });
await User.updateMany({ isActive: false }, { $set: { archived: true } });
await User.deleteOne({ _id: userId });
```

### Query Methods

Query chain par:

```ts
Model.find({ role: 'admin' })
  .select('name email')
  .sort('-createdAt')
  .limit(10)
  .skip(20)
  .populate('team')
  .lean();
```

### Middleware Methods

Schema par register hote hain:

```ts
schema.pre('save', function () {});
schema.post('save', function (doc) {});
schema.pre('find', function () {});
schema.post('find', function (docs) {});
schema.pre('deleteOne', { document: true, query: false }, function () {});
schema.pre('deleteMany', function () {});
```

Related doubts:

- [Common Methods Section: document methods/properties](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: model methods](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: query methods](reference/Doubts_middleware_types_and_common_methods.md)
- [Common Methods Section: middleware methods](reference/Doubts_middleware_types_and_common_methods.md)

---

# Quick Cheat Sheet

| Concept | Where defined | Called on | `this` means |
|---|---|---|---|
| Instance method | `schema.methods` | `doc.method()` | document |
| Static method | `schema.statics` | `Model.method()` | model |
| Query helper | `schema.query` | `Model.find().helper()` | query |
| Getter | schema path `get` option | reading hydrated document field | document value access |
| Setter | schema path `set` option | assigning field / update casting | document or query |
| Document middleware | `schema.pre/post('save')` etc. | `doc.save()` / `doc.deleteOne()` | document |
| Query middleware | `schema.pre/post('find')`, `deleteMany`, etc. | `Model.find()`, `Model.deleteMany()` | query |
| Model middleware | `insertMany`, `bulkWrite` | `Model.insertMany()` | model |

---

# Final Takeaway

Mongoose methods aur middleware powerful hain, but exact behavior depend karta hai ki operation document-level hai, model-level hai, ya query-level.

Best practical rules:

1. Instance method document par call hota hai: `doc.method()`.
2. Static method model par call hota hai: `Model.method()`.
3. Query helper query chain par call hota hai: `Model.find().helper()`.
4. `pre('save')` / `post('save')` document middleware hai.
5. `insertMany()` save hooks per document run nahi karta.
6. `isNew` `post('save')` mein false ho sakta hai, so `$locals` use karo.
7. `lean()` hydrated document features skip karta hai, but query middleware still run ho sakta hai.
8. `deleteOne()` / `deleteMany()` use karo, `remove()` nahi.
9. `deleteMany()` middleware once per query operation run hota hai, per document nahi.
10. Getters read time transform karte hain; setters write/update casting time transform karte hain.
