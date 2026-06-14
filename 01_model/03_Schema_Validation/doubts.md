# Doubts

## Doubt 1: Kya `pre('validate')` `updateOne()` ya `findOneAndUpdate()` par chalega?

Short answer:

```text
No.
pre('validate') normally updateOne() ya findOneAndUpdate() par nahi chalta.
```

`pre('validate')` document validation flow ka hook hai.

Ye normally in cases mein chalta hai:

```ts
await payment.validate();
await payment.save();
await Payment.create({ ... });
```

Example:

```ts
PaymentSchema.pre('validate', function() {
  if (this.paymentType === 'credit_card' && this.amount > 100000) {
    this.invalidate('amount', 'Credit card payments cannot exceed 100000');
  }
});
```

Iska meaning:

```text
Payment document validate hone se pehle ye function run karo.
```

But update methods ka flow different hota hai:

```ts
await Payment.updateOne(
  { _id },
  { $set: { amount: 200000 } }
);

await Payment.findOneAndUpdate(
  { _id },
  { $set: { amount: 200000 } }
);
```

In methods mein full document validation flow normally run nahi hota, so
`pre('validate')` par rely mat karo.

### Then update methods ke liye kya use karein?

If you want Mongoose update validators:

```ts
await Payment.updateOne(
  { _id },
  { $set: { amount: 200000 } },
  { runValidators: true }
);
```

If you want middleware specifically before update query:

```ts
PaymentSchema.pre('updateOne', function() {
  // this = query object
});

PaymentSchema.pre('findOneAndUpdate', function() {
  // this = query object
});
```

### Easy mental model

```text
validate() / save() / create()
= document validation flow
= pre('validate') runs

updateOne() / findOneAndUpdate()
= update query flow
= pre('validate') does not normally run
= use runValidators or query middleware
```

## Doubt 2: Update validators ke caveats: `required`, update operators, aur `$inc`

Question:

```text
Explain these three points with examples:

1. required update mein tab fail hota hai jab field explicitly $unset hoti hai.
2. Validators kuch update operators par hi run hote hain:
   $set, $unset, $push, $addToSet, $pull, $pullAll.
3. $inc validators ko ignore kar sakta hai.
```

Important context:

```text
Ye points Mongoose update validators ke baare mein hain.
Usually ye tab relevant hote hain jab update method ke saath:

{ runValidators: true }

use karte hain.
```

### 1. `required` update mein kab fail hota hai?

Schema:

```ts
const StudentSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number
  }
});
```

This update can pass:

```ts
await Student.updateOne(
  { _id },
  { $set: { age: 25 } },
  { runValidators: true }
);
```

Why?

```text
name required hai, but update mein name ko touch hi nahi kiya.
Mongoose update validator sirf updated paths par focus karta hai.
```

This update can fail:

```ts
await Student.updateOne(
  { _id },
  { $unset: { name: 1 } },
  { runValidators: true }
);
```

Why?

```text
Ab aap required field name ko explicitly remove kar rahe ho.
Isliye required validator fail hoga.
```

Simple rule:

```text
required missing field ko update ke time automatically scan nahi karta.
required tab fail hota hai jab update us field ko explicitly unset/remove kare.
```

### 2. Validators sirf kuch update operators par run hote hain

Mongoose update validators mainly in operators ke saath run karte hain:

```text
$set
$unset
$push
$addToSet
$pull
$pullAll
```

Example schema:

```ts
const ProductSchema = new Schema({
  price: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    maxlength: 10
  }]
});
```

This can fail because `$set` runs validator:

```ts
await Product.updateOne(
  { _id },
  { $set: { price: -50 } },
  { runValidators: true }
);
```

Why?

```text
price min 0 hai.
$set price ko -50 kar raha hai.
Validator updated path price par run ho sakta hai.
```

This can fail because `$push` validates the pushed array item:

```ts
await Product.updateOne(
  { _id },
  { $push: { tags: "this-tag-is-too-long" } },
  { runValidators: true }
);
```

Why?

```text
tags item string maxlength 10 se zyada hai.
$push ke through new item add ho raha hai.
Mongoose pushed item ko validate kar sakta hai.
```

### 3. `$inc` validators ko ignore kar sakta hai

Schema:

```ts
const ProductSchema = new Schema({
  stock: {
    type: Number,
    max: 100
  }
});
```

This may pass even with `runValidators: true`:

```ts
await Product.updateOne(
  { _id },
  { $inc: { stock: 1000 } },
  { runValidators: true }
);
```

Why?

```text
$inc Mongoose update validators ke supported validation operators mein nahi aata.
Isliye stock max 100 validator ignore ho sakta hai.
```

Compare:

```ts
await Product.updateOne(
  { _id },
  { $set: { stock: 1000 } },
  { runValidators: true }
);
```

This can fail because `$set` validators run kar sakta hai.

