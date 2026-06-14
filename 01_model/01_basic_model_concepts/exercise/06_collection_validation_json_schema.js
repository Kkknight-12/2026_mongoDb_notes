/*
Exercise 6: MongoDB Collection-Level Validation With $jsonSchema

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/06_collection_validation_json_schema.js

Concept to revise:
- MongoDB collection-level validation
- $jsonSchema
- required fields vs properties rules
- validationAction: "error"
- valid documents insert successfully
- invalid documents are rejected by MongoDB

Practice:
1. Use the mongodb_practice database.
2. Create a collection named basic_model_validated_users.
3. Add a validator with $jsonSchema.
4. Require name and email.
5. Add property rules for:
   - name as string
   - email as string with a basic email pattern
   - age as a non-negative number
   - createdAt as date
6. Try inserting one valid document.
7. Try inserting invalid documents.
8. Print or observe the validation error.
9. Print final stored documents.

Expected observation:
- required controls which fields must exist.
- properties controls field rules when those fields exist.
- validationAction: "error" rejects invalid writes.
- MongoDB blocks invalid writes at the database/collection level.
*/

print("Exercise 6: MongoDB Collection-Level Validation With $jsonSchema");

/*
Hint 1: Select or create a database reference.

Syntax:
const practiceDb = db.getSiblingDB("mongodb_practice");
*/


/*
Hint 2: Store the collection name in a variable.

Syntax:
const collectionName = "basic_model_validated_users";

Why:
You will use the same name for:
- checking if collection exists
- dropping old collection
- creating new validated collection
- getting collection reference
*/


/*
Hint 3: Drop the old collection if it already exists.

Why not deleteMany({}) here?
- deleteMany({}) removes documents only.
- The old collection validator still remains.
- For this exercise, dropping is easier because we want to recreate the
  collection with a fresh validator.

Useful syntax:
if (practiceDb.getCollectionNames().includes(collectionName)) {
  print("Drop old collection:");
  printjson(practiceDb.getCollection(collectionName).drop());
}
*/


/*
Hint 4: Create collection with $jsonSchema validation.

Useful structure:
print("Create validated collection:");
printjson(practiceDb.createCollection(collectionName, {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [...],
      properties: {
        fieldName: {
          bsonType: "...",
          description: "..."
        }
      }
    }
  },
  validationAction: "error"
}));

Rules to create:
- whole document bsonType should be "object"
- required should include "name" and "email"
- name should be string
- email should be string and use pattern "^.+@.+\\..+$"
- age should be number and minimum 0
- createdAt should be date

Important:
`required` means the field must exist.
`properties` means rules for fields if those fields exist.
`validationAction: "error"` means invalid documents are rejected.
*/


/*
Hint 5: Get a reference to the validated collection.

Syntax:
const users = practiceDb.getCollection(collectionName);

Note:
This does not create a new collection now.
The collection was created in Hint 4 using createCollection(...).
*/


/*
Hint 6: Insert one valid document.

This should pass validation.

Document idea:
{
  name: "Amit",
  email: "amit@example.com",
  age: 26,
  createdAt: new Date()
}

Syntax:
print("Insert valid user:");
printjson(users.insertOne({ ... }));
*/


/*
Hint 7: Try one invalid document inside try/catch.

Why try/catch?
Invalid inserts throw an error, so without try/catch your script will stop.

Useful syntax:
try {
  print("Try invalid user:");
  printjson(users.insertOne({ ... }));
} catch (error) {
  print("MongoDB rejected this document:");
  printjson({
    name: error.name,
    code: error.code,
    message: error.message
  });
}
*/


/*
Hint 8: Try different invalid cases one by one.

Case ideas:
1. Missing email
2. Email without @
3. Negative age
4. createdAt as string instead of Date

Expected error:
MongoDB validation error usually has:
code: 121
message: "Document failed validation"
*/


/*
Hint 9: Print final stored documents.

Syntax:
print("Documents stored after validation tests:");
printjson(users.find({}).toArray());

Expected observation:
Only valid documents should be stored.
Invalid documents should not appear in final output.
*/


/*
Hint 10: Write revision comments after running your code.

Answer these in comments:

1. What does `$jsonSchema` do?

2. Why is `required` separate from `properties`?

3. What does `validationAction: "error"` do?

4. What is the difference between this database-level validation and
   `new mongoose.Schema({})`?
*/
