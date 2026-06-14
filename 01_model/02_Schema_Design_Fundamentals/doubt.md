# Doubts

## Doubt 1: `type: Number` Vs Integer Validation

Question:

```text
If I write type: Number, won't that check that stock must be a number?
Then if I want the number to be an integer, positive or negative, why do we
write a separate validator like Number.isInteger?

What about other cases like string, array, or other field types?
```

Example:

```js
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

### Short Answer

Yes, `type: Number` means Mongoose expects/casts the value as a number.

But JavaScript `Number` includes both:

```text
10
10.5
-3
0
```

So `type: Number` does not mean integer.

If you want integer only, add a validator:

```js
validate: {
  validator: Number.isInteger,
  message: 'Stock integer hona chahiye'
}
```

If you want non-negative integer, use both:

```js
min: 0,
validate: {
  validator: Number.isInteger,
  message: 'Stock integer hona chahiye'
}
```

Meaning:

```text
type: Number              = value number hona chahiye
min: 0                    = value negative nahi hona chahiye
Number.isInteger(value)   = value decimal nahi hona chahiye
```

### Why `integer: true` Not Used?

Mongoose mein `integer: true` normal schema option nahi hai.

Wrong mental model:

```js
stock: {
  type: Number,
  integer: true
}
```

Better:

```js
stock: {
  type: Number,
  validate: {
    validator: Number.isInteger,
    message: 'Stock integer hona chahiye'
  }
}
```

Or, if your Mongoose/BSON setup supports it and you specifically want a BSON
integer type:

```js
stock: {
  type: mongoose.Schema.Types.Int32
}
```

For normal app validation, `Number` plus `Number.isInteger` is easier to
understand.

### Same Pattern For Other Types

`type` defines the basic data category.

Validators define extra rules.

```text
type        = basic shape
validators = stricter rules
```

### Number Examples

```js
price: {
  type: Number,
  required: true,
  min: 0
}
```

Meaning:

```text
price must be a number
price cannot be negative
decimal is allowed
```

```js
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
stock must be a number
stock cannot be negative
stock cannot be decimal
```

### String Examples

```js
name: {
  type: String,
  required: true,
  trim: true,
  minlength: 2,
  maxlength: 50
}
```

Meaning:

```text
name must be string
name required hai
extra spaces trim honge
name length 2 se 50 characters ke beech honi chahiye
```

```js
status: {
  type: String,
  enum: ['active', 'inactive', 'blocked']
}
```

Meaning:

```text
status string hona chahiye
status sirf allowed values mein se ek hona chahiye
```

### Array Examples

```js
tags: {
  type: [String],
  validate: {
    validator: function(tags) {
      return tags.length <= 5;
    },
    message: 'Maximum 5 tags allowed'
  }
}
```

Meaning:

```text
tags array hona chahiye
array ke items strings hone chahiye
maximum 5 tags allowed hain
```

Important:

```text
type: [String] array items ka type define karta hai.
Array length rule ke liye custom validator use karna padta hai.
```

### Date Examples

```js
manufacturingDate: {
  type: Date,
  max: Date.now
}
```

Meaning:

```text
manufacturingDate Date honi chahiye
future date allowed nahi hai
```

### ObjectId Examples

```js
company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company'
}
```

Meaning:

```text
company field ObjectId hona chahiye
Mongoose populate ke liye Company model ka reference samjhega
```

Important:

```text
ObjectId type check ka matlab ye nahi ki referenced company document actually
database mein exist karta hi hai.
```

Existence check ke liye separate logic/custom validation chahiye.

### Mental Model

```text
type: Number      = number family
Number.isInteger = number ke andar integer only

type: String      = string family
minlength/match   = string ke andar stricter rule

type: [String]    = array of strings
custom validate   = array length/duplicate/custom rule
```

## Doubt 2: What Is `match` In Mongoose String Fields?

Question:

```text
In this example you used match:

email: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
  match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

What is match and when should we use it?
```

### Short Answer

`match` is a Mongoose string validator.

It checks whether a string matches a regular expression.

```js
match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

Meaning:

```text
email string ko is regex pattern ke according valid hona chahiye.
```

If the string does not match the pattern, Mongoose validation fails.

### Example With Custom Message

```js
email: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Valid email provide karein']
}
```

Meaning:

```text
type: String  = email string hona chahiye
required      = email missing nahi ho sakta
lowercase     = save se pehle lowercase karega
trim          = starting/ending spaces remove karega
match         = email pattern check karega
```

### When To Use `match`

Use `match` when a string must follow a pattern.

Good examples:

```text
email basic format
username format
slug format
phone number pattern
pin code pattern
product code pattern
```

Example username:

```js
username: {
  type: String,
  required: true,
  match: [/^[a-zA-Z0-9_]+$/, 'Username sirf letters, numbers, underscore use kar sakta hai']
}
```

Example slug:

```js
slug: {
  type: String,
  required: true,
  match: [/^[a-z0-9-]+$/, 'Slug lowercase letters, numbers, aur hyphen se banega']
}
```

### When Not To Use Only `match`

`match` is good for simple pattern checks.

For complex validation, use:

```text
custom validate
validator.js library
Zod/Joi/Ajv at request-body level
business logic in service layer
```

