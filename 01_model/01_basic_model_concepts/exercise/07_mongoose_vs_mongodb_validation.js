/*
Exercise 7: Mongoose Schema Vs MongoDB Collection Validation

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/07_mongoose_vs_mongodb_validation.js

Concept to revise:
- application-level schema
- database/collection-level validation
- app gatekeeper vs database gatekeeper

Practice:
1. In comments, write what Mongoose schema validates.
2. In comments, write what MongoDB $jsonSchema validates.
3. Write one example invalid document.
4. Predict whether it should be rejected by:
   - Mongoose only
   - MongoDB only
   - both
   - neither
5. If you want hands-on MongoDB practice, create a validated collection and
   test the MongoDB side.

Expected observation:
- Mongoose schema protects writes that go through the Node/Mongoose app.
- MongoDB validation protects the collection even if Mongoose is bypassed.

Write your MongoDB shell code or comments below this comment.
*/

print("Exercise 7: Mongoose Schema Vs MongoDB Collection Validation");
