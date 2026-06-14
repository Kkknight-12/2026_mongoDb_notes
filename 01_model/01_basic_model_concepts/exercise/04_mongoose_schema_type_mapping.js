/*
Exercise 4: Database-Level Schema Validation - Solved Runnable Example

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/04_mongoose_schema_type_mapping.js

Mongoose-level reference:
Read this file separately:
01_model/01_basic_model_concepts/exercise/04_mongoose_schema_type_mapping_reference.js

Why this file changed:
- `mongoose.Schema(...)` runs in Node.js, not in `mongosh`.
- This file runs in `mongosh`, so here we practice MongoDB database-level schema.
- MongoDB database-level schema is created with collection validation and `$jsonSchema`.

Concept to revise:
- MongoDB collection validator can enforce structure at database level.
- `required` tells which fields must exist.
- `properties` tells the rules for each field.
- Valid documents insert successfully.
- Invalid documents are rejected by MongoDB itself.
*/

print("Exercise 4: Database-Level Schema Validation - Solved Runnable Example");

/*
Step 1: Select the practice database.
*/
const practiceDb = db.getSiblingDB("mongodb_practice");

/*
Step 2: Reset the collection by dropping it.

Why drop instead of deleteMany({})?
- deleteMany({}) removes documents only.
- drop() removes the collection and its old validator too.
- Then we can recreate the collection with a fresh schema validator.
*/
const collectionName = "basic_model_database_schema_users";

if (practiceDb.getCollectionNames().includes(collectionName)) {
  print("Drop old collection:");
  printjson(practiceDb.getCollection(collectionName).drop());
}

/*
Step 3: Create collection with MongoDB database-level schema validation.

Important:
This is not Mongoose schema.
This schema is stored at MongoDB collection level.
*/
print("Create collection with $jsonSchema validator:");
printjson(practiceDb.createCollection(collectionName, {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "registeredOn"],
      properties: {
        name: {
          bsonType: "string",
          description: "name required hai aur string hona chahiye"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
          description: "email required hai aur basic email format mein hona chahiye"
        },
        age: {
          bsonType: ["int", "long", "double", "decimal"],
          minimum: 0,
          description: "age number hona chahiye aur negative nahi hona chahiye"
        },
        isActive: {
          bsonType: "bool",
          description: "isActive boolean hona chahiye"
        },
        registeredOn: {
          bsonType: "date",
          description: "registeredOn real BSON Date hona chahiye"
        },
        hobbies: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "hobbies strings ka array hona chahiye"
        },
        address: {
          bsonType: "object",
          required: ["city", "pincode"],
          properties: {
            city: {
              bsonType: "string"
            },
            pincode: {
              bsonType: ["int", "long", "double"]
            }
          },
          description: "address nested object hai jisme city and pincode required hain"
        },
        company: {
          bsonType: "objectId",
          description: "company ObjectId hona chahiye"
        }
      }
    }
  },
  // "error" means invalid documents will be rejected, not just warned.
  validationAction: "error"
}));

/*
Step 3.1: Get a reference to the validated collection.

This does not create a new collection now.
The collection was already created above with `createCollection(...)`.
This variable lets us run insert/find operations on that validated collection.
*/
const users = practiceDb.getCollection(collectionName);

/*
Step 4: Helper function to test valid and invalid inserts.

try/catch is used because invalid documents throw an error.
*/
function tryInsert(label, document) {
  print("");
  print(label);

  try {
    printjson(users.insertOne(document));
  } catch (error) {
    print("MongoDB rejected this document:");
    const rejection = {
      name: error.name,
      code: error.code,
      message: error.message
    };

    if (error.codeName) {
      rejection.codeName = error.codeName;
    }

    printjson(rejection);
  }
}

/*
Step 5: Insert a valid document.

This should work because:
- name is string
- email matches basic pattern
- age is non-negative number
- registeredOn is real Date
- hobbies is array of strings
- address has city and pincode
- company is ObjectId
*/
tryInsert("Insert valid user:", {
  name: "Amit",
  email: "amit@example.com",
  age: 26,
  isActive: true,
  registeredOn: new Date("2026-06-10T00:00:00.000Z"),
  hobbies: ["reading", "coding"],
  address: {
    city: "Delhi",
    pincode: 110001
  },
  company: new ObjectId()
});

/*
Step 6: Missing required field.

This should fail because email is required.
*/
tryInsert("Try invalid user: missing email", {
  name: "Priya",
  age: 31,
  registeredOn: new Date("2026-06-10T00:00:00.000Z")
});

/*
Step 7: Wrong type.

This should fail because registeredOn must be BSON Date, not string.
*/
tryInsert("Try invalid user: registeredOn is string instead of Date", {
  name: "Rahul",
  email: "rahul@example.com",
  age: 29,
  registeredOn: "2026-06-10T00:00:00.000Z"
});

/*
Step 8: Invalid value.

This should fail because age cannot be negative.
*/
tryInsert("Try invalid user: negative age", {
  name: "Neha",
  email: "neha@example.com",
  age: -5,
  registeredOn: new Date("2026-06-10T00:00:00.000Z")
});

/*
Step 9: Nested object validation.

This should fail because address.city is required inside address.
*/
tryInsert("Try invalid user: address missing city", {
  name: "Karan",
  email: "karan@example.com",
  age: 34,
  registeredOn: new Date("2026-06-10T00:00:00.000Z"),
  address: {
    pincode: 560001
  }
});

/*
Step 10: Print final documents.

Only the valid document should be stored.
*/
print("");
print("Documents stored after validation tests:");
printjson(users.find({}).toArray());

/*
Revision:

Mongoose application-level schema:
- written with `new mongoose.Schema({ ... })`
- runs inside Node.js app
- gives validation, defaults, middleware, model API, etc.

MongoDB database-level schema:
- written with collection validator and `$jsonSchema`
- runs inside MongoDB
- protects collection even if data comes from shell, raw driver, or another app
*/
