# Basic MongoDB Model Concepts

> Ye notes Hinglish mein MongoDB model/design ke basic concepts explain karte hain. MongoDB flexible-schema database hai, lekin real projects mein data consistency ke liye Mongoose schema ya MongoDB collection-level validation use karna common hai.

---

## 1. Document Structure Kya Hota Hai

### Theory

MongoDB ek **document-oriented NoSQL database** hai. Isme data ko **documents** ke form mein store kiya jata hai.

Simple words mein, document ek **JSON jaisa object** hota hai jisme **key-value pairs** hote hain. Lekin internally MongoDB data ko **BSON** format mein store karta hai, isliye MongoDB JSON se zyada data types support karta hai, jaise `ObjectId`, `Date`, `Decimal128`, `Binary`, etc.

MongoDB document ko SQL table ke ek row se compare kar sakte hain, lekin MongoDB document zyada flexible hota hai. Ek document ke andar nested object, arrays, aur multiple data types ek saath store kiye ja sakte hain.

### Example Document

```js
{
  _id: ObjectId("60d21b4667d94d1a84bded7f"),
  name: "Rahul Sharma",
  email: "rahul@example.com",
  age: 25,
  address: {
    street: "123 Main Street",
    city: "Mumbai",
    pincode: 400001
  },
  hobbies: ["reading", "coding", "cricket"],
  isActive: true,
  registeredOn: new Date("2023-01-15T08:30:00.000Z")
}
```

### Explanation

- Ye ek user document hai jisme user ki information store hai.
- `_id` har document ka unique identifier hota hai.
- Agar hum `_id` manually provide nahi karte, to MongoDB driver usually automatically `ObjectId` generate kar deta hai.
- `name`, `email`, `age` simple fields hain.
- `address` ek nested object hai.
- `hobbies` ek array hai.
- `registeredOn` real MongoDB/BSON Date value hai, sirf string nahi.
- MongoDB document JSON jaisa dikhta hai, lekin actual storage BSON mein hoti hai.

### Important Note: JSON vs BSON Date/ObjectId

Pure JSON mein `ObjectId()` ya `new Date()` valid nahi hote. JSON version kuch aisa dikhega:

```json
{
  "_id": "60d21b4667d94d1a84bded7f",
  "registeredOn": "2023-01-15T08:30:00.000Z"
}
```

Lekin MongoDB/mongosh/Node.js mein actual types usually aise hote hain:

```js
_id: ObjectId("60d21b4667d94d1a84bded7f")
registeredOn: new Date("2023-01-15T08:30:00.000Z")
```

Practice this in:

```text
exercise/01_document_structure.js
```

---

## 2. Collections Kya Hote Hain

### Theory

MongoDB mein **collection documents ka group hota hai**, bilkul jaise SQL mein table hoti hai.

- Ek collection mein related/similar type ke documents store kiye jate hain.
- Same collection ke documents ka structure exactly same hona zaruri nahi hota.
- Ek database mein multiple collections ho sakti hain, jaise `users`, `products`, `orders`, etc.

### Example Database Structure

```txt
MyEcommerceApp (database)
  |
  |-- users (collection)
  |     |-- { user document 1 }
  |     |-- { user document 2 }
  |
  |-- products (collection)
  |     |-- { product document 1 }
  |     |-- { product document 2 }
  |
  |-- orders (collection)
        |-- { order document 1 }
        |-- { order document 2 }
```

### Collection Creation Ka Important Point

MongoDB collection ko manually create karna zaruri nahi hota. Agar collection exist nahi karti aur aap usme first document insert karte ho, to MongoDB collection automatically create kar sakta hai.

`createCollection()` tab useful hota hai jab hume collection ke saath special options chahiye, jaise:

- schema validation
- capped collection
- time-series collection
- collation
- clustered collection
- other collection-level options

### Collection Reference Vs Real Collection

MongoDB practice files mein ek important distinction samajhna zaroori hai:

```text
collection reference banana
actual collection create hona
```

Mongosh practice file mein:

```js
const practiceDb = db.getSiblingDB("mongodb_practice");
const users = practiceDb.getCollection("users");
```

Yahan `getSiblingDB("mongodb_practice")` current shell session ko `mongodb_practice` database ka reference deta hai. `getCollection("users")` collection ka reference deta hai.

Lekin:

