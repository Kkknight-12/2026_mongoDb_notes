# Schema Validation in MongoDB and Mongoose

> Scope note: Yeh notes mainly **Mongoose validation** ke baare mein hain. MongoDB server-side schema validation database/collection level par hoti hai; Mongoose validation Node.js application layer par hoti hai.

---

## 0. MongoDB schema validation vs Mongoose validation

### MongoDB schema validation

MongoDB collection par validation rules define kar sakte ho, jaise allowed data types, required fields, value ranges, etc. Ye database level par apply hoti hai. Iska fayda ye hai ki agar koi app Mongoose ko bypass karke directly MongoDB me write kare, tab bhi invalid data reject ho sakta hai.

Example idea:

```js
db.createCollection('students', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'rollNumber'],
      properties: {
        name: { bsonType: 'string' },
        rollNumber: { bsonType: 'string' },
        grade: { bsonType: 'int', minimum: 0, maximum: 100 }
      }
    }
  }
});
```

MongoDB validation insert/update dono ko reject kar sakti hai agar final document invalid ban raha ho.

### Mongoose validation

Mongoose validators schema ke andar define hote hain. Ye app layer par run hote hain.

Important:

- `save()` aur `create()` par validators automatically run hote hain.
- `updateOne()`, `updateMany()`, `findOneAndUpdate()` par validators default off hote hain.
- Update queries par validation chahiye toh `{ runValidators: true }` use karna padta hai.
- Update validators ke caveats hote hain: ye full document validation jaise behave nahi karte.

---

## 1. Built-in Validators

### Theory

**Mongoose built-in validators** commonly used validation scenarios ko handle karte hain. Ye validators schema definition ke time set kiye jaate hain aur document save hone se pehle check hote hain.

Common validators:

- `required`: field hona zaroori hai.
- `min` / `max`: number/date range.
- `minlength` / `maxlength`: string length.
- `enum`: allowed values ki fixed list.
- `match`: regex pattern.
- `trim`: string save hone se pehle leading/trailing spaces remove.
- `validate`: custom rule ke liye.

### Code example: Product schema with built-in validators

```ts
// Built-in validators ka demonstration
import mongoose, { Schema, Document } from 'mongoose';

// Interface for TypeScript support
interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
  category: string;
  tags: string[];
  description?: string;
  manufacturingDate?: Date;
  weight?: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

// Schema definition with built-in validators
const ProductSchema = new Schema<IProduct>({
  // String validators
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true, // Remove whitespace from both ends
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },

  // Number validators
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1_000_000, 'Price is too high']
  },

  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: Number.isInteger, // Must be an integer
      message: 'Stock must be an integer value'
    }
  },

  // Enum validator - value must be from a predefined list
  category: {
    type: String,
    required: true,
    enum: {
      values: ['Electronics', 'Clothing', 'Food', 'Books', 'Sports'],
      message: '{VALUE} is not a supported category'
    }
  },

  // Array validator
  tags: {
    type: [String],
    validate: {
      validator: function(tags?: string[]) {
        // Field optional hai, so missing value ko allow kar rahe hain.
        return !tags || tags.length <= 10;
      },
      message: 'You can specify a maximum of 10 tags'
    }
  },

  // Match validator - value must match regex pattern
  description: {
    type: String,
    match: [/^[A-Za-z0-9 .,!?-]+$/, 'Description contains invalid characters']
  },

  // Date validators
  manufacturingDate: {
    type: Date,
    max: [Date.now, 'Manufacturing date cannot be in the future'],
    validate: {
      validator: function(date?: Date) {
        // Field optional hai, so missing value pass.
        if (!date) return true;
        return date.getFullYear() >= 2020;
      },
      message: 'Manufacturing date must be after 2020'
    }
  },

  // Number validators with {VALUE} in message
  weight: {
    type: Number,
    min: [0.1, 'Weight ({VALUE}kg) is too low, minimum is 0.1kg'],
    max: [1000, 'Weight ({VALUE}kg) is too high, maximum is 1000kg']
  },

  // Nested object validators
  dimensions: {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 }
  }
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);
```

### Usage example: valid vs invalid product

```ts
async function createProductWithValidation() {
  try {
    // Valid product - will pass all validations
    const validProduct = new Product({
      name: 'Smartphone XYZ',
      price: 15000,
      stock: 50,
      category: 'Electronics',
      tags: ['smartphone', 'android', 'camera'],
      description: 'A high-quality smartphone with amazing features.',
      manufacturingDate: new Date('2023-01-15'),
      weight: 180,
      dimensions: {
        length: 15,
        width: 7,
        height: 0.8
      }
    });

    await validProduct.save();
    console.log('Valid product saved successfully');

    // Invalid product - will fail validations
    const invalidProduct = new Product({
      name: 'AB', // Too short: min 3 characters
      price: -100, // Negative price not allowed
      stock: 10.5, // Not an integer
      category: 'Gadgets', // Not in enum list
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], // More than 10 tags
      description: 'Has <script> tags', // Invalid characters
      manufacturingDate: new Date('2019-12-31'), // Before 2020
      weight: 0.05, // Below min weight
      dimensions: {
        length: -5, // Negative not allowed
        width: 10
        // height missing: required
      }
    });

    await invalidProduct.save();
  } catch (error: any) {
    console.error('Validation Error:', error.message);
  }
}

createProductWithValidation();
```

