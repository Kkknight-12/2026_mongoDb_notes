/*
Exercise 2: Collection Concept

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/02_collection_concept.js

Concept to revise:
- database -> collection -> document
- one database can have many collections
- each collection should hold one kind of document
- collection can be created automatically on first insert

Practice:
1. Use the mongodb_practice database.
2. Use three collections:
   - basic_model_collection_users
   - basic_model_collection_products
   - basic_model_collection_orders
3. Reset those collections so every run is clean.
4. Insert one small document into each collection.
5. Print the collection names from the database.
6. Read one document from each collection.

Expected observation:
- A database groups multiple collections.
- A collection groups related documents.
- users, products, and orders should not be mixed into one random collection.
- If a collection does not exist, MongoDB can create it when you insert the
  first document.
*/

print("Exercise 2: Collection Concept");

/*
Hint 1: Select or create a database reference.

Syntax:
const practiceDb = db.getSiblingDB("mongodb_practice");
*/

const practiceDb = db.getSiblingDB("mongodb_practice");

/*
Optional:
You can explicitly create collections with createCollection(), but this exercise
is practicing that MongoDB can create a normal collection on first insert.
*/


/*
Hint 2: Select collection references.

Syntax:
const users = practiceDb.getCollection("basic_model_collection_users");
const products = practiceDb.getCollection("basic_model_collection_products");
const orders = practiceDb.getCollection("basic_model_collection_orders");
*/
// create reference
const users = practiceDb.getCollection("basic_model_collection_users");
const products = practiceDb.getCollection("basic_model_collection_products");
const orders = practiceDb.getCollection("basic_model_collection_orders");



/*
Hint 3: See collection names from a .js file.

Syntax:
printjson(practiceDb.getCollectionNames());

Note:
`show collections` is useful in interactive mongosh, but inside a .js script
use `practiceDb.getCollectionNames()`.
*/
print("Collections before reset/insert:");
printjson(practiceDb.getCollectionNames());


/*
Hint 4: Reset all three collections.

Syntax:
print("Reset users:");
printjson(users.deleteMany({}));
print("Reset products:");
printjson(products.deleteMany({}));
print("Reset orders:");
printjson(orders.deleteMany({}));
*/
// reset data
//users.drop();
//product.drop();
//orders.drop();
print("Reset users:");
printjson(users.deleteMany({}));
print("Reset products:");
printjson(products.deleteMany({}));
print("Reset orders:");
printjson(orders.deleteMany({}));


/*
Hint 5: Insert one user document.

Syntax:
printjson(users.insertOne({
  fieldName: "value"
}));
*/
print("Insert user:");
printjson(users.insertOne(
  {
    "name": "John",
    "age": 25,
    "email": "",
    "address": "123 Main St",
    "phone": "123-456-7890"
  }
));


/*
Hint 6: Insert one product document.

Syntax:
printjson(products.insertOne({
  fieldName: "value"
}));
*/
print("Insert product:");
printjson(products.insertOne(
  {
    "name": "Product 1",
    "price": 10.99,
    "description": "Description of Product 1",
    "category": "Category 1"
  }
));


/*
Hint 7: Insert one order document.

Syntax:
printjson(orders.insertOne({
  fieldName: "value"
}));
*/
print("Insert order:");
printjson(orders.insertOne(
  {
    "user_id": "123",
    "product_id": "123",
    "quantity": 2,
    "total_price": 21.98
  }
));


/*
Hint 8: Read one document from each collection.

Syntax:
print("One user document:");
printjson(users.findOne({}));
print("One product document:");
printjson(products.findOne({}));
print("One order document:");
printjson(orders.findOne({}));
*/
print("One user document:");
printjson(users.findOne({}));
print("One product document:");
printjson(products.findOne({}));
print("One order document:");
printjson(orders.findOne({}));


/*
Hint 9: Read all documents from a collection.

Syntax:
printjson(users.find({}).toArray());

print("Collections after insert:");
printjson(practiceDb.getCollectionNames());
*/
print("All user documents:");
printjson(users.find({}).toArray());

print("Collections after insert:");
printjson(practiceDb.getCollectionNames());