```text
getCollection("users") collection ko immediately create nahi karta.
```

Collection usually tab actually create hoti hai jab:

```js
users.insertOne({ name: "Amit" });
```

ya jab aap explicitly create karte ho:

```js
practiceDb.createCollection("users");
```

Node.js MongoDB driver mein syntax thoda different hota hai:

```js
const database = client.db("mongodb_practice");
const users = database.collection("users");
```

Simple rule:

```text
mongosh practice file:
practiceDb.getCollection("users")

Node.js MongoDB driver:
database.collection("users")
```

Related doubts:

- [Doubt 3: `db.getCollection("users")` vs `db.collection("users")`](doubts.md)
- [Doubt 4: does `getCollection()` create a collection?](doubts.md)

### Code Example: First Insert Se Collection Create Hona

```js
import { MongoClient } from "mongodb";

async function createCollectionByInsert() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Database se connected!");

    const database = client.db("MyEcommerceApp");

    // Agar users collection exist nahi karti,
    // to first insert par MongoDB ise create kar sakta hai.
    await database.collection("users").insertOne({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      age: 25,
      createdAt: new Date()
    });

    console.log("User insert ho gaya!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createCollectionByInsert();
```

### Code Example: Explicit Collection Creation With Validation

```js
import { MongoClient } from "mongodb";

async function createValidatedCollection() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db("MyEcommerceApp");

    await database.createCollection("validatedUsers", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "email"],
          properties: {
            name: {
              bsonType: "string",
              description: "name required hai aur string hona chahiye"
            },
            email: {
              bsonType: "string",
              pattern: "^.+@.+\\..+$",
              description: "email required hai aur basic email format mein hona chahiye"
            },
            age: {
              bsonType: ["int", "long", "double"],
              minimum: 0,
              description: "age number hona chahiye aur negative nahi hona chahiye"
            },
            createdAt: {
              bsonType: "date",
              description: "createdAt BSON Date hona chahiye"
            }
          }
        }
      },
      validationAction: "error"
    });

    console.log("validatedUsers collection validation ke saath create ho gayi!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createValidatedCollection();
```

> Note: Agar collection already exist karti hai, to `createCollection()` duplicate collection error de sakta hai. Real projects mein ya to pehle check karte hain, ya migrations use karte hain.

### Code Samjho: `$jsonSchema`, `required`, and `properties`

```js
validator: {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email"],
    properties: {
      name: { bsonType: "string" },
      email: { bsonType: "string" },
      age: { bsonType: ["int", "long", "double"] }
    }
  }
}
```

`$jsonSchema` MongoDB ka collection-level validation style hai. Yeh Mongoose model create nahi karta. Yeh MongoDB ko bolta hai:

```text
insert/update accept karne se pehle document ka shape check karo.
```

`required` aur `properties` ka kaam alag hai:

```text
required   = kaun se fields document mein hone hi chahiye
properties = fields ke rules kya hain, agar field present ho
```

Isliye `required` ko `properties` ke andar nahi likhte.

Example:

```js
required: ["name", "email"],
properties: {
  age: { bsonType: ["int", "long", "double"] }
}
```

Meaning:

```text
name required hai.
email required hai.
age optional hai.
Lekin agar age present hai, to age number type honi chahiye.
```

Important:

```text
properties ke andar field likhne se woh automatically required nahi hoti.
Required banana hai to uska naam required array mein add karo.
```

### Existing Collection Par Validation Kaise Update Karein

`createCollection()` new collection create karne ke liye hota hai. Agar collection already exist karti hai aur uski validation rules add/update karni hain, to MongoDB `collMod` command use kar sakte ho.

Node.js MongoDB native driver example:

```js
await database.command({
  collMod: "validatedUsers",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationAction: "error"
});
```

Practical rule:

```text
New validated collection create karni hai:
createCollection(...)

Existing collection ki validation update karni hai:
collMod
```

Related doubts:

- [Doubt 1: MongoDB `$jsonSchema` validator basics](doubts.md)
- [Doubt 5: add MongoDB schema validation from Node.js without Mongoose](doubts.md)

Practice this in:

```text
exercise/02_collection_concept.js
exercise/06_collection_validation_json_schema.js
```

---

## 3. BSON Data Types

### Theory