Example:

```text
Email regex can check basic shape.
It cannot fully prove that the email account exists.
```

### Practical Rule

```text
Use type for base data type.
Use built-in validators for common rules.
Use match for string pattern rules.
Use custom validate for rules that need logic.
```

## Doubt 3: `validationAction: "error"` Vs `validationLevel: "strict"`

Question:

```text
I do not understand validationAction: "error" and validationLevel: "strict".
What do they mean?
```

### Short Answer

```text
validationAction = what MongoDB should do when document is invalid
validationLevel  = which documents MongoDB should validate
```

### `validationAction: "error"`

`validationAction` decides what happens when a document fails validation.

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
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationAction: "error"
});
```

If you insert:

```js
db.users.insertOne({
  name: "Amit"
});
```

MongoDB rejects it because `email` is required.

Expected type of error:

```text
MongoServerError: Document failed validation
```

### `validationAction: "warn"`

MongoDB also supports:

```js
validationAction: "warn"
```

Meaning:

```text
Invalid document allow kar do, but MongoDB log mein warning record karo.
```

For learning and strict data safety, usually use:

```js
validationAction: "error"
```

### `validationLevel: "strict"`

`validationLevel` decides which documents MongoDB validates.

```js
validationLevel: "strict"
```

Meaning:

```text
MongoDB all inserts and all updates par validation apply karega.
```

This is the default behavior.

So if you do not write `validationLevel`, MongoDB normally behaves like:

```js
validationLevel: "strict"
```

Example:

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});
```

Meaning:

```text
If any insert/update makes a document invalid, reject it.
```

### `validationLevel: "moderate"`

`moderate` is mainly useful when a collection already has old invalid data.

```js
validationLevel: "moderate"
```

Meaning:

```text
New valid documents and updates to already-valid documents must follow rules.
Existing invalid documents are not forced to become valid just because you add
validation later.
```

Simple mental model:

```text
strict   = validate everything
moderate = be softer with existing invalid documents
```

For beginner practice files, prefer:

```js
validationLevel: "strict"
```

or omit it because strict is the default.

### Together

These two options answer different questions:

```text
validationLevel:
Should MongoDB check this document?

validationAction:
If document fails the check, what should MongoDB do?
```

Example:

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

Meaning:

```text
Check all inserts/updates.
If invalid, reject them.
```

### Practical Rule

For our learning files:

```js
validationAction: "error"
```

is important because we want to see MongoDB reject invalid documents.

```js
validationLevel: "strict"
```

is optional in many examples because it is the default, but writing it can make
the behavior more explicit while learning.

## Doubt 4: Does MongoDB `$jsonSchema` Validation Apply To Mongoose Methods?

Question:

```text
MongoDB $jsonSchema validation runs inside MongoDB and applies to inserts/updates
from Mongoose, native driver, mongosh, DataGrip, etc.

Does that mean it also applies to Mongoose methods like:
- updateOne()
- updateMany()
- findOneAndUpdate()
- save()
- create()
```

### Short Answer

Yes.

If a MongoDB collection has database-level validation, then MongoDB can validate
writes coming from Mongoose too.

These Mongoose methods eventually write to MongoDB:

```js
User.create(...)
user.save()
User.updateOne(...)
User.updateMany(...)
User.findOneAndUpdate(...)
User.insertMany(...)
```

So if the collection has:

```js
validator: {
  $jsonSchema: {
    bsonType: "object",
    properties: {
      email: {
        bsonType: "string"
      }
    }
  }
},
validationAction: "error"
```

then MongoDB can reject a write where `email` is not a string.

### Important Condition

The Mongoose model must point to the same MongoDB collection that has the
`$jsonSchema` validator.

Example:

```js
const User = mongoose.model("User", userSchema);
```

By default, this model writes to the `users` collection.

So database-level validation applies only if the `users` collection has the
MongoDB validator.

### Then Why Use `runValidators: true`?

Because `runValidators: true` is for Mongoose's own update validators.

It is not for MongoDB `$jsonSchema`.

Example:

```js
await User.updateOne(
  { _id },
  { $set: { email: 123 } }
);
```

Without this option:

```js
{ runValidators: true }
```

Mongoose update validators may not run.

But MongoDB `$jsonSchema` can still run after Mongoose sends the update to the
database.

### Two Separate Validation Layers

```text
Mongoose schema validation:
Runs inside Node.js/Mongoose before or during the operation.

MongoDB $jsonSchema validation:
Runs inside MongoDB when the write reaches the collection.
```

### Method Behavior Summary

```text
User.create()
user.save()
Mongoose validation runs by default, then MongoDB validator can also run.

User.updateOne()
User.updateMany()
User.findOneAndUpdate()
Mongoose update validators need { runValidators: true }.
MongoDB validator can still run if collection has $jsonSchema.
```

### Practical Rule

```text
DB validator exists on collection?
MongoDB checks writes from Mongoose too.

Want Mongoose update validators also?
Add { runValidators: true } to Mongoose update methods.
```

### Small Nuance

Mongoose may cast values before sending them to MongoDB.

So MongoDB validates the final value that reaches MongoDB, not always the exact
raw value you originally passed into Mongoose.