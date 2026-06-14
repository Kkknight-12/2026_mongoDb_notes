# Notes Review Task Tracker

This tracker is for cleaning the `01_model` notes so the main notes include the important explanations/examples from their `doubts.md` and `reference/` files.

Workflow rule:

```text
Finish one task.
Pause.
Brief what changed.
Wait for confirmation.
Then start the next task.
```

## Progress Checklist

- [x] Task 0: Create this tracker and define the review workflow.
- [x] Task 1: Update `01_basic_model_concepts/Basic Model Concepts.md` with missing doubt explanations.
- [x] Task 2: Review Task 1 changes.
- [ ] Task 3: Update `02_Schema_Design_Fundamentals/notes.md` with missing doubt explanations.
- [ ] Task 4: Review Task 3 changes.
- [ ] Task 5: Optionally update `03_Schema_Validation/notes.md` with small missing examples from doubts/reference.
- [ ] Task 6: Review Task 5 changes.
- [ ] Task 7: Final cross-topic audit of `01_model` notes and doubt coverage.

## Task 1: Basic Model Concepts

Target file:

```text
01_model/01_basic_model_concepts/Basic Model Concepts.md
```

Doubt source:

```text
01_model/01_basic_model_concepts/doubts.md
```

Add or improve explanations for:

- [x] `$jsonSchema`: what it is and why it is MongoDB collection-level validation.
- [x] Why `required: ["name", "email"]` is outside `properties`.
- [x] `properties` means field rules, not automatically required fields.
- [x] Application-level schema vs database/collection-level validation.
- [x] `db.getCollection("users")` vs Node driver `database.collection("users")`.
- [x] `getCollection()` creates a reference, not the actual collection.
- [x] Collection is created on first write or explicit `createCollection()`.
- [x] Native driver validation without Mongoose.
- [x] `collMod` for adding/updating validation on an existing collection.
- [x] `deleteMany({})` vs `drop()` for resetting practice collections.
- [x] Add contextual related-doubt links near relevant sections.

Review checklist for Task 1:

- [x] Main note uses easy Hinglish explanation.
- [x] Flow is why -> code -> code samjho where a concept is non-trivial.
- [x] No solved exercise queries are added.
- [x] Doubt links are contextual, not one big top block.
- [x] Link text includes doubt number or clear doubt heading.
- [x] Existing practice exercise references remain intact.

Pause after Task 1:

```text
Brief what changed in Basic Model Concepts.
Wait for user confirmation before starting Task 3.
```

## Task 3: Schema Design Fundamentals

Target file:

```text
01_model/02_Schema_Design_Fundamentals/notes.md
```

Doubt source:

```text
01_model/02_Schema_Design_Fundamentals/doubt.md
```

Add or improve explanations for:

- [ ] `type: Number` vs integer validation.
- [ ] Why `Number` allows decimals.
- [ ] Why `Number.isInteger` is needed for integer-only fields.
- [ ] Same validation pattern for `String`, `Array`, `Date`, and `ObjectId`.
- [ ] What `match` is in Mongoose string fields.
- [ ] When to use `match`.
- [ ] When `match` is not enough and custom validation/service validation is better.
- [ ] `validationAction: "error"`.
- [ ] `validationAction: "warn"`.
- [ ] `validationLevel: "strict"`.
- [ ] `validationLevel: "moderate"`.
- [ ] MongoDB `$jsonSchema` validation applies to Mongoose writes when the collection has a validator.
- [ ] Which Mongoose methods still reach MongoDB validation: `create()`, `save()`, `insertMany()`, `updateOne()`, `updateMany()`, `findOneAndUpdate()`.
- [ ] Difference between MongoDB DB-level validator and Mongoose `{ runValidators: true }`.
- [ ] Add contextual related-doubt links near relevant sections.

Review checklist for Task 3:

- [ ] Main note uses easy Hinglish explanation.
- [ ] Flow is why -> code -> code samjho where a concept is non-trivial.
- [ ] Doubt examples are not over-trimmed.
- [ ] Doubt links are contextual and specific.
- [ ] Existing section order still feels natural.
- [ ] No unrelated refactor is introduced.

Pause after Task 3:

```text
Brief what changed in Schema Design Fundamentals.
Wait for user confirmation before starting Task 5.
```

## Task 5: Schema Validation Optional Touch-up

Target file:

```text
01_model/03_Schema_Validation/notes.md
```

Doubt/reference sources:

```text
01_model/03_Schema_Validation/doubts.md
01_model/03_Schema_Validation/reference/*.md
```

Consider adding:

- [ ] Expected output for invalid `simulateExpressRoute` request.
- [ ] Cleaner `async/await` version of `simulateExpressRoute`.
- [ ] More concrete `$unset`, `$push`, `$inc` examples for update validator caveats.

Review checklist for Task 5:

- [ ] Only add examples if they make revision easier.
- [ ] Avoid making the already-large note unnecessarily heavy.
- [ ] Keep reference-backed examples near the matching section.
- [ ] Preserve existing contextual doubt links.

Pause after Task 5:

```text
Brief what changed in Schema Validation.
Wait for user confirmation before final audit.
```

## Task 7: Final Cross-topic Audit

Files to check:

```text
01_model/01_basic_model_concepts/Basic Model Concepts.md
01_model/02_Schema_Design_Fundamentals/notes.md
01_model/03_Schema_Validation/notes.md
01_model/04_Model_Methods_and_Middleware/notes.md
```

Final review checklist:

- [ ] Every current `doubts.md` / `doubt.md` topic is either explained in the main note or intentionally left only as reference.
- [ ] Every `reference/*Doubt*.md` topic has contextual links from the main note.
- [ ] Link labels include exact doubt number/heading.
- [ ] Main notes do not contain one giant top-level doubt block.
- [ ] Teaching style is consistent: why -> code -> simple explanation.
- [ ] No duplicate competing note files exist.
- [ ] Exercise file references still point to the correct practice files.
- [ ] No accidental solved practice queries were added.

Final pause:

```text
Report final audit result and remaining optional improvements.
```