MongoDB internally data ko **BSON** yani **Binary JSON** format mein store karta hai. BSON JSON jaisa structure rakhta hai, lekin extra data types support karta hai.

### Common BSON Data Types

1. **ObjectId**  
   Usually `_id` field ke liye use hota hai. Ye unique identifier hota hai.

2. **String**  
   Text data ke liye.

3. **Number**  
   MongoDB alag numeric types support karta hai:
   - `Int32`
   - `Int64` / `Long`
   - `Double`
   - `Decimal128`

4. **Boolean**  
   `true` ya `false`.

5. **Date**  
   Date/time store karne ke liye. BSON Date internally milliseconds since Unix epoch store karta hai.

6. **Array**  
   Ordered list of values.

7. **Embedded Document**  
   Nested object/document.

8. **Null**  
   Null value ke liye.

9. **Binary Data**  
   Images/files/binary content store karne ke liye.

10. **Regular Expression**  
    Pattern matching ke liye.

11. **Timestamp**  
    Mostly internal MongoDB use ke liye hota hai. Normal application dates ke liye usually `Date` use karte hain.

12. **MinKey / MaxKey**  
    Special comparison values.

### Mongoose Common Schema Types

Mongoose mein commonly ye schema types use hote hain:

- `String`
- `Number`
- `Boolean`
- `Date`
- `Buffer`
- `Array`
- `Map`
- `mongoose.Schema.Types.ObjectId`
- `mongoose.Schema.Types.Mixed`
- `mongoose.Schema.Types.Decimal128`
- `BigInt`
- `UUID`
- `Int32`
- `Double`

Beginner level par mostly `String`, `Number`, `Boolean`, `Date`, `Array`, nested objects, `ObjectId`, aur `Mixed` enough hote hain.

### Example: Mongoose Schema With Different Data Types

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // _id default hota hai, isliye normally manually define karne ki zarurat nahi hoti.

    // String type
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true, // Important: ye validator nahi, unique index banata hai
      lowercase: true,
      trim: true
    },

    // Number type
    age: {
      type: Number,
      min: 0
    },

    score: {
      type: Number,
      default: 0
    },

    // Date type
    birthDate: Date,

    createdAt: {
      type: Date,
      default: Date.now
    },

    // Boolean type
    isActive: {
      type: Boolean,
      default: true
    },

    // Array of strings
    hobbies: [String],

    // Array of numbers
    scores: [Number],

    // Embedded document / nested object
    address: {
      street: String,
      city: String,
      state: String,
      pincode: Number
    },

    // Array of embedded documents
    education: [
      {
        degree: String,
        school: String,
        year: Number
      }
    ],

    // Map type: dynamic keys ke liye useful
    preferences: {
      type: Map,
      of: String
    },

    // Mixed type: koi bhi structure accept kar sakta hai
    // Production mein limited use karo, kyunki validation/casting kam ho jati hai.
    additionalInfo: mongoose.Schema.Types.Mixed,

    // Decimal128: high precision decimal values ke liye
    balance: mongoose.Schema.Types.Decimal128,

    // Binary data
    profileImage: Buffer,

    // ObjectId reference to another collection/model
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
```

### Important Explanation

- `_id` field normally Mongoose/MongoDB automatically handle kar leta hai.
- `required`, `min`, `max`, `enum`, `match`, custom `validate` etc. Mongoose validators hain.
- `unique: true` Mongoose validation rule nahi hai. Ye MongoDB mein unique index create karne ka shortcut hai.
- Duplicate email insert karne par usually MongoDB `E11000 duplicate key error` dega, Mongoose `ValidationError` nahi.
- `Mixed` flexible hota hai, lekin Mongoose us path par proper casting/validation nahi karta.
- Agar `Mixed` field ke andar nested change karte ho aur change save nahi ho raha, to kabhi-kabhi `doc.markModified("additionalInfo")` call karna padta hai.
- Jahan possible ho, `Mixed` ki jagah proper nested schema define karna better hota hai.

Practice this in:

```text
exercise/03_bson_data_types.js
exercise/04_mongoose_schema_type_mapping.js
```

---

## 4. Schema vs Schemaless Design

### Theory

MongoDB default behavior mein **flexible schema** follow karta hai. Iska matlab same collection ke documents same structure follow karna compulsory nahi hota.

Lekin real applications mein data consistency important hoti hai. Isliye hum usually do levels par schema/validation use kar sakte hain:

1. **Application level schema** using Mongoose
2. **Database/collection level validation** using MongoDB JSON Schema validators

### Application Level Schema Vs Database Level Validation

Application-level schema ka matlab rules aapki Node.js app ke andar run hote hain.

Mongoose example:

```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }
});
```

Is layer ka benefit:

- Mongoose model API milti hai.
- Type casting, defaults, validation messages milte hain.
- Middleware, methods, statics, populate jaise features milte hain.
- Invalid data MongoDB tak pahunchne se pehle app layer par reject ho sakta hai.

Limitation:

```text
Agar write Mongoose app ko bypass karke aati hai, to Mongoose validation run nahi hogi.
```

Database/collection-level validation MongoDB ke andar run hoti hai.

MongoDB example:

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationAction: "error"
});
```