### Key points

- Validation rules document save hone se pehle check kiye jaate hain.
- Agar koi validation fail hota hai, document save nahi hota aur error throw hota hai.
- Optional field ke custom validator me usually missing value par `true` return karte hain.
- `type: Number` sirf number type/casting handle karta hai; integer enforce karna ho toh `Number.isInteger` jaisa custom validator use karo.

---

## 2. Custom Validators

### Theory

Built-in validators kaafi useful hote hain, lekin complex validation rules ke liye custom validators ki zaroorat hoti hai. Custom validators functions hote hain jo value check karte hain aur usually `true` ya `false` return karte hain. Async validator `Promise` return kar sakta hai.

### Code example: User schema with custom validators

```ts
// Custom validators ka demonstration
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,

    // Simple custom validator - username cannot contain spaces
    validate: {
      validator: function(value: string) {
        return !value.includes(' ');
      },
      message: 'Username cannot contain spaces'
    }
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,

    // Email validation with regex pattern
    validate: {
      validator: function(email: string) {
        // Demo regex. Production me validator.js jaise library better hai.
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },

  password: {
    type: String,
    required: true,

    // Multiple validation rules combined in one validator
    validate: {
      validator: function(password: string) {
        const isLongEnough = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return isLongEnough && hasUppercase && hasLowercase && hasDigit && hasSpecial;
      },
      message: 'Password must include uppercase, lowercase, number, and special character'
    }
  },

  phoneNumber: {
    type: String,

    // Async validator - for operations that need async processing
    validate: {
      validator: async function(phone?: string) {
        // Field optional hai, isliye empty value allow kar rahe hain.
        if (phone == null || phone === '') return true;

        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 10) return false;

        // Demo async check
        return new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(digits.startsWith('9')), 100);
        });
      },
      message: 'Phone number must be 10 digits and start with 9'
    }
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'editor'],
    default: 'user'
  },

  birthYear: {
    type: Number,

    // Validator with document context - accessing other document fields
    validate: {
      validator: function(this: any, birthYear?: number) {
        if (!birthYear) return true;

        const currentYear = new Date().getFullYear();
        const minAge = this.role === 'admin' ? 21 : 18;

        return currentYear - birthYear >= minAge;
      },
      // Dynamic message me `this` par rely karna version/context ke hisaab se tricky ho sakta hai.
      // Generic message safer hai.
      message: 'User does not meet the minimum age requirement for this role'
    }
  },

  // Teaching example: uniqueness check using async validator.
  // Important: this is race-prone. Final guarantee database unique index se hi milti hai.
  employeeId: {
    type: String,
    unique: true, // MongoDB unique index. This is NOT a Mongoose validator.
    validate: {
      validator: async function(this: any, id?: string) {
        if (!id) return true;

        // For new documents, check if ID already exists.
        if (this.isNew) {
          const existingUser = await mongoose.models.User.findOne({ employeeId: id });
          return !existingUser;
        }

        // For existing documents, exclude current document.
        const existingUser = await mongoose.models.User.findOne({
          employeeId: id,
          _id: { $ne: this._id }
        });

        return !existingUser;
      },
      message: 'Employee ID already exists'
    }
  },

  // Array items validation
  hobbies: {
    type: [String],
    validate: {
      validator: function(hobbies?: string[]) {
        return !hobbies || hobbies.every(hobby => hobby.length >= 3);
      },
      message: 'Each hobby name must be at least 3 characters long'
    }
  },

  // Custom validator with nested object
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: {
      type: String,
      validate: {
        validator: function(zipCode?: string) {
          if (!zipCode) return true;
          return /^\d{6}$/.test(zipCode);
        },
        message: 'ZIP code must be a 6-digit number'
      }
    }
  }
});

const User = mongoose.model('User', UserSchema);
```

### Usage example: valid vs invalid user

```ts
async function createUserWithCustomValidation() {
  try {
    // Valid user
    const validUser = new User({
      username: 'rajeev_kumar',
      email: 'rajeev@example.com',
      password: 'Secure@123',
      phoneNumber: '9876543210',
      birthYear: 1995,
      role: 'user',
      employeeId: 'EMP001',
      hobbies: ['reading', 'cricket', 'photography'],
      address: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      }
    });

    await validUser.save();
    console.log('Valid user saved successfully');

    // Invalid user with validation errors
    const invalidUser = new User({
      username: 'neha kumar', // Contains space
      email: 'neha@invalid', // Invalid email format
      password: 'weak', // Doesn't meet password criteria
      phoneNumber: '1234567890', // Doesn't start with 9
      birthYear: 2010, // Too young
      role: 'admin', // Admin requires higher age
      employeeId: 'EMP001', // Already exists / duplicate risk
      hobbies: ['tv', 'reading', 'hi'], // short hobby names
      address: {
        street: '456 Second St',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '12345' // Not 6 digits
      }
    });

    await invalidUser.save();
  } catch (error: any) {
    if (error?.code === 11000) {
      console.error('Duplicate key error: Employee ID already exists');
      return;
    }

    console.error('Validation Errors:', error.message);
  }
}

createUserWithCustomValidation();
```

