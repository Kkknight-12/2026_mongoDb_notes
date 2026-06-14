/*
Exercise 10: Gotchas Revision

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/10_gotchas_revision.js

Concept to revise:
- unique is not a validator
- update validators can be skipped in Mongoose
- arrow functions can break this in middleware
- Date is not the same as a date string
- Mixed should be used carefully

Practice:
Write comments below answering:
1. Why is unique: true not the same as required validation?
2. What error usually happens for duplicate unique email?
3. Why can update validators be skipped in Mongoose?
4. Why should arrow functions be avoided in middleware when this is needed?
5. Why is Date different from a date string?
6. Why should Mixed be used carefully?

Optional MongoDB shell practice:
1. Create a unique index on email.
2. Try inserting duplicate emails.
3. Observe the duplicate key error.

Expected observation:
- Some "Mongoose" behavior is actually backed by MongoDB indexes.
- Some validators only run in specific Mongoose operations/options.
- Modeling details matter in real projects.

Write your MongoDB shell code or comments below this comment.
*/

print("Exercise 10: Gotchas Revision");
