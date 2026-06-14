# Schema Design Fundamentals in MongoDB and Mongoose

> MongoDB schema design + Mongoose schema implementation. Style: Hinglish, with practical TypeScript examples.

## Introduction

**Schema design** ka matlab hai data ko is tarah organize karna ki application ke reads, writes, validation, aur scaling requirements efficiently handle ho sakein.

MongoDB by default **flexible schema** use karta hai: same collection ke documents mein different fields ho sakte hain. Lekin production apps mein usually ek **application schema** maintain kiya jata hai taaki data predictable rahe. Node.js apps mein **Mongoose** ek ODM hai jo schema define karne, type casting, validation, defaults, middleware, indexes, aur models create karne mein help karta hai.

Important difference:

- **MongoDB schema design** = collections/documents ka structure, embed vs reference decisions, indexes, and access patterns.
- **Mongoose schema** = Node.js application level par document structure, validation, defaults, methods, hooks, aur indexes define karna.
- **MongoDB collection validator** = database level par schema rules enforce karna, useful jab multiple apps/services same DB mein write karte hain.

---

## 1. Schema Definition aur Model Creation

### Theory

Mongoose mein `Schema` ek blueprint hota hai jo define karta hai ki document mein kaun se fields honge, unka type kya hoga, aur validation/default rules kya honge. `model()` schema ko collection ke saath connect karta hai aur CRUD operations ke liye class-like API deta hai.

Mongoose model name usually singular hota hai, jaise `User`. Agar collection name explicitly pass nahi karte, Mongoose model name ko pluralize karke collection name generate karta hai, jaise `users`. Custom collection name chahiye ho to schema option `{ collection: 'my_users' }` ya `model('User', schema, 'my_users')` use kar sakte hain.

### Code Example

```ts
import { Schema, model } from 'mongoose';

// TypeScript interface document ke raw data shape ko define karta hai.
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true // unique index create karta hai; validator nahi hai
    },
    age: {
      type: Number,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // createdAt aur updatedAt automatically add/update hote hain
  }
);

export const UserModel = model<IUser>('User', userSchema);
```

### Explanation

- `Schema<IUser>` TypeScript ko batata hai ki schema ka document shape `IUser` hai.
- `model<IUser>('User', userSchema)` se Mongoose model create hota hai.
- `timestamps: true` manually `createdAt` set karne se better hai kyunki Mongoose `createdAt` aur `updatedAt` maintain karta hai.
- `trim`, `lowercase`, `min`, `required`, `default` jaise options field-level rules hain.
- `unique: true` duplicate values ko Mongoose validation ki tarah block nahi karta; ye MongoDB unique index banata hai. Detail section 5 mein hai.

---

## 2. Fields aur Data Types

### Theory

Mongoose `SchemaTypes` field ke behavior ko define karte hain: type casting, defaults, validation, getters/setters, and query behavior. Common types: `String`, `Number`, `Date`, `Buffer`, `Boolean`, `Mixed`, `ObjectId`, `Array`, `Decimal128`, `Map`, `UUID`, `BigInt`, `Double`, `Int32`, `Union`, and nested `Schema`.

### Code Example

```ts
import { Schema, model, Types } from 'mongoose';

interface IReview {
  user: Types.ObjectId;
  rating: number;
  comment?: string;
  date: Date;
}

interface IProduct {
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  manufactureDate?: Date;
  category: Types.ObjectId;
  tags: string[];
  relatedProducts: Types.ObjectId[];
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  reviews: IReview[];
  image?: Buffer;
  attributes?: Map<string, string>;
  additionalInfo?: unknown;
  exactPrice?: Types.Decimal128;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    // String type
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Number type - decimal values allow karta hai
    price: {
      type: Number,
      required: true,
      min: 0
    },

    // Integer validation: `integer: true` Mongoose option nahi hai.
    // Integer enforce karne ke liye custom validator ya Schema.Types.Int32 use kar sakte hain.
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock integer hona chahiye'
      }
    },

    // Boolean type
    isAvailable: {
      type: Boolean,
      default: true
    },

    // Date type
    manufactureDate: Date,

    // ObjectId reference
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },

    // Array of strings
    tags: [String],

    // Array of ObjectIds
    relatedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],

    // Nested object
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch'],
        default: 'cm'
      }
    },

    // Array of embedded documents
    reviews: {
      type: [reviewSchema],
      default: []
    },

    // Buffer: binary data ke liye
    image: Buffer,

    // Map: dynamic string keys ke liye
    attributes: {
      type: Map,
      of: String
    },

    // Mixed: flexible data, but Mongoose casting/change tracking limited hoti hai
    additionalInfo: Schema.Types.Mixed,

    // Decimal128: high precision decimal values ke liye, e.g. financial data
    exactPrice: Schema.Types.Decimal128
  },
  { timestamps: true }
);

export const ProductModel = model<IProduct>('Product', productSchema);
```