### Important note: `unique` validator nahi hota

```ts
employeeId: { type: String, unique: true }
```

Yeh Mongoose validation rule nahi hai. Yeh MongoDB unique index banata hai. Duplicate value par generally `E11000 duplicate key error` aata hai, not `ValidationError`.

Agar user-friendly message chahiye, duplicate key error ko catch karke response format karo:

```ts
try {
  await User.create({ employeeId: 'EMP001' });
} catch (error: any) {
  if (error?.code === 11000) {
    console.log('Employee ID already exists');
  }
}
```

Async validator se uniqueness check karna teaching/demo ke liye samajh aa sakta hai, but race condition possible hoti hai. Final guarantee database unique index se hi milti hai.

---

## 3. Error Handling in Validation

### Theory

Validation errors ko properly handle karna important hai taaki users ko meaningful feedback mil sake. Mongoose validation errors structured format me aate hain, jisse field-specific errors extract kiye ja sakte hain.

### Code example: Employee schema + error handling demonstrations

```ts
// Validation error handling ka demonstration
import mongoose, { Schema } from 'mongoose';

// Simple schema with multiple validations
const EmployeeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: function(email: string) {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [10000, 'Salary must be at least ₹10,000']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: {
      values: ['HR', 'IT', 'Finance', 'Marketing', 'Operations'],
      message: '{VALUE} is not a valid department'
    }
  }
});

const Employee = mongoose.model('Employee', EmployeeSchema);
```

### 1. Basic error handling

```ts
async function basicErrorHandling() {
  try {
    // Empty document - will trigger multiple validation errors
    const employee = new Employee({});
    await employee.save();
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.log('Basic Validation Error:');
      console.log(error.message);
      // Example output:
      // Employee validation failed: name: Name is required, email: Email is required, ...
    }
  }
}
```

### 2. Detailed field-wise error extraction

```ts
async function detailedErrorHandling() {
  try {
    const employee = new Employee({
      name: 'A', // Too short
      email: 'invalid-email', // Invalid format
      salary: 5000, // Below minimum
      department: 'Sales' // Not in enum
    });

    await employee.save();
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.log('\nDetailed Validation Errors:');

      // Loop through all error fields
      Object.keys(error.errors).forEach(fieldName => {
        const fieldError = error.errors[fieldName];
        console.log(`Field: ${fieldName}`);
        console.log(`Message: ${fieldError.message}`);
        console.log(`Kind: ${fieldError.kind}`);
        console.log(`Value: ${fieldError.value}`);
        console.log('---');
      });
    }
  }
}
```

### 3. CastError nuance

Agar aap `salary: 'not_a_number'` save karte ho, Mongoose often top-level `ValidationError` throw karta hai, jiske andar `error.errors.salary` ek `CastError` ho sakta hai.

```ts
async function detectNestedCastError() {
  try {
    const employee = new Employee({
      name: 'Rahul',
      email: 'rahul@example.com',
      salary: 'not_a_number', // Should be number
      department: 'IT'
    });

    await employee.save();
  } catch (error: any) {
    console.log('\nError Type Detection:');

    if (error instanceof mongoose.Error.ValidationError) {
      console.log('This is a validation error');

      const salaryError = error.errors.salary;
      if (salaryError instanceof mongoose.Error.CastError) {
        console.log('Salary has wrong data type');
      }
    }

    if (error instanceof mongoose.Error.CastError) {
      console.log('This is a top-level cast error');
    }

    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.log('This is a duplicate key error');
    }
  }
}
```

Top-level CastError usually query casting me mil sakta hai:

```ts
async function detectQueryCastError() {
  try {
    await Employee.findById('not-a-valid-object-id');
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      console.log('Invalid ObjectId');
    }
  }
}
```

### 4. User-friendly error messages

```ts
async function userFriendlyMessages() {
  try {
    const employee = new Employee({
      name: 'R',
      email: 'invalid',
      salary: 5000,
      department: 'Unknown'
    });

    await employee.save();
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.log('\nUser-Friendly Error Messages:');

      const errorMessages: string[] = [];

      Object.keys(error.errors).forEach(fieldName => {
        const fieldError = error.errors[fieldName];

        // Convert camelCase field name to readable field name
        const friendlyFieldName = fieldName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        let message = fieldError.message;

        // Example: make default required message more friendly
        if (message.includes('required')) {
          message = `${friendlyFieldName} field is required.`;
        }

        errorMessages.push(message);
      });

      console.log('Please correct the following errors:');
      errorMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg}`);
      });
    }
  }
}
```

### 5. Error handling in API context: simulated Express route

```ts
function simulateExpressRoute(req: any, res: any) {
  const employee = new Employee(req.body);

  employee.save()
    .then(savedEmployee => {
      // Success response
      return res.status(201).json({
        success: true,
        data: savedEmployee
      });
    })
    .catch(error => {
      // Error handling
      if (error instanceof mongoose.Error.ValidationError) {
        // Create structured validation error response
        const errors: Record<string, string> = {};

        Object.keys(error.errors).forEach(fieldName => {
          errors[fieldName] = error.errors[fieldName].message;
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate key error'
        });
      }

      // Handle other error types
      return res.status(500).json({
        success: false,
        message: 'An error occurred',
        error: error.message
      });
    });
}
```

### Simulate API request with invalid data

```ts
console.log('\nAPI Error Response Example:');

