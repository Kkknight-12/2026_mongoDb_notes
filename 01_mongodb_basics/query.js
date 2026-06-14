// MongoDB Basics
// Run with:
// mongosh --quiet 01_mongodb_basics/query.js

function section(title) {
  print("\n=== " + title + " ===");
}

// Choose a practice database.
const practiceDb = db.getSiblingDB("mongodb_practice");

// Clean this practice collection if you want a fresh run.
section("Reset collection");
printjson(practiceDb.users.deleteMany({}));

// Insert documents.
section("Insert documents");
printjson(practiceDb.users.insertMany([
  {
    name: "Amit",
    email: "amit@example.com",
    age: 26,
    isActive: true,
    city: "Delhi"
  },
  {
    name: "Priya",
    email: "priya@example.com",
    age: 31,
    isActive: true,
    city: "Bangalore"
  },
  {
    name: "Rahul",
    email: "rahul@example.com",
    age: 22,
    isActive: false,
    city: "Mumbai"
  }
]));

// Read all documents.
section("Read all documents");
printjson(practiceDb.users.find({}).sort({ name: 1 }).toArray());

// Filter documents.
section("Filter active users");
printjson(practiceDb.users.find({ isActive: true }).toArray());

// Comparison operator.
section("Users older than 25");
printjson(practiceDb.users.find({ age: { $gt: 25 } }).toArray());

// Projection: show only selected fields.
section("Projection");
printjson(
  practiceDb.users.find(
    { isActive: true },
    { name: 1, email: 1, _id: 0 }
  ).toArray()
);

// Sort and limit.
section("Sort by age desc and limit 2");
printjson(practiceDb.users.find({}).sort({ age: -1 }).limit(2).toArray());

// Update one document.
section("Update Amit city");
printjson(
  practiceDb.users.updateOne(
    { email: "amit@example.com" },
    { $set: { city: "Gurgaon" } }
  )
);
printjson(practiceDb.users.findOne({ email: "amit@example.com" }));

// Delete one document.
section("Delete Rahul");
printjson(practiceDb.users.deleteOne({ email: "rahul@example.com" }));
printjson(practiceDb.users.find({}).sort({ name: 1 }).toArray());

// Count documents.
section("Count active users");
printjson(practiceDb.users.countDocuments({ isActive: true }));

// Simple aggregation.
section("Aggregate active users by city");
printjson(
  practiceDb.users.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$city", totalUsers: { $sum: 1 } } },
    { $sort: { totalUsers: -1 } }
  ]).toArray()
);
