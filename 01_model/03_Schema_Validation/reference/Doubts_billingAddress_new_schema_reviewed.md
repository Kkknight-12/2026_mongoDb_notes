# Doubts — `billingAddress` with `new Schema` — Reviewed Notes

Updated on: 2026-06-10

## Doubt 1: `billingAddress` ke liye `new Schema` kyun use kiya? Kya new collection banega?

Code:

```ts
billingAddress: {
  type: new Schema({
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }),
  required: function(this: any) {
    return ['credit_card', 'debit_card', 'bank_transfer'].includes(this.paymentType);
  }
}
```

### Correct explanation

`billingAddress` ek **single nested subdocument** hai.

Matlab `Payment` document ke andar ek embedded object store hoga:

```json
{
  "paymentType": "credit_card",
  "amount": 500,
  "billingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  }
}
```

### Kya new collection banega?

Nahi. Sirf `new Schema(...)` likhne se new collection nahi banta.

Collection tab banti hai jab aap model create karte ho:

```ts
const Payment = mongoose.model('Payment', PaymentSchema);
```

By default collection name `payments` hoga.

`billingAddress` ka data isi `payments` collection ke documents ke andar embedded object ke form mein store hoga.

### Better reusable style

```ts
const BillingAddressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

const PaymentSchema = new Schema({
  paymentType: String,
  billingAddress: {
    type: BillingAddressSchema,
    required: function(this: any) {
      return ['credit_card', 'debit_card', 'bank_transfer'].includes(this.paymentType);
    }
  }
});
```

### `{ _id: false }` kyun?

By default Mongoose subdocuments ko `_id` de sakta hai. Billing address ke liye usually separate `_id` ki need nahi hoti, so `{ _id: false }` clean option hai.

---

## Doubt 2: Validator mein `function(this: any, address: any)` — kya 2 parameters pass ho rahe hain?

Code:

```ts
validate: {
  validator: function(this: any, address: any) {
    if (!['credit_card', 'debit_card', 'bank_transfer'].includes(this.paymentType)) {
      return true;
    }

    return address &&
      address.street &&
      address.city &&
      address.state &&
      address.zipCode &&
      address.country;
  },
  message: 'Complete billing address is required for this payment type'
}
```

### Correct explanation

Runtime JavaScript mein validator function ko main argument `address` milta hai. Ye field ki value hai.

`this: any` TypeScript ka special **this parameter** hai. Ye real runtime argument nahi hota.

TypeScript version:

```ts
function(this: any, address: any) {
  // this = document during document validation
  // address = billingAddress field value
}
```

Compiled JavaScript conceptually:

```js
function(address) {
  // this still exists, but parameter list mein nahi hota
}
```

### `this` kya point karta hai?

Document validation (`save()` / `create()`) mein `this` usually current document ko point karta hai.

So yahan:

```ts
this.paymentType
```

se current payment document ka `paymentType` access ho raha hai.

### Arrow function mat use karo

Galat:

```ts
validator: (address) => {
  return this.paymentType === 'credit_card'; // this work nahi karega
}
```

Correct:

```ts
validator: function(this: any, address: any) {
  return this.paymentType === 'credit_card';
}
```

Normal `function` use karna zaroori hai if you need `this`.

---

## Doubt 3: Complete billing address validation ka flow

```ts
validate: {
  validator: function(this: any, address: any) {
    const needsBillingAddress = ['credit_card', 'debit_card', 'bank_transfer']
      .includes(this.paymentType);

    if (!needsBillingAddress) return true;

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
```

Meaning:

- Payment type `upi` or `cash` hai → billing address validation skip.
- Payment type `credit_card`, `debit_card`, or `bank_transfer` hai → address required and complete hona chahiye.

---

## Final summary

- `new Schema` yahan embedded subdocument ke liye use ho raha hai.
- New collection nahi banegi.
- Collection `payments` tab banegi jab `Payment` model use hoga.
- `function(this: any, address: any)` mein `this: any` TypeScript-only annotation hai, actual runtime parameter nahi.
- Runtime argument `address` hai, jo `billingAddress` field value hai.
- `this.paymentType` access karne ke liye normal `function` use karo, arrow function nahi.
