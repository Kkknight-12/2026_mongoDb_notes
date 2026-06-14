# 2026 MongoDB Notes

Personal MongoDB learning notes with runnable `mongosh` practice files.

This repo is organized as a practical revision workspace: read the topic note,
write your own query in the linked `.js` exercise file, run it locally, then
record doubts in the topic's `doubts.md`.

## What This Repo Contains

- MongoDB and Mongoose topic notes.
- Topic-specific doubts and reviewed reference answers.
- Runnable MongoDB shell practice files.
- Local workflow docs for running `.js` query files.

Generated images and local visual reference files are excluded from version
control to keep the repository focused on notes and runnable practice code.

## Learning Order

Start with data modeling before jumping into queries:

```text
1. Model
2. CRUD
3. Query Operations
4. Aggregation
5. Indexing
```

Current model topics:

```text
01_model/
  01_basic_model_concepts/
  02_Schema_Design_Fundamentals/
  03_Schema_Validation/
  04_Model_Methods_and_Middleware/
```

## Recommended Workflow

```text
1. Read the topic note.
2. Read related doubts if a concept is confusing.
3. Open the linked exercise/*.js file.
4. Write your own MongoDB shell query below the comments.
5. Run it with mongosh.
6. Fix and rerun until the output makes sense.
```

The notes try to follow this teaching flow:

```text
why the concept exists
code example
simple Hinglish explanation of the code
```

## Run Practice Files

MongoDB shell-style `.js` files should be run with `mongosh`, not `node`.

From the project root:

```bash
mongosh --quiet 01_model/01_basic_model_concepts/exercise/01_document_structure.js
```

For any other exercise:

```bash
mongosh --quiet path/to/exercise_file.js
```

If MongoDB is not running locally:

```bash
brew services start mongodb-community@7.0
```

More details:

```text
RUN_QUERY_JS.md
LEARNING_WORKFLOW.md
PROJECT_STRUCTURE.md
```

## Important Practice Rule

Do not only read queries. Run them, change one condition, and run again.

Example:

```js
db.users.find({ age: { $gt: 25 } })
db.users.find({ age: { $gte: 25 } })
db.users.find({ age: { $lt: 25 } })
```

That is how MongoDB syntax becomes comfortable.