Is layer ka benefit:

```text
Write Mongoose se aaye, native driver se aaye, mongosh se aaye, ya DataGrip se aaye,
MongoDB collection validator still run ho sakta hai.
```

Simple mental model:

```text
Mongoose schema = app ko protect karta hai
MongoDB collection validation = database ko protect karta hai
```

Related doubt:

- [Doubt 2: application-level schema vs database/collection-level validation](doubts.md)

---

### Schemaless Design: MongoDB Default Approach

Schemaless/flexible design ka matlab:

- Same collection mein different structure ke documents store ho sakte hain.
- Har document apne aap mein complete hota hai.
- Runtime par fields add/remove/change karna easy hota hai.
- Development fast ho sakti hai.
- Lekin agar control na ho, to inconsistent data aa sakta hai.

### Example: Schemaless Approach

```js
import { MongoClient } from "mongodb";

async function schemalessExample() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");

  try {
    await client.connect();

    const db = client.db("MyApp");
    const users = db.collection("users");

    // Document 1: age nahi hai
    await users.insertOne({
      name: "Amit",
      email: "amit@example.com",
      isActive: true
    });

    // Document 2: address hai, but isActive nahi hai
    await users.insertOne({
      name: "Priya",
      email: "priya@example.com",
      age: 28,
      address: {
        city: "Delhi"
      }
    });

    console.log("Different structure wale documents insert ho gaye!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

schemalessExample();
```

---

### Schema Design: Using Mongoose

Mongoose schema application level par structure define karta hai.

Benefits:

- Data structure clear hota hai.
- Validation rules set kar sakte hain.
- Default values set kar sakte hain.
- Type casting milti hai.
- Code readability improve hoti hai.
- Model-level methods/middleware define kar sakte hain.

### Example: Schema-based Approach With Mongoose

```js
import mongoose from "mongoose";

async function schemaBasedExample() {
  await mongoose.connect("mongodb://127.0.0.1:27017/MyApp");

  const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, "Name required hai"],
        trim: true
      },

      email: {
        type: String,
        required: [true, "Email required hai"],
        unique: true,
        lowercase: true,
        trim: true
      },

      age: {
        type: Number,
        min: [18, "Age kam se kam 18 honi chahiye"],
        max: [100, "Age 100 se zyada nahi honi chahiye"]
      },

      isActive: {
        type: Boolean,
        default: true
      },

      address: {
        street: String,
        city: String,
        state: String,
        pincode: Number
      }
    },
    {
      timestamps: true
    }
  );

  const User = mongoose.models.SchemaUser || mongoose.model("SchemaUser", userSchema);

  try {
    const user1 = new User({
      name: "Neha",
      email: "neha@example.com",
      age: 25,
      address: {
        city: "Bangalore"
      }
    });

    await user1.save();
    console.log("User save ho gaya!");

    const invalidUser = new User({
      // name missing hai, isliye required validation fail hogi
      email: "invalid@example.com",
      age: 15 // min validation fail hogi
    });

    await invalidUser.save();
  } catch (error) {
    console.error("Validation/Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

schemaBasedExample();
```

---

### MongoDB Collection-level Schema Validation

Mongoose schema application ke andar apply hota hai. Lekin MongoDB khud bhi collection level par validation support karta hai.

Ye useful hota hai jab:

- Multiple services same database use kar rahe ho.
- Koi Mongoose bypass karke direct MongoDB driver se data insert/update kar raha ho.
- Database level par minimum data rules enforce karne ho.