Simple rule:

```text
$set stock to invalid value  = validator can run
$inc stock to invalid value  = Mongoose validator may not run
```

### Important MongoDB-level note

Ye caveats Mongoose validators ke baare mein hain.

Agar same collection par MongoDB database-level `$jsonSchema` validation bhi
lagi hui hai, then MongoDB final invalid document ko reject kar sakta hai.

```text
Mongoose update validators:
operator-specific behavior ho sakta hai.

MongoDB $jsonSchema validation:
final document database mein invalid ho to MongoDB reject kar sakta hai.
```

### Easy mental model

```text
runValidators: true
= Mongoose update validators ko run karne ki request.

But update validators:
- sirf updated paths par focus karte hain
- sirf kuch update operators par run karte hain
- $inc jaise operators ko ignore kar sakte hain
```

## Doubt 3: `StudentSchema.path('grade').validate(...)` ka matlab kya hai?

Question:

```text
Explain this code:

StudentSchema.path('grade').validate(function(value: number) {
```

### Short answer

Ye existing schema field `grade` par custom validator add karta hai.

```ts
StudentSchema.path('grade')
```

Meaning:

```text
StudentSchema ke andar grade field ko select karo.
```

```ts
.validate(...)
```

Meaning:

```text
grade field par validation rule add karo.
```

```ts
function(value: number) {
```

Meaning:

```text
validator function ko grade ki value milegi.
Function true return kare to valid.
Function false return kare to invalid.
```

### Example

```ts
StudentSchema.path('grade').validate(function(value: number) {
  return value >= 0 && value <= 100;
}, 'Grade must be between 0 and 100');
```

Meaning:

```text
grade 80  -> valid
grade 120 -> invalid
grade -5  -> invalid
```

### Same validator inline schema mein kaise likhenge?

Ye:

```ts
StudentSchema.path('grade').validate(function(value: number) {
  return value >= 0 && value <= 100;
}, 'Grade must be between 0 and 100');
```

same idea hai as:

```ts
const StudentSchema = new Schema({
  grade: {
    type: Number,
    validate: {
      validator: function(value: number) {
        return value >= 0 && value <= 100;
      },
      message: 'Grade must be between 0 and 100'
    }
  }
});
```

### When use `.path(...).validate(...)`?

Use this when:

```text
schema already create ho chuka hai
aur aap baad mein kisi existing field par validator add karna chahte ho
```

Example:

```ts
const StudentSchema = new Schema({
  name: String,
  grade: Number
});

StudentSchema.path('grade').validate(function(value: number) {
  return value >= 0 && value <= 100;
}, 'Grade must be between 0 and 100');
```

### Easy mental model

```text
StudentSchema.path('grade')
= grade field ko pakdo

.validate(...)
= us field par custom validation lagao
```

## Doubt 4: `context: 'query'`, query object, aur update validator mein `this`

Question:

```text
What is context: 'query'?
What is query object?
What does it mean that update validators already run in query context?
```

Example from notes:

```ts
StudentSchema.path('grade').validate(function(value: number) {
  // update validators mein this query object hai
  const updatedName = this.get('name');
  return value >= 0 && value <= 100;
});
```

### Short answer

`context: 'query'` ka simple meaning:

```text
Validator ke andar `this` ko query object banao, document nahi.
```

But modern Mongoose update validators mein ye usually already hota hai.

### `value` kya hai?

```ts
function(value: number) {
```

`value` is the new value being validated.

Example:

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { grade: 90 } },
  { runValidators: true }
);
```

Inside grade validator:

```text
value = 90
```

### Query object kya hota hai?

Query object means the Mongoose object that represents the update operation.

Example:

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { name: 'Amit', grade: 90 } },
  { runValidators: true }
);
```

Update validator ke andar:

```ts
this
```

document nahi hota. It is the query object.

That query object knows about the current update operation.

So:

```ts
this.get('name');
```

can read the `name` value from the update.

```text
this.get('name') = 'Amit'
```

### Important: `this.get()` database se old value nahi laata

This is very important.

```ts
this.get('name')
```

does not fetch the existing value from MongoDB.

It only reads the value present in the current update query.

Example:

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { grade: 90 } },
  { runValidators: true }
);
```

Inside validator:

```ts
this.get('name');
```

will be:

```text
undefined
```

because `name` was not part of this update.

### Why older examples use `context: 'query'`

Older examples often used:

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { name: 'Amit', grade: 90 } },
  { runValidators: true, context: 'query' }
);
```

That option forced validator `this` to be the query object.

Modern Mongoose update validators already use query context, so usually this is
enough:

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { name: 'Amit', grade: 90 } },
  { runValidators: true }
);
```

### Easy mental model

```text
save/create validation:
this = document

updateOne/findOneAndUpdate validation:
this = query object

this.get('field'):
reads field value from the current update query
```
