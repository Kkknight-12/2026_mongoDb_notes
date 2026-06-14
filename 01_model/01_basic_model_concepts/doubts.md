# Doubts

## Doubt 1: MongoDB `$jsonSchema` Validator Basics

Question:

```text
What is $jsonSchema?
Why do we write required: ["name", "email"] before properties: {}?
Is this a valid way of creating schema?
How is this different from new mongoose.Schema({})?
```

Example code:

```js
await database.createCollection("validatedUsers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string",
          description: "name required hai aur string hona chahiye"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
          description: "email required hai aur basic email format mein hona chahiye"
        }
      }
    }
  },
  validationAction: "error"
});
```

### Short Answer

Yes, this is a valid MongoDB collection-level schema validation style. It does
not create a Mongoose model.

This doubt focuses on `$jsonSchema` syntax. For the application-level vs
database-level difference, see Doubt 2.

### What Is `$jsonSchema`?

`$jsonSchema` is MongoDB's way to validate documents using JSON Schema-style
rules.

It tells MongoDB:

```text
Before accepting an insert or update, check that the document matches this shape.
```

In this code:

```js
validator: {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email"],
    properties: {
      name: { bsonType: "string" },
      email: { bsonType: "string" }
    }
  }
}
```

MongoDB checks:

```text
The document must be an object.
The document must contain name.
The document must contain email.
If name exists, it must be a string.
If email exists, it must be a string.
```

### Why `required` Is Outside `properties`

`required` and `properties` do different jobs.

```text
required   = which fields must exist
properties = rules for fields if they exist
```

That is why this is written separately:

```js
required: ["name", "email"],
properties: {
  name: { bsonType: "string" },
  email: { bsonType: "string" },
  age: { bsonType: ["int", "long", "double"] }
}
```

Meaning:

```text
name and email must exist.
name must be a string.
email must be a string.
age is optional, but if age exists, it must be a number.
```

Important:

```text
Putting a field inside properties does not automatically make it required.
```

Example:

```js
properties: {
  age: { bsonType: ["int", "long", "double"] }
}
```

This means:

```text
age can be missing.
But if age is present, it must be a number.
```

To make `age` required:

```js
required: ["name", "email", "age"]
```

### Is This A Valid Way To Create Schema?

Yes, but say it precisely:

```text
This creates MongoDB collection validation.
```

It does not create a Mongoose model.

This validation lives in MongoDB itself. For why that matters, see Doubt 2.

### Where To Continue

Use this doubt to remember `$jsonSchema`, `required`, and `properties`.

Use Doubt 2 to revise:

```text
application-level schema vs database-level validation
```

Use Doubt 5 to revise:

```text
how to create this validator from a Node.js project without Mongoose
```

### Common Confusion

`unique: true` in Mongoose is not the same kind of validation as `required:
true`.

In MongoDB, uniqueness is normally enforced by a unique index, not by
`$jsonSchema`.

So for email uniqueness, you usually need:

```text
Mongoose schema field with unique: true
and/or a MongoDB unique index on email
```

## Doubt 2: Application-Level Schema Vs Database/Collection-Level Validation

Question:

```text
What is the difference between application-level schema and
database/collection-level validation?
```

### Short Answer

```text
Application-level schema          = rule inside Node.js/Mongoose app
Database/collection-level validation = rule inside MongoDB itself
```

### Application-Level Schema

Application-level schema is checked by the application code before or during a
database operation.

In a Mongoose project, this usually means:

```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }
});
```

This gives developer features like:

```text
model API
defaults
type casting
middleware
methods
populate
clean validation errors before writing to DB
```

But this layer only works when the write goes through that application code.

### Database/Collection-Level Validation

Database-level validation is checked by MongoDB itself.

In this project, that means:

```js
db.createCollection("users", {
  validator: { $jsonSchema: { /* rules */ } },
  validationAction: "error"
});
```

For `$jsonSchema`, `required`, and `properties` syntax, see Doubt 1.

This layer works even if the write comes from `mongosh`, DataGrip, the MongoDB
native driver, Mongoose, or another backend service.

### Mental Model

```text
Mongoose schema:
Protects your app code and gives developer features.

MongoDB collection validation:
Protects the database itself.
```

### Practical Rule

For a Mongoose project:

```text
Use Mongoose schema for app modeling.
Add MongoDB collection validation for critical database-level rules.
```

For a native-driver project:

```text
Use MongoDB collection validation for database-level rules.
Use Zod/Joi/Ajv if you also want request-body validation in Node.js.
```

## Doubt 3: `db.getCollection("users")` Vs `db.collection("users")`

Question:

```text
What is the difference between db.getCollection("users") and db.collection("users")?
```

### Short Answer

It depends on where the code is running.

```text
mongosh / MongoDB shell .js file:
db.getCollection("users")

Node.js MongoDB driver:
database.collection("users")
```

