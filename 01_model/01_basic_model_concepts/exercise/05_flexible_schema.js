/*
Exercise 5: Flexible Schema

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/05_flexible_schema.js

Concept to revise:
- MongoDB is flexible-schema by default.
- Same collection can contain different document shapes.
- Flexibility is useful during development.
- Too much uncontrolled flexibility can make real app data messy.

Practice:
1. Use the mongodb_practice database.
2. Use a collection named basic_model_flexible_schema.
3. Reset the collection.
4. Insert one document with name, email, and isActive.
5. Insert another document with name, email, age, and address.
6. Insert another document with a different optional field.
7. Read all documents and print them.
8. Add comments explaining:
   - why MongoDB accepts these different shapes
   - why a real app should still plan a stable model shape

Expected observation:
- MongoDB accepts different document shapes in the same collection.
- A planned schema is still useful for real apps.
*/

print("Exercise 5: Flexible Schema");

/*
Hint 1: Select or create a database reference.

Syntax:
const practiceDb = db.getSiblingDB("mongodb_practice");
*/
const practiceDb = db.getSiblingDB("mongodb_practice");

/*
Hint 2: Select the exercise collection.

Syntax:
const flexibleUsers = practiceDb.getCollection("basic_model_flexible_schema");

Note:
This only creates a collection reference. The collection appears in MongoDB
after the first insert, or after explicit createCollection().
*/
const collectionName = "basic_model_flexible_schema";
const flexibleUsers = practiceDb.getCollection(collectionName);

/*
Hint 3: Reset the collection.

Syntax:
print("Reset collection:");
printjson(flexibleUsers.deleteMany({}));
*/
print("Reset collection:");
printjson(flexibleUsers.deleteMany({}));

/*
Hint 4: Insert first document with a simple shape.

Document shape:
{
  name: "Amit",
  email: "amit@example.com",
  isActive: true
}

Syntax:
print("Insert user with simple shape:");
printjson(flexibleUsers.insertOne({ ... }));
*/
print("Insert user with simple shape:");
printjson(flexibleUsers.insertOne({
  name: "Amit",
  email: "amit@example.com",
  isActive: true
}));

/*
Hint 5: Insert second document with extra fields.

This document should have:
- name
- email
- age
- address nested object

Example address shape:
address: {
  city: "Delhi",
  pincode: 110001
}

Expected learning:
MongoDB allows this document even though the first document did not have age
or address.
*/
print("Insert user with age and address:");
printjson(flexibleUsers.insertOne({
  name: "Mangesh",
  email: "mangesh@gmail.com",
  age: 12,
  address: {
    city: "Delhi",
    pincode: 110001
  }
}));

/*
Hint 6: Insert third document with a different optional field.

Try a field that only this document has.

Example ideas:
- preferences
- loginHistory
- tags
- socialProfile

Expected learning:
MongoDB does not force every document in the collection to have the same fields
unless you add collection validation.
*/
print("Insert user with different optional fields:");
printjson(flexibleUsers.insertOne({
  name: "Raj",
  email: "raj@example.com",
  preferences: {
    theme: "dark",
    notifications: true
  },
  loginHistory: [
    { date: "2023-01-01", ip: "192.168.1.1" },
    { date: "2023-01-02", ip: "192.168.1.2" }
  ],
  tags: ["premium", "vip"],
  socialProfile: {
    twitter: "@raj",
    linkedin: "linkedin.com/in/raj"
  }
}));

/*
Hint 7: Read and print all documents.

Syntax:
print("All flexible-schema documents:");
printjson(flexibleUsers.find({}).toArray());
*/
print("All flexible-schema documents:");
printjson(flexibleUsers.find({}).toArray());

/*
Hint 8: Compare the document shapes.

Optional syntax:
print("Field names in each document:");
flexibleUsers.find({}).forEach((document) => {
  printjson(Object.keys(document));
});

Expected learning:
Each document can have a different set of keys.
*/
print("Field names in each document:");
flexibleUsers.find({}).forEach((document) => {
  printjson(Object.keys(document));
});


/*
Hint 9: Write revision comments after running your code.

Answer these in comments:

1. Why did MongoDB accept documents with different shapes?

2. What problem can happen if every document has random fields?

3. In a real Node.js app, what can help keep data consistent?

4. At database level, what can help enforce important required fields/types?
*/