### Explanation

- `Schema.Types.ObjectId` schema path define karta hai; actual values TypeScript mein `Types.ObjectId` hoti hain.
- `ref` populate ke liye model name batata hai, but MongoDB foreign key enforce nahi karta.
- `Mixed` flexible hai, lekin deep changes auto-detect nahi hote. Agar Mixed field ke andar nested value mutate karte ho, `doc.markModified('additionalInfo')` call karna pad sakta hai.
- Arrays Mongoose mein by default `[]` ban jati hain. Agar field missing hi rakhna hai, `default: undefined` use karo.
- Empty array type `[]` ya `Array` avoid karo; ye array of Mixed ban sakta hai. Prefer `[String]`, `[Number]`, `[reviewSchema]`, etc.

### Code Samjho: `type` Basic Shape Hai, Validator Extra Rule Hai

Mongoose mein `type` basic data category define karta hai. Validator us category ke andar stricter rule lagata hai.

Simple mental model:

```text
type        = basic shape
validators = stricter rules
```

Example:

```ts
price: {
  type: Number,
  required: true,
  min: 0
}
```

Meaning:

```text
price number hona chahiye.
price missing nahi hona chahiye.
price negative nahi hona chahiye.
Decimal value allowed hai.
```

JavaScript/Mongoose `Number` family mein decimal bhi valid number hai:

```text
10
10.5
-3
0
```

Isliye:

```ts
type: Number
```

integer-only rule nahi hai.

Integer-only chahiye to extra validator lagao:

```ts
stock: {
  type: Number,
  required: true,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: 'Stock integer hona chahiye'
  }
}
```

Meaning:

```text
type: Number            = number family
min: 0                  = negative allowed nahi
Number.isInteger(value) = decimal allowed nahi
```

`integer: true` normal Mongoose schema option nahi hai. Agar BSON integer type specifically chahiye aur setup support karta hai, `Schema.Types.Int32` use kar sakte ho. Normal app validation ke liye `Number` + `Number.isInteger` easier hota hai.

Same pattern other types par bhi apply hota hai:

```ts
name: {
  type: String,
  required: true,
  trim: true,
  minlength: 2,
  maxlength: 50
}
```

```text
type: String = string family
minlength/maxlength = string ke andar stricter length rule
```

```ts
tags: {
  type: [String],
  validate: {
    validator: function (tags: string[]) {
      return tags.length <= 5;
    },
    message: 'Maximum 5 tags allowed'
  }
}
```

```text
type: [String] = array of strings
custom validate = array length/custom rule
```

```ts
manufacturingDate: {
  type: Date,
  max: Date.now
}
```

```text
type: Date = Date value
max = future date allowed nahi
```

```ts
company: {
  type: Schema.Types.ObjectId,
  ref: 'Company'
}
```

```text
type: ObjectId = ObjectId shape
ref = populate ke liye model hint
```

Important: `ObjectId` type check ka matlab yeh nahi ki referenced company document actually database mein exist karta hi hai. Existence check ke liye separate query/custom validation/business logic chahiye.

Related doubt:

- [Doubt 1: `type: Number` vs integer validation](doubt.md)

### `match` String Validator

`match` Mongoose ka string validator hai. Yeh check karta hai ki string regex pattern se match ho rahi hai ya nahi.

Example:

```ts
email: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Valid email provide karein']
}
```

Code samjho:

```text
type: String = email string hona chahiye
required = email missing nahi ho sakta
lowercase = save se pehle lowercase karega
trim = starting/ending spaces remove karega
match = email pattern check karega
```

Use `match` jab string ko simple pattern follow karna ho:

```text
email basic format
username format
slug format
phone number pattern
pin code pattern
product code pattern
```