### Example: MongoDB JSON Schema Validation

```js
import { MongoClient } from "mongodb";

async function mongoDBValidationExample() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");

  try {
    await client.connect();

    const db = client.db("MyApp");

    await db.createCollection("students", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "email"],
          properties: {
            name: {
              bsonType: "string"
            },
            email: {
              bsonType: "string"
            },
            age: {
              bsonType: ["int", "long", "double"],
              minimum: 18
            }
          }
        }
      },
      validationAction: "error"
    });

    console.log("students collection validation ke saath create ho gayi!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

mongoDBValidationExample();
```

### Code Samjho: Valid MongoDB Schema, Not Mongoose Model

Yeh syntax valid hai:

```js
db.createCollection("students", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" }
      }
    }
  },
  validationAction: "error"
});
```

Lekin isse Mongoose model nahi banta.

```text
new mongoose.Schema({})
= application-level schema

db.createCollection(... validator: { $jsonSchema: ... })
= MongoDB collection-level validation
```

Mongoose validation aur MongoDB validation dono saath bhi use ho sakte hain. Critical structural rules ke liye database-level validation useful hoti hai, especially jab multiple tools/services same database mein write karte hain.

Related doubts:

- [Doubt 1: MongoDB `$jsonSchema` validator basics](doubts.md)
- [Doubt 2: application-level schema vs database/collection-level validation](doubts.md)

### Practice Reset: `deleteMany({})` Vs `drop()`

Practice files mein kabhi collection reset karni hoti hai. Do common options hain:

```text
deleteMany({}) = sirf documents delete karo
drop()         = poori collection delete karo
```

`deleteMany({})` keeps:

```text
collection name
indexes
collection validator
other collection options
```

Use this when:

```text
Bas purana data remove karke fresh sample documents insert karne hain.
```

`drop()` removes:

```text
documents
indexes
collection validator
collection options
```

Use this when:

```text
Collection ko validation/options ke saath dobara create karna hai.
```

Example mental model:

```text
Flexible schema exercise:
deleteMany({}) enough ho sakta hai, kyunki collection options recreate nahi karne.

Collection validation exercise:
drop() useful ho sakta hai, kyunki validator ke saath clean createCollection(...) chahiye.
```

Related doubt:

- [Doubt 6: `deleteMany({})` vs `drop()` for resetting practice collections](doubts.md)

### Key Differences

| Topic | Schemaless MongoDB | Mongoose Schema | MongoDB Schema Validation |
|---|---|---|---|
| Level | Database flexible by default | Application level | Database/collection level |
| Structure | Predefined structure zaruri nahi | Schema code mein define hota hai | Rules collection par define hote hain |
| Validation | By default minimal | Rich validation support | Database-level validation |
| Use Case | Fast/flexible development | Node.js app consistency | Cross-app/database protection |
| Error Source | Usually MongoDB | Mongoose validation or MongoDB errors | MongoDB validation error |

Practice this in:

```text
exercise/05_flexible_schema.js
exercise/06_collection_validation_json_schema.js
exercise/07_mongoose_vs_mongodb_validation.js
```

---

## 5. Mongoose Kya Hai Aur Kyon Use Karte Hain

### Theory

Mongoose Node.js ke liye ek **ODM** yani **Object Data Modeling library** hai. Ye MongoDB ke saath structured, readable, aur maintainable way mein kaam karne mein help karta hai.

Mongoose MongoDB ke upar ek abstraction layer provide karta hai jisme aap schemas, models, validations, middleware, methods, statics, virtuals, indexes, aur population use kar sakte ho.

### Mongoose Ke Main Features

1. **Schema Definition**  
   Data structure define karne ke liye.

2. **Validation**  
   Built-in aur custom validators ke through data validate karne ke liye.

3. **Type Casting**  
   Input values ko schema ke type ke according cast karne ke liye.

4. **Middleware / Hooks**  
   Operations se pehle ya baad custom logic run karne ke liye. Examples: `validate`, `save`, `updateOne`, `deleteOne`, `findOneAndUpdate`.

5. **Query Building**  
   Readable API ke through queries build karne ke liye.

6. **Population**  
   References ke through related documents ko fetch/replace karne ke liye. Ye SQL join exactly nahi hota. MongoDB mein server-side join-like operation ke liye aggregation ka `$lookup` stage use hota hai.