simulateExpressRoute(
  { body: { name: 'X', email: 'bad', salary: 5000, department: 'Unknown' } },
  {
    status: function(code: number) {
      console.log(`Response Status: ${code}`);
      return this; // chaining ke liye res object return kar rahe hain
    },
    json: function(data: unknown) {
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return this;
    }
  }
);
```

Expected output will look roughly like this:

```txt
API Error Response Example:
Response Status: 400
Response Data: {
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Name must be at least 2 characters long",
    "email": "Please provide a valid email address",
    "salary": "Salary must be at least ₹10,000",
    "department": "Unknown is not a valid department"
  }
}
```

Exact error order par depend mat karo, because validation error fields ka order business logic ka base nahi hona chahiye.

### Same route in async/await style

Promise `.then().catch()` style valid hai, but real route handlers me async/await usually easier lagta hai.

```ts
async function simulateExpressRouteAsync(req: any, res: any) {
  try {
    const employee = new Employee(req.body);
    const savedEmployee = await employee.save();

    return res.status(201).json({
      success: true,
      data: savedEmployee
    });
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errors: Record<string, string> = {};

      Object.keys(error.errors).forEach(fieldName => {
        errors[fieldName] = error.errors[fieldName].message;
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate key error'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred',
      error: error.message
    });
  }
}
```

Code samjho:

- `try` block me normal successful flow hai: document banao, `save()` karo, success response return karo.
- `catch` block me validation/duplicate/unknown error ko alag-alag response me convert kar rahe hain.
- `return res.status(...).json(...)` current function se return karta hai, taaki same request me accidental second response na bhejo.

### Why fake `res.status().json()` works

- `simulateExpressRoute(req, res)` me second object `res` parameter ban jata hai.
- `res.status(400)` fake `status` method ko call karta hai.
- `status()` `this` return karta hai, jisse `.json()` chaining possible hoti hai.
- Real Express me bhi `res.status(400).json(...)` pattern common hai.
- Yahan actual HTTP response nahi ja raha; sirf console me response simulate ho raha hai.
- Important: fake `res` object me `status` aur `json` ke liye normal `function` use kiya gaya hai, arrow function nahi, kyunki `this` ko object point karna chahiye.

Related doubts:

- [simulateExpressRoute Doubt 1: function ke `req` aur `res` parameters kaise work kar rahe hain?](reference/simulateExpressRoute_Doubts_reviewed.md)
- [simulateExpressRoute Doubt 2: `res.status(400).json(...)` kaise kaam karta hai?](reference/simulateExpressRoute_Doubts_reviewed.md)
- [simulateExpressRoute Doubt 3: `this` kya hai in fake response object?](reference/simulateExpressRoute_Doubts_reviewed.md)
- [simulateExpressRoute Doubt 4: `return res.status(400).json(...)` mein `return` kyun?](reference/simulateExpressRoute_Doubts_reviewed.md)

---

## 4. Conditional Validation

### Theory

Conditional validation ka matlab hai ki validation rules sirf specific condition true hone par apply hon. Ye complex business rules ke liye useful hai jahan validation ek field ke value par depend karti hai.

Example: `paymentType` ke basis par card details, UPI ID, bank details, receipt format, billing address sab alag-alag required/valid ho sakte hain.

### Code example: Payment schema with conditional validation

```ts
// Conditional validation ka demonstration
import mongoose, { Schema } from 'mongoose';

// billingAddress ek single nested subdocument hai.
// { _id: false } optional hai: agar nested address ke liye separate _id nahi chahiye.
const BillingAddressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