Example:

```ts
username: {
  type: String,
  required: true,
  match: [/^[a-zA-Z0-9_]+$/, 'Username sirf letters, numbers, underscore use kar sakta hai']
}
```

`match` simple pattern checks ke liye good hai. Complex validation ke liye only regex par depend mat karo.

Use better tools/places when needed:

```text
custom validate
validator.js
Zod/Joi/Ajv at request-body level
business logic in service layer
```

Example: email regex basic shape check kar sakta hai, but yeh prove nahi kar sakta ki email account actually exist karta hai.

Related doubt:

- [Doubt 2: what is `match` in Mongoose string fields?](doubt.md)

---

## 3. Default Values Set Karna

### Theory

Default values tab set hoti hain jab field ka value **strictly `undefined`** ho. Agar value `null`, empty string, ya koi explicit value hai, default apply nahi hota.

Default static bhi ho sakta hai (`default: 0`) aur function bhi (`default: Date.now`). Function tab execute hota hai jab document create hota hai. `Date.now` use karo, `Date.now()` nahi; `Date.now()` schema define hote hi execute ho jayega.

Mongoose upsert operations (`update()`, `findOneAndUpdate()`) mein bhi defaults apply kar sakta hai via `$setOnInsert`, jab `upsert: true` aur `setDefaultsOnInsert` enabled ho.

### Code Example

```ts
import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';

type BlogStatus = 'draft' | 'published' | 'archived';

interface IBlogPost {
  title: string;
  content: string;
  status: BlogStatus;
  isPublished: boolean;
  publishedAt?: Date | null;
  viewCount: number;
  tags?: string[];
  metadata: {
    format: string;
    version: string;
  };
  slug?: string;
  trackingId: string;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },

    isPublished: {
      type: Boolean,
      default: false
    },

    publishedAt: {
      type: Date,
      default: function (this: IBlogPost) {
        return this.isPublished ? new Date() : null;
      }
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Mongoose arrays by default [] hote hain. default: undefined se field missing rahega.
    tags: {
      type: [String],
      default: undefined
    },

    metadata: {
      format: {
        type: String,
        default: 'standard'
      },
      version: {
        type: String,
        default: '1.0'
      }
    },

    slug: {
      type: String,
      default: function (this: IBlogPost) {
        return this.title
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }
    },

    trackingId: {
      type: String,
      default: randomUUID
    }
  },
  { timestamps: true }
);

export const BlogPostModel = model<IBlogPost>('BlogPost', blogPostSchema);

async function createBlogWithDefaults() {
  const newPost = await BlogPostModel.create({
    title: 'MongoDB Default Values Guide',
    content: 'Default values bahut useful hote hain...'
  });

  console.log(newPost.status); // draft
  console.log(newPost.viewCount); // 0
  console.log(newPost.trackingId); // generated UUID
}
```

### Explanation

- `default: Date.now` function reference hai; har document ke liye current time calculate hota hai.
- `default: randomUUID` har new document ke liye new UUID generate karta hai.
- Default function mein normal `function` use karo agar `this` access karna hai. Arrow function ka apna `this` nahi hota.
- Defaults `undefined` par apply hote hain; `null` ya `''` par nahi.
- Upsert ke saath defaults apply hone ka behavior `setDefaultsOnInsert` se control hota hai.

---

## 4. Required Fields

### Theory

Required fields woh fields hote hain jinka value save ke time present hona compulsory hota hai. Mongoose validation `save()` se pehle run hoti hai. Update queries ke liye validators default off hote hain, isliye `updateOne()`, `updateMany()`, ya `findOneAndUpdate()` ke saath `{ runValidators: true }` lagana padta hai.

Nested object ko required banana ho to plain nested object ke bajay **single nested schema** use karna safer hai, kyunki plain nested object Mongoose mein fully fledged path nahi hota.

### Code Example

