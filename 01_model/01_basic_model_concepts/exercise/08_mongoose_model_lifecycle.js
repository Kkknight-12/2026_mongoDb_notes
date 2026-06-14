/*
Exercise 8: Mongoose Schema And Model Lifecycle

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/08_mongoose_model_lifecycle.js

Concept to revise:
- schema is created first
- model is created from schema
- model gives create/find/update/delete API in Node.js

Practice:
This is mostly a comment/revision exercise because actual Mongoose code should
run with Node.js, not mongosh.

In comments below, answer:
1. What does schema define?
2. What does model provide?
3. Why do we create schema before model?
4. What does this mean?
   const User = mongoose.model("User", userSchema);
5. Which collection name will Mongoose usually use for User?

Expected observation:
- Schema is the structure/rules.
- Model is the usable API/class created from that schema.

Write your comments below this comment.
*/

print("Exercise 8: Mongoose Schema And Model Lifecycle");