7. **Virtuals**  
   Derived fields banane ke liye jo database mein store nahi hote.

8. **Instance Methods and Static Methods**  
   Model/document ke saath custom functions attach karne ke liye.

---

## 6. Basic Mongoose Setup and Usage

### Full Example

```js
import mongoose from "mongoose";

// MongoDB se connect karna
async function connectToDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/myapp");
    console.log("MongoDB se successfully connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// BlogPost schema define karna
const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog post ka title required hai"],
      trim: true,
      minlength: [5, "Title kam se kam 5 characters ka hona chahiye"],
      maxlength: [100, "Title 100 characters se zyada nahi ho sakta"]
    },

    content: {
      type: String,
      required: [true, "Content required hai"]
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    categories: [
      {
        type: String,
        enum: ["Technology", "Lifestyle", "Food", "Travel", "Education"]
      }
    ],

    tags: [String],

    publishedDate: {
      type: Date,
      default: Date.now
    },

    isPublished: {
      type: Boolean,
      default: false
    },

    viewCount: {
      type: Number,
      default: 0,
      min: [0, "View count negative nahi ho sakta"]
    },

    slug: {
      type: String,
      validate: {
        validator: function (value) {
          // Slug optional hai. Agar value hai, to format check hoga.
          return value == null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
        },
        message: function (props) {
          return `${props.value} valid slug format nahi hai`;
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property: database mein store nahi hoti
blogPostSchema.virtual("excerpt").get(function () {
  const text = this.content || "";

  if (text.length <= 150) {
    return text;
  }

  return text.substring(0, 150) + "...";
});

// Instance method: particular document par call hota hai
blogPostSchema.methods.incrementViews = async function () {
  this.viewCount += 1;
  return this.save();
};

// Static method: model par directly call hota hai
blogPostSchema.statics.findByCategory = function (category) {
  return this.find({ categories: category });
};

// Middleware: validation se pehle slug auto-generate karna
// Mongoose 9 mein pre middleware mein next() parameter use nahi karna chahiye.
blogPostSchema.pre("validate", function () {
  if (this.isModified("title") && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
});

// Model create karna
const BlogPost = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);

// Model ka use karke operations perform karna
async function blogOperations() {
  await connectToDB();

  try {
    // Create
    const newPost = new BlogPost({
      title: "Mongoose Ka Complete Guide",
      content: "Mongoose ek powerful ODM library hai jo MongoDB ke saath structured way mein kaam karne mein help karti hai...",
      author: new mongoose.Types.ObjectId(),
      categories: ["Technology", "Education"],
      tags: ["mongodb", "nodejs", "database"]
    });

    // Save
    const savedPost = await newPost.save();
    console.log("Blog post created:", savedPost);

    // Find all
    const allPosts = await BlogPost.find({});
    console.log(`Total ${allPosts.length} posts found`);

    // Find one
    const techPost = await BlogPost.findOne({ categories: "Technology" });
    console.log("Technology post:", techPost);

    // Update
    // Important: update validators by default off hote hain,
    // isliye runValidators: true lagana good practice hai.
    const updatedPost = await BlogPost.findByIdAndUpdate(
      savedPost._id,
      { isPublished: true },
      {
        new: true,
        runValidators: true
      }
    );

    console.log("Updated post:", updatedPost);

    // Instance method use karna
    await savedPost.incrementViews();
    console.log("Views incremented to:", savedPost.viewCount);

    // Static method use karna
    const educationPosts = await BlogPost.findByCategory("Education");
    console.log(`${educationPosts.length} education posts found`);
  } catch (error) {
    console.error("Error in blog operations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

blogOperations();
```

### Explanation

- `mongoose.connect()` se MongoDB connection establish hota hai.
- `Schema` se document structure define hota hai.
- `required`, `minlength`, `maxlength`, `min`, `enum`, custom `validate` validators data consistency maintain karte hain.
- `timestamps: true` automatically `createdAt` aur `updatedAt` fields add karta hai.
- Virtual property `excerpt` database mein store nahi hoti; ye runtime par derived value return karti hai.
- Instance method `incrementViews()` ek particular blog post document par call hota hai.
- Static method `findByCategory()` model par call hota hai.
- Middleware `pre("validate")` validation se pehle slug generate karta hai.
- `findByIdAndUpdate()` mein `{ runValidators: true }` use kiya gaya hai, kyunki Mongoose update validators by default off hote hain.
- `new: true` updated document return karta hai.