```ts
import { Schema, model } from 'mongoose';

type ContactPreference = 'email' | 'phone';
type PaymentMethod = 'credit' | 'debit' | 'cash';

interface IBilling {
  paymentMethod: PaymentMethod;
  creditCard?: string;
}

interface ICustomer {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPreference: ContactPreference;
  billing: IBilling;
  interests: string[];
}

const billingSchema = new Schema<IBilling>(
  {
    paymentMethod: {
      type: String,
      enum: ['credit', 'debit', 'cash'],
      required: true
    },
    creditCard: {
      type: String,
      required: function (this: IBilling) {
        return this.paymentMethod === 'credit';
      }
    }
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Name zaroori hai'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email zaroori hai'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Valid email provide karein']
    },

    phone: {
      type: String,
      required: function (this: ICustomer) {
        return this.contactPreference === 'phone';
      }
    },

    address: {
      type: String,
      trim: true
    },

    contactPreference: {
      type: String,
      enum: ['email', 'phone'],
      required: true
    },

    // Single nested schema: entire billing object ko required bana sakte hain.
    billing: {
      type: billingSchema,
      required: true
    },

    // Required + custom validator: missing array aur empty array dono fail honge.
    interests: {
      type: [String],
      required: [true, 'Interests zaroori hain'],
      default: undefined,
      validate: {
        validator: function (value?: string[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Kam se kam ek interest select karna zaroori hai'
      }
    }
  },
  { timestamps: true }
);

export const CustomerModel = model<ICustomer>('Customer', customerSchema);

async function createCustomers() {
  await CustomerModel.create({
    name: 'Rajeev Kumar',
    email: 'rajeev@example.com',
    contactPreference: 'email',
    billing: {
      paymentMethod: 'cash'
    },
    interests: ['sports', 'movies']
  });
}

async function updateCustomerEmail(customerId: string) {
  await CustomerModel.updateOne(
    { _id: customerId },
    { $set: { email: 'new@example.com' } },
    { runValidators: true }
  );
}
```

### Explanation

- `required: true` basic required validator lagata hai.
- `[true, 'message']` custom required error message ke liye use hota hai.
- Conditional required ke liye normal `function` use karo, arrow function nahi.
- Nested required object ke liye single nested schema use karo.
- Arrays ke liye `required` alone enough nahi hota agar “non-empty array” enforce karna hai; custom validator lagao.
- Update validators default off hain. Updates mein `{ runValidators: true }` use karo.
- Update validators sirf updated paths par run hote hain. `required` update mein usually tab fail hota hai jab aap field ko explicitly `$unset` karte ho.

---

## 5. Unique Constraints

### Theory

Unique constraint MongoDB database level par unique index ke through enforce hota hai. Mongoose ka `unique: true` **validator nahi hai**; ye index banane ka shortcut hai. Agar duplicate value save hoti hai, error usually MongoDB duplicate key error hota hai, jiska code `11000` hota hai. Ye Mongoose `ValidationError` nahi hota.

Production note: agar collection mein pehle se duplicate data hai, unique index create fail ho sakta hai. Tests mein agar DB drop karte ho, writes se pehle `await Model.init()` call karna useful hota hai taaki indexes build ho chuke hon.

### Code Example

```ts
import { Schema, model } from 'mongoose';

interface IAccountUser {
  username: string;
  email: string;
  name?: string;
  companyId: number;
  employeeId: string;
  socialSecurityNumber?: string;
}

const accountUserSchema = new Schema<IAccountUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    name: {
      type: String,
      trim: true
    },

    companyId: {
      type: Number,
      required: true
    },

    employeeId: {
      type: String,
      required: true,
      trim: true
    },

    socialSecurityNumber: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Single-field unique indexes
accountUserSchema.index({ username: 1 }, { unique: true, name: 'username_unique' });
accountUserSchema.index({ email: 1 }, { unique: true, name: 'email_unique' });

// Compound unique index: companyId + employeeId combination unique hona chahiye
accountUserSchema.index(
  { companyId: 1, employeeId: 1 },
  { unique: true, name: 'employee_company_unique' }
);

// Optional field ke liye partial unique index sparse se zyada precise control deta hai.
accountUserSchema.index(
  { socialSecurityNumber: 1 },
  {
    unique: true,
    name: 'ssn_unique_when_string',
    partialFilterExpression: {
      socialSecurityNumber: { $type: 'string' }
    }
  }
);

export const AccountUserModel = model<IAccountUser>('AccountUser', accountUserSchema);

function isDuplicateKeyError(error: unknown): error is { code: 11000; keyPattern?: Record<string, number> } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;
}

async function createUsersWithUniqueConstraints() {
  // Tests mein useful: indexes build hone ka wait karega.
  await AccountUserModel.init();

  try {
    await AccountUserModel.create({
      username: 'johnsmith',
      email: 'john@example.com',
      name: 'John Smith',
      companyId: 123,
      employeeId: 'EMP001'
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      console.error('Duplicate key error:', error.keyPattern);
      return;
    }

    throw error;
  }
}
```

