# Safe MongoDB Playground Query Syntax

Last updated: 2026-06-09

Use this as the quick reference for the MongoDB learning playground. The learner
should feel like they are writing Mongo shell queries, but the backend must run
only safe, parsed, allowlisted MongoDB driver operations.

## Core Rule

Never execute learner input directly.

Do not use:

```js
eval(userInput)
```

Do this instead:

```text
learner query text
  -> backend auth check
  -> parse query into AST
  -> validate allowed shape
  -> map logical collection to learner sandbox collection
  -> execute with MongoDB Node driver
  -> apply result/time/size limits
  -> compare with expected answer
  -> save attempt/progress
```

## Learner Syntax

Learners can type Mongo shell-style queries such as:

```js
db.users.find({ age: { $gt: 25 } })
```

```js
db.users.find({ isActive: true }).sort({ age: -1 }).limit(10)
```

```js
db.users.findOne({ email: "amit@example.com" })
```

```js
db.users.countDocuments({ isActive: true })
```

```js
db.users.insertOne({
  name: "Amit",
  email: "amit@example.com",
  isActive: true
})
```

```js
db.users.updateOne(
  { email: "amit@example.com" },
  { $set: { isActive: false } }
)
```

```js
db.users.deleteOne({ email: "amit@example.com" })
```

```js
db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

## Backend Mapping

The learner writes a friendly collection name:

```js
db.users.find({ age: { $gt: 25 } }).limit(5)
```

The backend maps it to the learner's isolated sandbox collection:

```js
await db
  .collection("sandbox_user123_lesson4_users")
  .find({ age: { $gt: 25 } })
  .limit(5)
  .toArray();
```

The browser never receives MongoDB credentials. The browser sends only the query
text and exercise ID to the backend.

## Allowed MVP Operations

Start with this allowlist:

```text
find
findOne
countDocuments
insertOne
insertMany
updateOne
updateMany
deleteOne
deleteMany
replaceOne
aggregate
sort
limit
skip
project / projection
```

Add later, lesson-gated:

```text
createIndex
listIndexes
explain
```

## Allowed Chain Shape

Allow only method chains rooted at `db`:

```text
db.<collection>.<method>(args)
  .sort(args)
  .limit(number)
  .skip(number)
  .project(args)
```

Examples:

```js
db.products.find({ price: { $gte: 500 } }).sort({ price: 1 })
```

```js
db.products.find({ category: "laptop" }).project({ name: 1, price: 1 })
```

```js
db.products.find({}).skip(10).limit(10)
```

## Blocked Syntax

Reject anything that tries to run arbitrary JavaScript or access unsafe MongoDB
features:

```js
while (true) {}
```

```js
for (;;) {}
```

```js
eval("db.users.find()")
```

```js
process.env
```

```js
fetch("https://example.com")
```

```js
db.adminCommand({ shutdown: 1 })
```

```js
db.getSiblingDB("admin")
```

```js
db.dropDatabase()
```

```js
db.users.find({ $where: "this.age > 25" })
```

Block or lesson-gate very carefully:

```text
$where
$function
$accumulator
$merge
$out
mapReduce
drop
dropDatabase
adminCommand
getSiblingDB
```

## Required Limits

Every query execution should enforce:

```text
authenticated learner ID
sandbox ID
allowed collection names
allowed methods
allowed operators
maxTimeMS
max returned documents
max response size
max aggregation stages
rate limit per learner
attempt logging
reset/reseed path
```

Example default limits:

```text
maxTimeMS: 2000
maxResultDocs: 50
maxResponseBytes: 1 MB
maxAggregationStages: 10
```

## Sandbox Strategy

Learners should not modify the original lesson dataset.

Use one of these strategies:

```text
database per learner:
learner_123_lesson_4.users

collection prefix per learner:
sandbox_user123_lesson4_users

shared collection with sandboxId:
users documents include { sandboxId: "user123_lesson4" }
```

Recommended MVP:

```text
collection prefix per learner
```

It is simple to reset, easy to reason about, and avoids exposing the original
dataset.

## Answer Checking

Each exercise should define the expected behavior:

```text
exercise: Find active users older than 25
expected result IDs: [1, 4, 9]
```

After running the learner query:

```text
actual result
  -> normalize result
  -> compare IDs / values / count / fields
  -> return pass, fail, hint, or error
```

Do not require the exact same query text. A learner can solve the same exercise
with different valid query shapes.

## Minimal Runner Pseudocode

```ts
async function runLearnerQuery({
  learnerId,
  lessonId,
  exerciseId,
  queryText,
}) {
  await requireAuth(learnerId);

  const parsed = parseMongoShellExpression(queryText);
  validateAllowedShape(parsed);
  validateAllowedCollections(parsed, exerciseId);
  validateAllowedMethods(parsed, exerciseId);
  validateAllowedOperators(parsed, exerciseId);

  const physicalCollection = resolveSandboxCollection({
    learnerId,
    lessonId,
    logicalCollection: parsed.collection,
  });

  const result = await executeWithMongoDriver({
    parsed,
    physicalCollection,
    maxTimeMS: 2000,
    maxResultDocs: 50,
  });

  const feedback = await checkExerciseAnswer({
    exerciseId,
    result,
  });

  await saveAttempt({
    learnerId,
    lessonId,
    exerciseId,
    queryText,
    parsedOperation: parsed.operation,
    feedback,
  });

  return {
    result,
    feedback,
  };
}
```

## Mental Model

```text
Learner sees:
db.users.find({ age: { $gt: 25 } })

Backend runs:
safe parsed MongoDB driver call against sandbox_user123_lesson4_users
```

The product should feel like MongoDB shell practice, but internally it is a
controlled educational query runner.