const PaymentSchema = new Schema({
  paymentType: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'upi', 'bank_transfer', 'cash']
  },

  // Card details - required only for credit/debit card
  cardNumber: {
    type: String,
    required: function(this: any) {
      return ['credit_card', 'debit_card'].includes(this.paymentType);
    },
    validate: {
      validator: function(cardNum?: string) {
        if (!cardNum) return true; // required handles missing value
        const digits = cardNum.replace(/\s+/g, '');
        return /^\d{16}$/.test(digits);
      },
      message: 'Please provide a valid 16-digit card number'
    }
  },

  cardExpiryMonth: {
    type: Number,
    min: 1,
    max: 12,
    required: function(this: any) {
      return ['credit_card', 'debit_card'].includes(this.paymentType);
    }
  },

  cardExpiryYear: {
    type: Number,
    min: new Date().getFullYear(),
    required: function(this: any) {
      return ['credit_card', 'debit_card'].includes(this.paymentType);
    }
  },

  cvv: {
    type: String,
    required: function(this: any) {
      return ['credit_card', 'debit_card'].includes(this.paymentType);
    },
    validate: {
      validator: function(cvv?: string) {
        if (!cvv) return true;
        return /^\d{3,4}$/.test(cvv);
      },
      message: 'CVV must be 3 or 4 digits'
    }
  },

  // UPI details - required only for UPI
  upiId: {
    type: String,
    required: function(this: any) {
      return this.paymentType === 'upi';
    },
    validate: {
      validator: function(this: any, upiId?: string) {
        if (this.paymentType !== 'upi') return true;
        if (!upiId) return true; // required handles missing value
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId);
      },
      message: 'Please provide a valid UPI ID'
    }
  },

  // Bank details - required only for bank transfer
  accountNumber: {
    type: String,
    required: function(this: any) {
      return this.paymentType === 'bank_transfer';
    }
  },

  ifscCode: {
    type: String,
    required: function(this: any) {
      return this.paymentType === 'bank_transfer';
    },
    validate: {
      validator: function(this: any, ifsc?: string) {
        if (this.paymentType !== 'bank_transfer') return true;
        if (!ifsc) return true;
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
      },
      message: 'Please provide a valid IFSC code'
    }
  },

  // Amount - always required, but extra rule depends on payment type
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1'],
    validate: {
      validator: function(this: any, amount: number) {
        if (this.paymentType === 'credit_card') return amount >= 100;
        if (this.paymentType === 'cash') return amount <= 10000;
        return true;
      },
      message: 'Amount is not valid for this payment type'
    }
  },

  // Receipt number - required for all payment types except UPI
  receiptNumber: {
    type: String,
    required: function(this: any) {
      return this.paymentType !== 'upi';
    },
    validate: {
      validator: function(this: any, receipt?: string) {
        if (!receipt) return true; // required handles missing value

        if (['credit_card', 'debit_card'].includes(this.paymentType)) {
          return /^CARD-\d{4}-\d{5}$/.test(receipt);
        }
        if (this.paymentType === 'bank_transfer') {
          return /^BNK-\d{4}-\d{5}$/.test(receipt);
        }
        if (this.paymentType === 'cash') {
          return /^CASH-\d{4}-\d{5}$/.test(receipt);
        }

        return true;
      },
      message: 'Invalid receipt number format for this payment type'
    }
  },

  // Nested object with conditional validation
  billingAddress: {
    type: BillingAddressSchema,

    // Entire address object is conditionally required
    required: function(this: any) {
      return ['credit_card', 'debit_card', 'bank_transfer'].includes(this.paymentType);
    },

    // Check complete address only when relevant
    validate: {
      validator: function(this: any, address: any) {
        if (!['credit_card', 'debit_card', 'bank_transfer'].includes(this.paymentType)) {
          return true;
        }

        return !!(
          address &&
          address.street &&
          address.city &&
          address.state &&
          address.zipCode &&
          address.country
        );
      },
      message: 'Complete billing address is required for this payment type'
    }
  }
});
```

### Pre-validate hook for cross-field validation

```ts
PaymentSchema.pre('validate', function(next) {
  // Cross-field validation example
  if (this.paymentType === 'credit_card' && this.amount > 100000) {
    this.invalidate('amount', 'Credit card payments cannot exceed ₹100,000', this.amount);
  }

  // For card payments, check if expiry date is valid
  if (['credit_card', 'debit_card'].includes(this.paymentType)) {
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed
    const currentYear = new Date().getFullYear();

    if (this.cardExpiryYear === currentYear && this.cardExpiryMonth < currentMonth) {
      this.invalidate('cardExpiryMonth', 'Card has expired', this.cardExpiryMonth);
    }
  }

  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);
```

Related doubt:

- [Doubt 1: kya `pre('validate')` `updateOne()` ya `findOneAndUpdate()` par chalega?](doubts.md)

### Usage examples: different payment types

```ts
async function demonstrateConditionalValidation() {
  try {
    // 1. Valid credit card payment
    const creditCardPayment = new Payment({
      paymentType: 'credit_card',
      cardNumber: '4111 1111 1111 1111',
      cardExpiryMonth: 12,
      cardExpiryYear: new Date().getFullYear() + 1,
      cvv: '123',
      amount: 500,
      receiptNumber: `CARD-${new Date().getFullYear()}-12345`,
      billingAddress: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      }
    });

    await creditCardPayment.save();
    console.log('Credit card payment saved successfully');

    // 2. Valid UPI payment
    const upiPayment = new Payment({
      paymentType: 'upi',
      upiId: 'user@ybl',
      amount: 50
      // No receipt number needed for UPI
      // No billing address needed for UPI
    });

    await upiPayment.save();
    console.log('UPI payment saved successfully');

    // 3. Invalid credit card payment: missing required fields
    try {
      const invalidCreditCard = new Payment({
        paymentType: 'credit_card',
        // Missing card details
        amount: 200,
        receiptNumber: `CARD-${new Date().getFullYear()}-12345`
        // Missing billing address
      });

      await invalidCreditCard.save();
    } catch (error: any) {
      console.log('Credit card error (as expected):', error.message);
    }

    // 4. Invalid UPI payment: invalid UPI ID
    try {
      const invalidUpi = new Payment({
        paymentType: 'upi',
        upiId: 'invalid-upi-format',
        amount: 100
      });

      await invalidUpi.save();
    } catch (error: any) {
      console.log('UPI error (as expected):', error.message);
    }

    // 5. Cash payment with amount exceeding limit
    try {
      const invalidCash = new Payment({
        paymentType: 'cash',
        amount: 15000,
        receiptNumber: `CASH-${new Date().getFullYear()}-12345`
      });

      await invalidCash.save();
    } catch (error: any) {
      console.log('Cash error (as expected):', error.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

demonstrateConditionalValidation();
```

### Why `billingAddress` me `new Schema`?

`billingAddress` ek **single nested subdocument** hai. Isse alag collection nahi banta. Ye `payments` collection ke document ke andar embedded object ke form me store hota hai.

Named schema style:

```ts
const BillingAddressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

billingAddress: {
  type: BillingAddressSchema
}
```

Inline style bhi valid hai:

```ts
billingAddress: {
  type: new Schema({
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }, { _id: false })
}
```

Important points:

- `new Schema` yahan nested object/subdocument ka structure define kar raha hai.
- `mongoose.model('Payment', PaymentSchema)` sirf `Payment` model/collection banata hai.
- `billingAddress` ka alag collection nahi banta.
- `{ _id: false }` optional hai. Agar nahi doge, Mongoose nested subdocument ke liye `_id` add kar sakta hai.
- Validator me `function(this: any, address: any)` TypeScript syntax hai. Actual runtime me validator ko field value (`address`) milti hai, aur `this` document context hota hai.

Related doubts:

- [Billing address Doubt 1: `billingAddress` ke liye `new Schema` kyun use kiya? Kya new collection banega?](reference/Doubts_billingAddress_new_schema_reviewed.md)
- [Billing address Doubt 2: validator mein `function(this, address)` parameters](reference/Doubts_billingAddress_new_schema_reviewed.md)
- [Billing address Doubt 3: complete billing address validation flow](reference/Doubts_billingAddress_new_schema_reviewed.md)

---

## 5. Update Validation

### Theory

By default, Mongoose update operations par validators run nahi karta. `save()` / `create()` par validators automatically run hote hain, lekin `updateOne()`, `updateMany()`, `findOneAndUpdate()` par validation chahiye toh `{ runValidators: true }` explicitly pass karna padta hai.

Important: Update validators document validation jaise full document validate nahi karte. Ye mostly update me specified paths par apply hote hain.

### Code example: Student schema with validation

```ts
// Update validation ka demonstration
import mongoose, { Schema } from 'mongoose';

const StudentSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 2
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true, // unique index, validator nahi
    immutable: true // Once set, cannot be changed through normal updates
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: function(email: string) {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  subjects: {
    type: [String],
    validate: {
      validator: function(arr?: string[]) {
        return !!arr && arr.length > 0;
      },
      message: 'At least one subject must be selected'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});
```

### Pre-update hook example: `getUpdate()` and `setUpdate()`

```ts
// Pre-update middleware to update the lastUpdated field
StudentSchema.pre('findOneAndUpdate', function(next) {
  // Set lastUpdated to current time
  this.setUpdate({ ...this.getUpdate(), lastUpdated: new Date() } as any);
  next();
});
```

Explanation:

- `this` yahan document nahi, Mongoose `Query` object hota hai.
- `this.getUpdate()` current update object return karta hai. Example: `{ name: 'Rahul Sharma' }`.
- `this.setUpdate(...)` current update object ko replace/modify karta hai.
- `{ ...this.getUpdate(), lastUpdated: new Date() }` existing update ke saath `lastUpdated` add karta hai.
- `as any` TypeScript ke liye hai, kyunki Mongoose query update types complex ho sakte hain.

Simple words me: har `findOneAndUpdate()` se pehle update object me `lastUpdated: new Date()` add kar diya jaata hai.

Related doubts:

- [Update Doubt 1: `this.setUpdate(...)`, `getUpdate()`, and query middleware](reference/Updation_doubts_reviewed.md)

#### Safer alternatives

`getUpdate()` / `setUpdate()` teaching pattern simple updates ke liye useful hai. Operator-based updates (`$set`, `$inc`, etc.) ke saath direct spread kabhi-kabhi confusing ho sakta hai. Safer option:

```ts
StudentSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // this.set() query update me $set add/merge karne ka cleaner way hai.
  this.set({ lastUpdated: new Date() });
  next();
});
```

Real project me timestamps even better:

```ts
const StudentSchema = new Schema({
  name: String,
  rollNumber: String
}, { timestamps: true });
```

This gives `createdAt` and `updatedAt` automatically.

### Model and seed data

```ts
const Student = mongoose.model('Student', StudentSchema);

// Helper function to clear and seed data
async function resetData() {
  try {
    await mongoose.connection.dropCollection('students').catch(() => {});

    const students = [
      {
        name: 'Rahul Kumar',
        rollNumber: 'STU001',
        email: 'rahul@example.com',
        grade: 85,
        subjects: ['Math', 'Science', 'English'],
        isActive: true
      },
      {
        name: 'Priya Sharma',
        rollNumber: 'STU002',
        email: 'priya@example.com',
        grade: 92,
        subjects: ['History', 'Geography', 'Economics'],
        isActive: true
      }
    ];

    await Student.insertMany(students);
    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error resetting data:', error);
  }
}
```

### Full update validation demonstration

```ts
async function demonstrateUpdateValidation() {
  await mongoose.connect('mongodb://localhost:27017/validationDemo');
  await resetData();

  try {
    console.log('\n1. Update Without Validation (default behavior):');

    // Default behavior - no validation during update
    const resultWithoutValidation = await Student.updateOne(
      { rollNumber: 'STU001' },
      {
        email: 'invalid-email', // Invalid email format
        grade: 120 // Exceeds maximum value
      }
    );

    console.log('Update result:', resultWithoutValidation);
    console.log('Document updated without validation!');

    const studentWithoutValidation = await Student.findOne({ rollNumber: 'STU001' });
    console.log('Updated document:', studentWithoutValidation?.toObject());

    await resetData();

    console.log('\n2. Update With Validation (runValidators option):');

    try {
      await Student.updateOne(
        { rollNumber: 'STU002' },
        {
          email: 'invalid-email', // Invalid email format
          grade: 120 // Exceeds maximum value
        },
        { runValidators: true } // Enable validation for this update
      );
    } catch (error: any) {
      console.log('Validation error (as expected):', error.message);
    }

    console.log('\n3. Selective Validation and query context:');

    try {
      await Student.findOneAndUpdate(
        { rollNumber: 'STU002' },
        {
          // Try to update immutable field
          rollNumber: 'STU999',
          // Valid updates
          name: 'Priya Verma',
          grade: 95
        },
        {
          runValidators: true,
          // Some older examples use this.
          // Modern Mongoose update validators already run with query context.
          context: 'query'
        }
      );
    } catch (error: any) {
      console.log('Validation / strict error:', error.message);
    }

    console.log('\n4. Using findOneAndUpdate with Validation:');

    try {
      const updatedStudent = await Student.findOneAndUpdate(
        { rollNumber: 'STU002' },
        {
          name: 'Priya Verma',
          email: 'priya.verma@example.com',
          grade: 95,
          subjects: ['Physics', 'Chemistry', 'Mathematics']
        },
        {
          runValidators: true,
          // Modern preferred option. Older/common syntax: new: true
          returnDocument: 'after'
        }
      );

      console.log('Successfully updated student:', updatedStudent?.toObject());
    } catch (error: any) {
      console.log('Unexpected error:', error.message);
    }

    console.log('\n5. Array Update Validation:');

    try {
      await Student.findOneAndUpdate(
        { rollNumber: 'STU001' },
        { subjects: [] }, // Empty array fails validation when setting entire array
        { runValidators: true }
      );
    } catch (error: any) {
      console.log('Array validation error (as expected):', error.message);
    }

    console.log('\n6. Bulk Update with Validation:');

    try {
      const bulkUpdateResult = await Student.updateMany(
        { isActive: true }, // All documents matching this filter will update
        { grade: 80 },
        { runValidators: true }
      );

      console.log('Bulk update result:', bulkUpdateResult);
    } catch (error: any) {
      console.log('Bulk update error:', error.message);
    }

    console.log('\n7. Pre-update Hook Effect:');

    const beforeUpdate = await Student.findOne({ rollNumber: 'STU001' });
    console.log('Before update lastUpdated:', beforeUpdate?.lastUpdated);

    // Wait a second to see the difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the document - pre hook should update lastUpdated
    await Student.findOneAndUpdate(
      { rollNumber: 'STU001' },
      { name: 'Rahul Sharma' },
      { runValidators: true }
    );

    const afterUpdate = await Student.findOne({ rollNumber: 'STU001' });
    console.log('After update lastUpdated:', afterUpdate?.lastUpdated);

  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

demonstrateUpdateValidation();
```

Related doubts:

- [Update Doubt 2: validators creation par hi chalte hain? Update par nahi?](reference/Updation_doubts_reviewed.md)
- [Update Doubt 5: without `runValidators`, kya validation bypass hogi?](reference/Updation_doubts_reviewed.md)

### Important update validator caveats

Update validators document validators jaise full document validate nahi karte.

1. **Only updated paths validate hote hain.**
2. `required` update me tab fail hota hai jab field explicitly `$unset` hoti hai.
3. Validators kuch update operators par hi run hote hain: `$set`, `$unset`, `$push`, `$addToSet`, `$pull`, `$pullAll`.
4. `$inc` validators ko ignore/bypass kar sakta hai.
5. `$push` / `$addToSet` array-level validator ko full array par run nahi karte; individual elements validate ho sakte hain.

### Update caveats with concrete examples

#### 1. `required` update me missing field ko scan nahi karta

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { grade: 90 } },
  { runValidators: true }
);
```

Yeh pass ho sakta hai even if `name` required hai, because update query me `name` ko touch hi nahi kiya.

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $unset: { name: 1 } },
  { runValidators: true }
);
```

Yeh fail ho sakta hai, because aap explicitly required field `name` remove kar rahe ho.

#### 2. `$set` and `$push` validators run kar sakte hain

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { grade: 120 } },
  { runValidators: true }
);
```

Yeh fail ho sakta hai because `grade` max `100` hai and `$set` supported validation operator hai.

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $push: { subjects: '' } },
  { runValidators: true }
);
```

Yeh item-level validation run kar sakta hai if array item schema me rule hai. But full array-level validator, jaise `subjects array empty nahi honi chahiye`, har `$push` par full array read karke validate nahi karta.

#### 3. `$inc` validator bypass kar sakta hai

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $inc: { grade: 200 } },
  { runValidators: true }
);
```

Yeh Mongoose validator ko bypass kar sakta hai because `$inc` supported update validation operators list me nahi aata.

Safer options:

- `$set` se final value set karo jab validation important ho.
- Update se pehle document read karke final value calculate karo.
- Critical constraints ke liye MongoDB collection-level validation ya business logic use karo.

Related doubt:

- [Doubt 2: update validators ke caveats: `required`, update operators, aur `$inc`](doubts.md)

### `findOneAndUpdate()` return value: `new: true` vs `returnDocument: 'after'`

Default behavior: old document return hota hai.

Old/common syntax:

```ts
const updatedStudent = await Student.findOneAndUpdate(
  { rollNumber: 'STU002' },
  { $set: { name: 'Priya Verma' } },
  { new: true }
);
```

Modern preferred syntax:

```ts
const updatedStudent = await Student.findOneAndUpdate(
  { rollNumber: 'STU002' },
  { $set: { name: 'Priya Verma' } },
  { returnDocument: 'after' }
);
```

Both ka practical effect: update ke baad wala document return hota hai.

Related doubt:

- [Update Doubt 4: `new: true` kya karta hai?](reference/Updation_doubts_reviewed.md)

### `context: 'query'` meaning

Older examples me `context: 'query'` commonly use hota tha. Important nuance:

- Update validators me `this` document nahi hota; `this` query object hota hai.
- Latest Mongoose me update validators generally query context me run hote hain.
- `context: 'query'` ka matlab yeh nahi ki only updated fields validate honge. Only updated paths validate hona update validators ka normal behavior hai.

Example:

```ts
StudentSchema.path('grade').validate(function(value: number) {
  // Update validators me this query object hai
  const updatedName = this.get('name');
  return value >= 0 && value <= 100;
});
```

Related doubts:

- [Update Doubt 3: `context: 'query'` kya karta hai?](reference/Updation_doubts_reviewed.md)
- [Doubt 3: `StudentSchema.path('grade').validate(...)` explanation](doubts.md)
- [Doubt 4: `context: 'query'`, query object, and update validator `this`](doubts.md)

### Immutable fields

```ts
rollNumber: {
  type: String,
  required: true,
  unique: true,
  immutable: true
}
```

Important:

- `unique` validator nahi, unique index hai.
- `immutable` field ko update karne ki try par Mongoose usually update strip/ignore kar sakta hai.
- Error chahiye toh `strict: 'throw'` use kar sakte ho.

```ts
await Student.updateOne(
  { rollNumber: 'STU001' },
  { $set: { rollNumber: 'STU999' } },
  { strict: 'throw' }
);
```

### `updateMany()` kis document ko update karta hai?

```ts
await Student.updateMany(
  { isActive: true },
  { grade: 80 },
  { runValidators: true }
);
```

Ye un **saare documents** ko update karega jinke `isActive` field ki value `true` hai. Agar 2 active students hain, dono ke `grade` ko 80 set karega.

Related doubt:

- [Update Doubt 6: `updateMany()` kis document ko update karega?](reference/Updation_doubts_reviewed.md)

### Await / Promise / setTimeout order of execution

```ts
const beforeUpdate = await Student.findOne({ rollNumber: 'STU001' });
console.log('Before update lastUpdated:', beforeUpdate?.lastUpdated);

await new Promise(resolve => setTimeout(resolve, 1000));

await Student.findOneAndUpdate(
  { rollNumber: 'STU001' },
  { name: 'Rahul Sharma' },
  { runValidators: true }
);

const afterUpdate = await Student.findOne({ rollNumber: 'STU001' });
console.log('After update lastUpdated:', afterUpdate?.lastUpdated);
```

Execution order:

1. Pehla `findOne` complete hota hai.
2. `Before update lastUpdated` print hota hai.
3. `setTimeout(..., 1000)` timer queue/macrotask me wait karta hai.
4. Promise resolve hone ke baad `await` ka continuation microtask ke through resume hota hai.
5. `findOneAndUpdate` run hota hai.
6. Pre-update middleware `lastUpdated` set karta hai.
7. Second `findOne` updated document read karta hai.
8. `After update lastUpdated` print hota hai.

Simple words me: `await` ke wajah se code sequentially readable flow me chalta hai. Timer internal event loop queues me jata hai, but next database update tabhi start hota hai jab 1 second wait complete ho jaye.

Related doubt:

- [Update Doubt 7: await, Promise, and setTimeout execution order](reference/Updation_doubts_reviewed.md)

---

## Conclusion

Best practical rules:

1. Create/save validation ke liye Mongoose validators fine hain.
2. Update queries par `{ runValidators: true }` lagao jab validation chahiye.
3. Update validators ke caveats yaad rakho; ye full document validation nahi hoti.
4. `unique` ko validation mat samjho; duplicate key error handle karo.
5. `findOneAndUpdate()` me updated doc chahiye toh modern option `{ returnDocument: 'after' }` use karo; `new: true` older/common syntax hai.
6. `lastUpdated` ke liye `getUpdate()`/`setUpdate()` teaching example samjho, but real projects me `this.set()` or `{ timestamps: true }` safer/better ho sakta hai.