### Explanation

- `schema.index()` compound indexes aur advanced options ke liye best hai.
- `unique: true` duplicate values prevent karta hai only after MongoDB unique index successfully create ho jaye.
- Custom “unique validation message” direct `Schema.index({ ... }, { message: ... })` se reliable nahi hota. Duplicate key error ko catch karke user-friendly message return karo.
- `sparse: true` missing field wale documents ko index se skip karta hai, but present `null` values ka behavior confusing ho sakta hai. Conditional uniqueness ke liye often `partialFilterExpression` better hai.
- Unique index application-level race conditions ko avoid karne ka right way hai. Sirf “find then insert” check enough nahi hota.

---

## 6. Immutable Fields

### Theory

Immutable fields ek baar document save hone ke baad change nahi hone chahiye. Mongoose `immutable: true` path ko **saved document** **par change hone se prevent karta hai**. Mongoose update methods (`updateOne`, `updateMany`) immutable paths ko strict mode ke hisaab se strip ya reject kar sakte hain. Raw **MongoDB shell/driver se direct update karoge to** **Mongoose rules** **bypass ho sakte hain**.

### Code Example

```ts
import { Schema, model, Types } from 'mongoose';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface ICustomerSnapshot {
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

interface IPaymentInfo {
  method: string;
  transactionId: string;
  amount: number;
}

interface IOrder {
  orderId: string;
  orderDate: Date;
  status: OrderStatus;
  customer: ICustomerSnapshot;
  items: IOrderItem[];
  paymentInfo: IPaymentInfo;
  paymentConfirmed: boolean;
  trackingNumber?: string;
  notes?: string;
}

const customerSnapshotSchema = new Schema<ICustomerSnapshot>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      immutable: true
    },
    name: {
      type: String,
      required: true,
      immutable: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      immutable: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const paymentInfoSchema = new Schema<IPaymentInfo>(
  {
    method: { type: String, required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      immutable: true
    },

    orderDate: {
      type: Date,
      default: Date.now,
      immutable: true
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },

    // Customer snapshot immutable hai, taaki historical order data change na ho.
    customer: {
      type: customerSnapshotSchema,
      required: true,
      immutable: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (value: IOrderItem[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Order mein kam se kam ek item hona chahiye'
      }
    },

    // paymentConfirmed true hone ke baad paymentInfo immutable ho jayega.
    paymentInfo: {
      type: paymentInfoSchema,
      required: true,
      immutable: function (this: IOrder) {
        return this.paymentConfirmed;
      }
    },

    paymentConfirmed: {
      type: Boolean,
      default: false
    },

    trackingNumber: String,
    notes: String
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>('Order', orderSchema);

async function demonstrateImmutableFields(orderId: string) {
  const order = await OrderModel.findOne({ orderId }).orFail();

  order.orderId = 'ORD-NEW'; // Mongoose save ke time ignore karega because immutable
  order.status = 'processing'; // mutable field
  order.items[0].quantity = 2; // mutable field

  await order.save();

  // Query update mein strict throw use karoge to immutable update par error throw hoga.
  await OrderModel.updateOne(
    { orderId },
    { $set: { orderId: 'ORD-HACK' } },
    { strict: 'throw' }
  );
}
```

### Explanation

- `immutable: true` saved documents ke liye path changes prevent karta hai.
- Immutable fields useful hote hain audit/history ke liye: `orderId`, `orderDate`, purchased item price, customer snapshot, etc.
- Conditional immutability ke liye `immutable` function use kar sakte ho.
- Raw MongoDB update Mongoose immutability bypass kar sakta hai. Agar strict database-level guarantee chahiye, MongoDB schema validation, permissions, ya app architecture se enforce karo.

---

## 7. MongoDB Schema Design: Embed vs Reference

### Theory

MongoDB mein schema design ka main rule hai: **data ko application ke access patterns ke hisaab se model karo**. Sirf relational normalization copy mat karo. Jo data frequently saath read hota hai aur bounded size ka hai, usse embed karna efficient ho sakta hai. Jo data independently change hota hai, shared hai, ya unbounded grow karta hai, usse reference karna better ho sakta hai.

