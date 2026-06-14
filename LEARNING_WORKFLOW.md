# MongoDB Learning Workflow

Last updated: 2026-06-09

Use this folder as your local MongoDB knowledge base.

For running any topic's MongoDB shell `.js` file, see:

```text
RUN_QUERY_JS.md
```

## Recommended Workflow

```text
1. Read your actual topic note, for example `Basic Model Concepts.md`.
2. Add questions to `doubts.md` when something is unclear.
3. Open the exercise `.js` file linked near that concept.
4. Write your own attempt below the comments in that exercise file.
5. Run the exercise file in DataGrip or mongosh.
6. Fix the query until it works.
7. Save the final version here.
```

## Tool Roles

```text
DataGrip / Studio 3T = run and inspect queries
mongosh             = quick terminal testing
this folder         = permanent topic notes and runnable query files
```

Do not use Notion as the main query notebook if you want queries to be runnable.
Use local `.md` and `.js` files instead.

## Folder Structure

```text
2026_mongo_notes/
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

  01_mongodb_basics/
    Notes.md
    query.js

  02_crud/
    ...

  03_query_operations/
    ...
```

Each topic folder keeps your actual explanation note and runnable query attempt
together.

## Learning Path Order

Follow the old `MongoDbNotes` learning-path database order:

```text
1. Model
2. CRUD
3. Query Operations
4. Aggregation
5. indexing
```

Inside `Model`, start with:

```text
01_basic_model_concepts
```

## Topic Folder Style

Use this pattern:

```text
topic_name/
  Topic Name.md
  doubts.md
  query.js
  exercise/
    01_first_exercise.js
```

Example:

```text
01_model/01_basic_model_concepts/
  Basic Model Concepts.md
  doubts.md
  query.js
  exercise/
    01_document_structure.js
```

## Topic Note Style

Use your actual topic note as the explanation and practice source:

```text
Basic Model Concepts.md
Schema Design.md
Insert Documents.md
```

Do not create a duplicate `Notes.md` when a better topic note already exists.

Good topic notes should usually contain:

```text
concept explanation
mental model
examples
MongoDB vs Mongoose mapping where useful
common mistakes
links to exercise files
```

Practice links should live directly inside the same topic note near the concept
they belong to. Do not create a separate `practice.md`.

The actual runnable exercise attempt should go in `exercise/*.js`.

`query.js` can be used as a general scratch file for the topic.

## doubts.md Style

Use `doubts.md` for questions and answers that come up during revision:

```text
## Doubt 1: Short title

Question:

Answer:

Rule of thumb:
```

## query.js Style

Use `.js` files for your own MongoDB shell-style query attempts.

```text
exercise/*.js is learner-owned after the task comments.
query.js is learner-owned as a scratch file.
Codex should not write the solved query unless you ask for the solution.
```

Keep each exercise `.js` focused on one exercise.

Good topic folder names:

```text
01_mongodb_basics
02_find_and_projection
03_insert_update_delete
04_aggregation_match_group
05_indexes
```

## Run In DataGrip

1. Open DataGrip.
2. Connect to local MongoDB:

```text
mongodb://localhost:27017
```

3. Open a MongoDB console/query file for the data source.
4. Paste or open a topic's exercise `.js` file.
5. Run it and inspect the result.

## Run In mongosh

```bash
mongosh
```

Then:

```js
use MyApp
```

Paste a query from a topic's exercise `.js` file and run it.

## Practice Rule

Do not only read queries. Always run them, change one condition, and run again.

Example:

```js
db.users.find({ age: { $gt: 25 } })
db.users.find({ age: { $gte: 25 } })
db.users.find({ age: { $lt: 25 } })
```

That is how the syntax becomes muscle memory.
