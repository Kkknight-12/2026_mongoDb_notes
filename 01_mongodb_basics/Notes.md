# MongoDB Basics

This topic is for first MongoDB practice: creating a practice database,
inserting documents, reading documents, filtering, updating, deleting, counting,
and running a simple aggregation.

## What This Topic Covers

```text
insertMany
find
projection
sort
limit
updateOne
deleteOne
countDocuments
aggregate
```

## Practice Database

The runnable query uses this database:

```text
mongodb_practice
```

It uses this collection:

```text
users
```

## How To Run

Run this file in DataGrip's MongoDB query console:

```text
query.js
```

Or run the same commands in `mongosh`.

For detailed `.js` file running notes, see:

```text
../RUN_QUERY_JS.md
```

Start MongoDB first if needed:

```bash
brew services start mongodb-community@7.0
```

Then connect:

```bash
mongosh
```

## Important Idea

MongoDB stores data as documents:

```js
{
  name: "Amit",
  email: "amit@example.com",
  age: 26,
  isActive: true,
  city: "Delhi"
}
```

Unlike SQL tables, documents in the same collection can have different shapes,
but in real projects you still try to keep structure consistent.

## Common Mistake

Do not confuse these:

```text
mongod  = database server
mongosh = terminal client
query.js = saved runnable query file
```

The query file does not store data. It only contains commands. The actual data
is stored inside the MongoDB server data directory.