### Embed Kab Karein?

Use embedding when:

- Data parent ke saath hi mostly read hota hai.
- Child data ka size bounded/limited hai.
- Data parent ke lifecycle se strongly connected hai.
- Atomic update same document mein chahiye.

Example: order ke andar purchased items ka snapshot.

```js
{
  _id: ObjectId('...'),
  orderId: 'ORD-123',
  customerId: ObjectId('...'),
  items: [
    { productId: ObjectId('...'), name: 'Phone', price: 15000, quantity: 1 },
    { productId: ObjectId('...'), name: 'Headphones', price: 2000, quantity: 2 }
  ],
  total: 19000
}
```

### Reference Kab Karein?

Use references when:

- Related data large ya unbounded ho sakta hai.
- Related data multiple documents/collections mein shared hai.
- Related data independently update hota hai.
- Aapko duplication avoid karna hai.

Example: product category ko separate collection mein rakhna.

```js
// products collection
{
  _id: ObjectId('...'),
  name: 'Phone',
  categoryId: ObjectId('...')
}

// categories collection
{
  _id: ObjectId('...'),
  name: 'Electronics'
}
```

### Practical Rule

- Small, tightly-coupled, read-together data → **embed**.
- Large, shared, independently changing data → **reference**.
- Schema design final nahi hota; query patterns change hote hi schema iterate karna normal hai.

---

## 8. MongoDB-Level Schema Validation

### Theory

Mongoose validation sirf un writes par run hoti hai jo Mongoose ke through hoti hain. Agar koi doosra service, script, mongo shell, ya raw driver same collection mein invalid data insert/update kare, Mongoose validation run nahi hogi.

Is case mein MongoDB collection validator use kar sakte ho. MongoDB `$jsonSchema` validation collection level par allowed data types, required fields, value ranges, etc. enforce kar sakti hai.

### Example

```js
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: {
          bsonType: 'string',
          description: 'firstName required string hona chahiye'
        },
        lastName: {
          bsonType: 'string',
          description: 'lastName required string hona chahiye'
        },
        email: {
          bsonType: 'string',
          description: 'email required string hona chahiye'
        },
        age: {
          bsonType: 'int',
          minimum: 0,
          description: 'age non-negative integer hona chahiye'
        },
        isActive: {
          bsonType: 'bool'
        }
      }
    }
  },
  validationAction: 'error'
});
```

### Explanation

- Mongoose validation = application layer.
- MongoDB `$jsonSchema` validation = database layer.
- Strict business logic often application mein better hoti hai, but critical structural rules DB validator se enforce karna safer hota hai.

### `validationAction` and `validationLevel`

MongoDB collection validation mein do important options confuse kar sakte hain:

```text
validationAction = invalid document milne par MongoDB kya kare?
validationLevel  = MongoDB kin documents ko validate kare?
```

#### `validationAction: "error"`

```js
validationAction: "error"
```

Meaning:

```text
Invalid document reject kar do.
Insert/update fail ho jayega.
Document collection mein save nahi hoga.
```

Example:

```js
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' }
      }
    }
  },
  validationAction: 'error'
});
```

If you insert:

```js
db.users.insertOne({
  name: 'Amit'
});
```

MongoDB reject karega because `email` required hai.

Expected type of error:

```text
MongoServerError: Document failed validation
```

#### `validationAction: "warn"`

```js
validationAction: "warn"
```

Meaning:

```text
Invalid document allow kar do, but MongoDB logs mein warning record karo.
```

Learning/practice mein usually `error` better hai, because hume clearly dekhna hai ki invalid document reject hua.

#### `validationLevel: "strict"`

```js
validationLevel: "strict"
```

Meaning:

```text
All inserts and all updates par validation apply karo.
```

`strict` default behavior hai. Agar `validationLevel` nahi likhte, MongoDB normally strict jaisa behave karta hai.

#### `validationLevel: "moderate"`

```js
validationLevel: "moderate"
```

Meaning:

```text
Existing invalid documents ke saath softer behavior rakho.
New valid documents and updates to already-valid documents rules follow karein.
```

