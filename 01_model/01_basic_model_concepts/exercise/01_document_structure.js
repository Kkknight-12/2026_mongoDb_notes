/*
Exercise 1: Document Structure

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/01_document_structure.js

Concept to revise:
- MongoDB document
- key-value fields
- _id / ObjectId
- nested object
- array
- boolean
- BSON Date

Practice:
1. Use the mongodb_practice database.
2. Use a collection named basic_model_document_structure.
3. Reset the collection so every run is clean.
4. Insert at least two user documents.
5. Each user document should include:
   - name
   - email
   - age
   - isActive
   - registeredOn as a real Date
   - address as a nested object
   - hobbies as an array
6. Read all documents and print the result.

Expected observation:
- You should see _id values.
- You should see nested address objects.
- You should see hobbies arrays.
- You should see registeredOn as a Date-like value, not just a plain string.


Write your MongoDB shell code below this comment.
*/


/*
* Basic syntax hints:

1. Select or create a database reference:

   const practiceDb = db.getSiblingDB("database_name");
 *  */

print("Exercise 1: Document Structure");
const practiceDb = db.getSiblingDB("mongodb_practice");

/*
*
* 2. See database names from a .js file:

   printjson(db.adminCommand({ listDatabases: 1 }).databases);

   Note:
   `show dbs` is useful in interactive mongosh, but inside a .js script use
   `db.adminCommand({ listDatabases: 1 })`.


 3. See collection names from a .js file:

   printjson(practiceDb.getCollectionNames());

   Note:
   `show collections` is useful in interactive mongosh, but inside a .js script
   use `practiceDb.getCollectionNames()`.


4. Select or create a collection reference:

   const users = practiceDb.getCollection("collection_name");

   Example for this exercise:

   const users = practiceDb.getCollection("basic_model_document_structure");

   Common mistake:
   `getCollectionNames()` only lists collection names. It does not select a
   collection.
   *
*/

const collectionNames = practiceDb.getCollectionNames();
print("Collections before this exercise:");
printjson(collectionNames);

const users = practiceDb.getCollection("basic_model_document_structure");
print("Documents before reset:");
printjson(users.find({}).toArray());


/*
* 5. Reset a collection:

   printjson(users.deleteMany({}));

   or, if you want to remove the whole collection:

   printjson(users.drop());
   *  */
print("Reset result:");
printjson(users.deleteMany({}));

/*
* 6. Insert one document:

   printjson(users.insertOne({
     fieldName: "value"
   }));
   * 7. Insert many documents:

   printjson(users.insertMany([
     { fieldName: "value 1" },
     { fieldName: "value 2" }
   ]));
   *  */

print("Insert result:");
printjson(users.insertMany([
  {
    name: 'Amit',
    email: 'amit@example.com',
    age: 26,
    isActive: true,
    registeredOn: ISODate('2026-06-09T00:00:00.000Z'),
    address: { city: 'Delhi', pincode: 110001 },
    hobbies: [ 'reading', 'coding' ]
  },
  {
    name: 'Priya',
    email: 'priya@example.com',
    age: 31,
    isActive: true,
    registeredOn: ISODate('2026-06-09T00:05:00.000Z'),
    address: { city: 'Bangalore', pincode: 560001 },
    hobbies: [ 'music', 'aggregation' ]
  }

]));

/*
8. Read and print all documents:

   printjson(users.find({}).toArray());

9. Create real Date and ObjectId values:

   new Date("2023-01-15T08:30:00.000Z")
   new ObjectId()
   *  */

print("Documents after insert:");
printjson(users.find({}).toArray());

print("Collections after insert:");
printjson(practiceDb.getCollectionNames());