### In mongosh

In the MongoDB shell or a `.js` file executed with `mongosh`, use:

```js
const users = db.getCollection("users");
```

or:

```js
db.users.find({});
```

`getCollection("users")` means:

```text
Give me a collection reference for the collection named users.
```

For this learning project's `exercise/*.js` files, prefer:

```js
const practiceDb = db.getSiblingDB("mongodb_practice");
const users = practiceDb.getCollection("users");
```

### In Node.js MongoDB Driver

In a real Node.js file using the MongoDB driver, use:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017");
await client.connect();

const database = client.db("mongodb_practice");
const users = database.collection("users");
```

Here, `collection("users")` is a Node.js driver method.

### Rule Of Thumb

```text
mongosh practice file:
practiceDb.getCollection("users")

Node.js app file:
database.collection("users")
```

## Doubt 4: Does `getCollection()` Create A Collection?

Question:

```text
Will this create collections if they do not already exist?

const users = db.getCollection("basic_model_collection_users");
const product = db.getCollection("basic_model_collection_products");
const orders = db.getCollection("basic_model_collection_orders");
```

### Short Answer

No.

This only creates collection references in your script. It does not create the
collections inside MongoDB immediately.

```js
const users = db.getCollection("basic_model_collection_users");
```

Meaning:

```text
Point to the collection named basic_model_collection_users.
```

### When Is The Collection Actually Created?

MongoDB can create the collection when you do the first write:

```js
users.insertOne({
  name: "Amit"
});
```

Or you can explicitly create it:

```js
db.createCollection("basic_model_collection_users");
```

### Mental Model

```text
getCollection("users") = reference to this collection name
insertOne(...)         = collection gets created if it does not exist
createCollection(...)  = explicitly create collection now
```

### Practice Note

This is fine in an exercise file:

```js
const users = db.getCollection("basic_model_collection_users");
```

But the collection will appear in tools like DataGrip only after it has data or
after you explicitly create it.

## Doubt 5: Can We Add MongoDB Schema Validation From A Node.js Project Without Mongoose?

Question:

```text
Can we add schema validation like this in a Node.js project if we do not want
to use Mongoose for validation?
```

### Short Answer

Yes.

Mongoose is not required for MongoDB database-level validation. This doubt is
only about how to create or update that validation from a Node.js project.

For the layer difference, see Doubt 2.

### Example With MongoDB Native Driver

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017");

await client.connect();

const db = client.db("MyEcommerceApp");

await db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$"
        }
      }
    }
  },
  validationAction: "error"
});

await client.close();
```

Use this when the collection does not exist yet.

### What If Collection Already Exists?

`createCollection()` is for creating a new collection.

If the collection already exists, you can update the validator using `collMod`:

```js
await db.command({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string"
        },
        email: {
          bsonType: "string"
        }
      }
    }
  },
  validationAction: "error"
});
```

### Practical Rule

If you do not want to use Mongoose:

```text
Use MongoDB native driver for database operations.
Use createCollection() when creating a new validated collection.
Use collMod when adding/changing validation on an existing collection.
Use Zod/Joi/Ajv separately if you want request-body validation before DB write.
```

## Doubt 6: `deleteMany({})` Vs `drop()` For Resetting Practice Collections

Question:

```text
Why did we use deleteMany({}) in flexible schema exercise but drop() in
collection validation exercise?
What is the difference between deleteMany({}) and drop()?
```

### Short Answer

```text
deleteMany({}) = remove documents only
drop()         = remove the whole collection
```

### `deleteMany({})`

`deleteMany({})` removes all documents that match the filter.

With empty filter `{}`, it removes all documents:

```js
printjson(users.deleteMany({}));
```

But it keeps the collection itself.

That means it keeps:

```text
collection name
indexes
collection validator
other collection options
```

Use this when you only want a clean data reset.

Example:

```text
Exercise 5: Flexible Schema
```

There we only want to remove old documents and insert fresh flexible-shape
examples. We do not need to recreate collection options.

### `drop()`

`drop()` removes the entire collection:

```js
printjson(users.drop());
```

That removes:

```text
documents
indexes
collection validator
collection options
```

Use this when you need to recreate the collection from scratch.

Example:

```text
Exercise 6: Collection validation with $jsonSchema
```

There we create the collection with:

```js
db.createCollection("basic_model_validated_users", {
  validator: {
    $jsonSchema: {
      // rules
    }
  },
  validationAction: "error"
});
```

If the collection already exists, `createCollection()` can fail, or the old
validator/options can remain. Dropping first gives a clean collection setup.

### Practical Rule

```text
Only reset documents?
Use deleteMany({}).

Need to recreate validation/indexes/options?
Use drop(), then createCollection(...) again.
```

### Mental Model

```text
deleteMany({}) = clean the room
drop()         = demolish the room and build it again
```
