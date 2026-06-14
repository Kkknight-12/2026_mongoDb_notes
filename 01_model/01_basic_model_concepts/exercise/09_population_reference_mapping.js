/*
Exercise 9: Population And Reference Mapping

Run:
mongosh --quiet 01_model/01_basic_model_concepts/exercise/09_population_reference_mapping.js

Concept to revise:
- ObjectId reference
- Mongoose populate
- referenced document vs embedded document

Practice:
1. In comments, design two document shapes:
   - user
   - blog post
2. The blog post should store author as a user ObjectId.
3. Explain in comments what populate("author", "name email") would do.
4. Optional MongoDB shell practice:
   - Insert one user document.
   - Insert one blog post document with author equal to that user's _id.
   - Read both documents.

Expected observation:
- MongoDB stores the ObjectId reference.
- Mongoose populate uses that ObjectId to fetch related document data.
- Population feels like a join, but it is a Mongoose feature.

Write your MongoDB shell code or comments below this comment.
*/

print("Exercise 9: Population And Reference Mapping");
