/*
Exercise 3: BSON Data Types

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/03_bson_data_types.js

Concept to revise:
- MongoDB documents look like JSON
- MongoDB stores data as BSON
- BSON supports values like ObjectId and Date
- arrays and embedded documents are stored inside the document

Practice:
1. Use the mongodb_practice database.
2. Use a collection named basic_model_bson_types.
3. Reset the collection.
4. Insert one document with:
   - string
   - number
   - boolean
   - Date
   - ObjectId
   - array
   - nested object
   - null
5. Read the document back and print it.
6. Insert one more document to compare Date string vs real BSON Date.

Expected observation:
- ObjectId and Date have special MongoDB shell output.
- Arrays and nested documents are stored inside the document.
- BSON is richer than plain JSON.
*/

print("Exercise 3: BSON Data Types");

/*
Hint 1: Select or create a database reference.

Syntax:
const practiceDb = db.getSiblingDB("mongodb_practice");
*/
const practiceDb = db.getSiblingDB("mongodb_practice");

/*
Hint 2: Select the exercise collection.

Syntax:
const bsonTypes = practiceDb.getCollection("basic_model_bson_types");
*/
const bsonTypes = practiceDb.getCollection("basic_model_bson_types");

/*
Hint 3: Reset the collection.

Syntax:
print("Reset collection:");
printjson(bsonTypes.deleteMany({}));
*/
print("Reset collection:");
printjson(bsonTypes.deleteMany({}));


/*
Hint 4: Insert one document with basic BSON-style values.

Useful syntax:
printjson(bsonTypes.insertOne({
  stringField: "text value",
  numberField: 123,
  booleanField: true,
  dateField: new Date("2026-06-10T00:00:00.000Z"),
  objectIdField: new ObjectId(),
  arrayField: ["one", "two"],
  nestedObjectField: {
    city: "Delhi"
  },
  nullField: null
}));

Note:
Use `new Date(...)` for a real Date value.
Use `new ObjectId()` for a real ObjectId value.
*/
print("Insert first BSON document:");
printjson(bsonTypes.insertOne({
  stringField: "text value",
  numberField: 123,
  booleanField: true,
  dateField: new Date("2026-06-10T00:00:00.000Z"),
  objectIdField: new ObjectId(),
  arrayField: ["one", "two"],
  nestedObjectField: {
    city: "Delhi"
  },
  nullField: null
}));

/*
Hint 5: Read and print all documents.

Syntax:
print("Documents after insert:");
printjson(bsonTypes.find({}).toArray());
*/
print("Documents after first insert:");
printjson(bsonTypes.find({}).toArray());

/*
Hint 6: Read one document.

Syntax:
print("One BSON practice document:");
printjson(bsonTypes.findOne({}));
*/
print("One BSON practice document:");
printjson(bsonTypes.findOne({}));

/*
Hint 7: Compare Date string vs real Date.

Try adding both fields in your document:

dateAsString: "2026-06-10T00:00:00.000Z"
dateAsBsonDate: new Date("2026-06-10T00:00:00.000Z")

Expected observation:
The string prints as text.
The real Date prints as ISODate(...).
*/

print("Insert document for Date string vs BSON Date comparison:");
printjson(bsonTypes.insertOne({
  stringField: "text value",
  numberField: 124,
  booleanField: true,
  dateField: new Date("2026-06-10T00:00:00.000Z"),
  objectIdField: new ObjectId(),
  arrayField: ["one", "two", "four"],
  nestedObjectField: {
    city: "Nainital"
  },
  nullField: null,
  dateAsString: "2026-06-10T00:00:00.000Z",
  dateAsBsonDate: new Date("2026-06-10T00:00:00.000Z")
}));

print("Documents after Date comparison insert:");
printjson(bsonTypes.find({}).toArray());

// dateAsString: '2026-06-10T00:00:00.000Z',
// dateAsBsonDate: ISODate('2026-06-10T00:00:00.000Z')
