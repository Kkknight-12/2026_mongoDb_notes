# MongoDB Notes Project Structure

Last updated: 2026-06-09

This file defines how this learning project should be organized.

## Learning Decision

The first step in learning a database is not writing complex queries.

Start with the data model:

```text
What data exists?
How is one record stored?
Which fields belong together?
Which collection should hold this data?
What shape should documents usually follow?
```

For MongoDB, that means learning:

```text
database -> collection -> document -> fields
```

After that, learn queries:

```text
find
filters
projection
sort
limit
count
```

So the project should start with `Model`, but "Model" here means MongoDB data
model basics first. It does not mean jumping directly into advanced Mongoose
models.

## Learning Order

Follow the old `MongoDbNotes` learning-path order, with a practical beginner
interpretation:

```text
1. Model
   - documents
   - collections
   - fields
   - BSON values
   - schema-less vs stable shape

2. CRUD
   - insert
   - read
   - update
   - delete

3. Query Operations
   - filters
   - comparison operators
   - projection
   - sort
   - limit

4. Aggregation
   - pipeline
   - match
   - group
   - project
   - sort

5. Indexing
   - why indexes exist
   - simple indexes
   - compound indexes
   - explain basics
```

## Folder Shape

Use this structure:

```text
2026_mongo_notes/
  PROJECT_STRUCTURE.md
  LEARNING_WORKFLOW.md
  RUN_QUERY_JS.md

  01_model/
    README.md
    01_basic_model_concepts/
      Basic Model Concepts.md
      doubts.md
      query.js
      exercise/
        01_document_structure.js
        02_collection_concept.js

  02_crud/
    README.md
    01_insert_documents/
      Insert Documents.md
      doubts.md
      query.js
      exercise/
        01_insert_one.js

  03_query_operations/
    README.md
    01_find_filters/
      Find Filters.md
      doubts.md
      query.js
      exercise/
        01_find_basic_filters.js
```

## File Responsibilities

The topic markdown file is the source of truth for explanation and practice
exercises.

Examples:

```text
Basic Model Concepts.md
Insert Documents.md
Find Filters.md
```

Use the user's actual notes directly. Do not duplicate or rewrite them into a
separate `Notes.md` unless the learner explicitly asks for a cleaned version.

Practice links should be written inside the same topic markdown file near the
relevant concept:

```text
Practice this in:
exercise/01_document_structure.js
```

Each exercise should get its own executable `.js` file under `exercise/`.

The exercise `.js` file should contain the full task instructions as comments,
then the learner writes MongoDB shell code below those comments.

`query.js` can stay as a general scratch attempt file for the topic.

The learner writes the actual practice code in `exercise/*.js` or `query.js`.

`doubts.md` is for questions that come up while reading the topic note or
writing practice queries.

## Codex Rule

When working on a topic, Codex should read the user's actual topic note first:

```text
<Topic Name>.md
```

Codex should help by:

```text
checking whether the note is clear enough
adding practice links inside the topic note
creating exercise/*.js starter files with comment-only tasks
reviewing the learner's exercise .js or query.js attempt
debugging errors after the learner runs it
explaining why a query works or fails
recording topic-specific doubts in doubts.md
```

Codex should not write the solved MongoDB query directly unless the learner asks
for the solution.

## Practice Task Style

Each exercise `.js` file should give tasks like this:

```js
/*
Exercise: Insert Documents

Practice:
1. Insert two user documents.
2. Find all active users.
3. Show only name and email.

Expected result:
You should see only active users, and each result should include name and email.
*/
```

The learner should read the topic note, open the linked exercise `.js` file,
write the practice code below the comments, run it with `mongosh`, and debug it.

## Runner Command

Run topic practice files with:

```bash
mongosh --quiet topic_folder/query.js
```

For exercise files:

```bash
mongosh --quiet topic_folder/exercise/01_some_exercise.js
```

See `RUN_QUERY_JS.md` for details.