`moderate` mainly tab useful hota hai jab collection mein pehle se old invalid data hai aur aap validation later add kar rahe ho.

Simple mental model:

```text
strict   = validate everything
moderate = existing invalid data ke saath softer behavior
```

For beginner practice:

```js
validationAction: 'error'
```

important hai.

```js
validationLevel: 'strict'
```

optional hai because default strict hota hai, but learning ke liye explicit likhna clear ho sakta hai.

Related doubt:

- [Doubt 3: `validationAction: "error"` vs `validationLevel: "strict"`](doubt.md)

### Does MongoDB `$jsonSchema` Apply To Mongoose Methods?

Yes. Agar MongoDB collection par database-level validator laga hua hai, to MongoDB us collection tak pahunchne wali writes validate kar sakta hai, chahe write Mongoose se aaye.

These Mongoose methods eventually write to MongoDB:

```ts
User.create(...);
user.save();
User.insertMany(...);
User.updateOne(...);
User.updateMany(...);
User.findOneAndUpdate(...);
```

Important condition:

```text
Mongoose model same MongoDB collection par write karna chahiye jahan validator laga hai.
```

Example:

```ts
const User = mongoose.model('User', userSchema);
```

By default yeh `users` collection mein write karega. Agar `users` collection par `$jsonSchema` validator hai, to MongoDB validator apply ho sakta hai.

### Then `{ runValidators: true }` Kyun Use Karte Hain?

`runValidators: true` Mongoose ke own update validators ke liye hai. Yeh MongoDB `$jsonSchema` ke liye nahi hai.

Two separate layers:

```text
Mongoose schema validation:
Node.js/Mongoose layer mein run hoti hai.

MongoDB $jsonSchema validation:
MongoDB server ke andar run hoti hai, jab write collection tak pahunchti hai.
```

Method behavior:

```text
User.create()
user.save()
Mongoose validation default run hoti hai.
MongoDB validator bhi run ho sakta hai if collection has $jsonSchema.

User.updateOne()
User.updateMany()
User.findOneAndUpdate()
Mongoose update validators ke liye { runValidators: true } chahiye.
MongoDB validator still run ho sakta hai if collection has $jsonSchema.
```

Small nuance:

```text
Mongoose values ko cast kar sakta hai before MongoDB ko bhejne se pehle.
MongoDB final value validate karega jo MongoDB tak pahunchi.
```

Related doubt:

- [Doubt 4: does MongoDB `$jsonSchema` validation apply to Mongoose methods?](doubt.md)

---

## 9. Common Mistakes Checklist

- `integer: true` Mongoose option nahi hai. Use `Number.isInteger` validator ya `Schema.Types.Int32`.
- `unique: true` validator nahi hai; ye unique index banata hai.
- Unique error `ValidationError` nahi, usually duplicate key error `E11000` hota hai.
- `Date.now` use karo, `Date.now()` nahi, jab default current time chahiye.
- Update validators ke liye `{ runValidators: true }` lagao.
- Conditional `required` ya default mein `this` chahiye ho to normal `function` use karo, arrow function nahi.
- Nested object ko required banana ho to single nested schema use karo.
- Arrays default `[]` hoti hain; missing field chahiye to `default: undefined`.
- `Mixed` flexible hai, but deep changes ke liye `markModified()` ki zaroorat pad sakti hai.
- `ref` populate ke liye hai; MongoDB relational foreign key constraints enforce nahi karta.
- MongoDB schema design mein access patterns, document size, indexes, and embed/reference trade-offs pehle socho.

---

## Official Docs Checked

- Mongoose SchemaTypes: https://mongoosejs.com/docs/schematypes.html
- Mongoose Defaults: https://mongoosejs.com/docs/defaults.html
- Mongoose Validation: https://mongoosejs.com/docs/validation.html
- Mongoose SchemaType immutable: https://mongoosejs.com/docs/api/schematype.html
- Mongoose Timestamps: https://mongoosejs.com/docs/timestamps.html
- MongoDB Data Modeling: https://www.mongodb.com/docs/manual/data-modeling/
- MongoDB Schema Validation: https://www.mongodb.com/docs/manual/core/schema-validation/
- MongoDB Unique Indexes: https://www.mongodb.com/docs/manual/core/index-unique/
- MongoDB Partial Indexes: https://www.mongodb.com/docs/manual/core/index-partial/