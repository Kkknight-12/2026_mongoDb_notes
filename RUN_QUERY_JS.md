# How To Run query.js

This project uses topic `.js` files as runnable MongoDB shell scripts.

## Key Idea

MongoDB shell queries can be saved in a `.js` file and run with `mongosh`.

Use this for a topic scratch file:

```bash
mongosh --quiet topic_folder/query.js
```

Use this for a focused exercise file:

```bash
mongosh --quiet topic_folder/exercise/01_some_exercise.js
```

Current first clean topic:

```bash
mongosh --quiet 01_model/01_basic_model_concepts/exercise/01_document_structure.js
```

Do not use this for MongoDB shell-style scripts:

```bash
node topic_folder/exercise/01_some_exercise.js
```

`mongosh` provides the global `db` object.

Normal Node.js does not provide `db`, so shell-style code like this fails in
Node:

```js
const practiceDb = db.getSiblingDB("mongodb_practice");
```

## Full Run Steps

From this project root:

```bash
cd /Users/knight/Desktop/projects/mcp-testing/on/projects/MongoDb/2026_mongo_notes
brew services start mongodb-community@7.0
mongosh --quiet 01_model/01_basic_model_concepts/exercise/01_document_structure.js
```

If MongoDB is already running, you can skip the `brew services start` command.

For a different scratch file, replace the path:

```bash
mongosh --quiet topic_folder/query.js
```

For exercise files:

```bash
mongosh --quiet topic_folder/exercise/01_some_exercise.js
```

## Why printjson Is Used

In interactive `mongosh`, this shows output:

```js
db.users.find({})
```

But inside a `.js` script, plain query lines may execute without printing a
visible result.

For script files, use:

```js
printjson(db.users.find({}).toArray());
```

For `find()` and `aggregate()`, add `.toArray()` so the cursor becomes a real
array that can be printed.

## Mental Model

```text
mongod   = MongoDB database server
mongosh  = MongoDB shell runner
query.js = saved shell commands
```

`query.js` does not store data. It only runs commands. The data is stored inside
the MongoDB server.