Practice this in:

```text
exercise/08_mongoose_model_lifecycle.js
```

---

## 7. Population Kya Hota Hai

### Theory

Mongoose population ka matlab hai referenced `ObjectId` field ko related document data se replace/fetch karna.

Example:

```js
const blogPostSchema = new mongoose.Schema({
  title: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});
```

Agar `author` field mein user ka ObjectId stored hai, to hum populate karke user details la sakte hain:

```js
const post = await BlogPost.findById(postId).populate("author", "name email");
```

Iska matlab:

- `author` field mein stored ObjectId ke basis par `User` model se related document fetch hoga.
- `"name email"` ka matlab sirf `name` aur `email` fields select karna.
- Ye SQL join jaisa feel de sakta hai, but exactly SQL join nahi hai.
- MongoDB server-side join-like operation ke liye aggregation pipeline mein `$lookup` use hota hai.

Practice this in:

```text
exercise/09_population_reference_mapping.js
```

---

## 8. Important Gotchas / Common Mistakes

### 1. `unique: true` Validator Nahi Hai

```js
email: {
  type: String,
  required: true,
  unique: true
}
```

Yahan:

- `required: true` validator hai.
- `unique: true` validator nahi hai.
- `unique: true` MongoDB unique index banata hai.
- Duplicate value insert par usually `E11000 duplicate key error` aata hai.

### 2. Update Validators Default Se Off Hote Hain

```js
await User.findByIdAndUpdate(
  userId,
  { age: 10 },
  {
    new: true,
    runValidators: true
  }
);
```

`runValidators: true` ke bina update operation schema validators ko skip kar sakta hai.

### 3. Middleware Mein Arrow Function Avoid Karo Jab `this` Chahiye

Wrong:

```js
blogPostSchema.pre("validate", () => {
  console.log(this.title); // this expected document nahi hoga
});
```

Correct:

```js
blogPostSchema.pre("validate", function () {
  console.log(this.title);
});
```

### 4. Mongoose 9 Mein Pre Middleware Ke Saath `next()` Avoid Karo

Old style:

```js
schema.pre("save", function (next) {
  next();
});
```

Current style:

```js
schema.pre("save", function () {
  // sync logic
});
```

Async logic ke liye:

```js
schema.pre("save", async function () {
  // await async work
});
```

### 5. Date Ko String Ki Tarah Store Mat Samjho

```js
createdAt: "2023-01-15T08:30:00.000Z" // string
```

Better:

```js
createdAt: new Date("2023-01-15T08:30:00.000Z") // BSON Date
```

### 6. `Mixed` Type Ko Carefully Use Karo

```js
extraData: mongoose.Schema.Types.Mixed
```

Ye flexible hai, lekin:

- validation kam ho jati hai
- casting kam ho jati hai
- nested changes auto-detect nahi ho sakte

Kabhi-kabhi:

```js
doc.extraData.deepValue = "changed";
doc.markModified("extraData");
await doc.save();
```

### 7. Mongoose Schema Application Level Par Hai, MongoDB Validation Database Level Par

- Mongoose schema sirf aapki Node.js application ke through apply hota hai.
- Agar koi direct MongoDB driver ya Compass se data insert kare, Mongoose validation run nahi hogi.
- Database level safety chahiye to MongoDB collection validation use karo.

Practice this in:

```text
exercise/10_gotchas_revision.js
```

---

## Final Summary

- MongoDB data ko documents ke form mein store karta hai.
- Document JSON jaisa hota hai, but actual storage BSON mein hoti hai.
- Collection documents ka group hota hai.
- MongoDB flexible-schema by default hai.
- Mongoose application level schema, validation, methods, middleware, virtuals, aur population provide karta hai.
- MongoDB bhi collection-level schema validation support karta hai.
- `unique: true` validator nahi, unique index hota hai.
- Update operations mein validators chahiye to `{ runValidators: true }` use karo.
- Mongoose 9 middleware mein `next()` style avoid karke sync/async function use karo.
- Real projects mein data modeling ke liye schema design, indexes, relationships, aur validation strategy carefully plan karni chahiye.
