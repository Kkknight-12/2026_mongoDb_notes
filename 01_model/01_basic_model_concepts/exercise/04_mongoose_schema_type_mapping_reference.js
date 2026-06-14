/*
Exercise 4 Reference: Mongoose Schema Type Mapping

This file is for reading/reference.

Do not run this as a real Mongoose app yet.
It is kept separate because `mongoose.Schema(...)` runs in Node.js, while the
main exercise file runs in `mongosh`.

Related runnable MongoDB exercise:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/04_mongoose_schema_type_mapping.js

Concept:
- MongoDB document shape tells us what kind of data we are storing.
- Mongoose schema maps each document field to a SchemaType.
- Schema is the structure/rules.
- Model is created from schema and gives us the API to create/read/update/delete.
*/

print("Reference only: read the comments in this file.");
print("Runnable MongoDB schema practice is in 04_mongoose_schema_type_mapping.js");

/*
Sample MongoDB document shape:

{
  name: "Amit",
  age: 26,
  isActive: true,
  registeredOn: ISODate("2026-06-10T00:00:00.000Z"),
  hobbies: ["reading", "coding"],
  scores: [80, 92, 75],
  address: {
    city: "Delhi",
    pincode: 110001
  },
  company: ObjectId("...")
}
*/

/*
Field-by-field Mongoose mapping:

MongoDB field        Example value                         Mongoose SchemaType
--------------------------------------------------------------------------------
name                 "Amit"                                String
age                  26                                    Number
isActive             true                                  Boolean
registeredOn         ISODate(...)                          Date
hobbies              ["reading", "coding"]                 [String]
scores               [80, 92, 75]                          [Number]
address              { city, pincode }                     nested object
address.city         "Delhi"                               String
address.pincode      110001                                Number
company              ObjectId("...")                       Schema.Types.ObjectId
extraInfo            flexible object                       Schema.Types.Mixed
*/

/*
Equivalent Mongoose schema.

This is Node.js/Mongoose code, not `mongosh` code.

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    age: {
      type: Number,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    registeredOn: {
      type: Date,
      default: Date.now
    },

    hobbies: {
      type: [String],
      default: []
    },

    scores: {
      type: [Number],
      default: []
    },

    address: {
      city: {
        type: String,
        required: true
      },
      pincode: {
        type: Number,
        required: true
      }
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    extraInfo: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
*/

/*
Why schema comes before model:

Schema = blueprint
Model = usable class/API made from blueprint
Document = actual data saved in MongoDB

Mongoose needs to know the document structure before it can create the model API.
So first we create schema, then we create model.

Example:
const User = mongoose.model("User", userSchema);

Meaning:
- "User" is the model name.
- userSchema is the blueprint.
- User becomes the class/API we use in Node.js.
*/

/*
Gotchas:

1. `unique: true` is not a Mongoose validator.
It creates a MongoDB unique index. Duplicate values usually throw E11000.

2. `mongoose.Schema.Types.Mixed` is flexible.
Use it carefully because Mongoose cannot strongly validate internal structure.

3. `_id` usually does not need to be manually defined.
MongoDB automatically creates `_id` for every document.
*/
