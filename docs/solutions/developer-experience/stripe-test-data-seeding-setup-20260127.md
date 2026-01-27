---
module: Development Tools
date: 2026-01-27
problem_type: developer_experience
component: tooling
symptoms:
  - "Admin dashboard empty with no test data for development"
  - "Stripe API parameter_unknown error with product_data"
  - "Environment variables not loading in tsx scripts"
  - "Admin user authentication failing despite .env.local credentials"
root_cause: incomplete_setup
resolution_type: tooling_addition
severity: medium
tags: [stripe, test-data, seeding, development-setup, admin-auth, dotenv]
---

# Troubleshooting: Stripe Test Data Seeding and Admin Setup

## Problem
The admin dashboard had no test data for development, making it difficult to build and test features. Additionally, setting up Stripe test data seeding required solving multiple environment and API compatibility issues.

## Environment
- Module: Development Tools
- Framework: Next.js 16.1.5
- Database: Supabase
- Payment Provider: Stripe (API version 2025-12-15.clover)
- Date: 2026-01-27

## Symptoms
- Admin dashboard completely empty with no organizations or subscriptions to work with
- Stripe API returning error: `parameter_unknown: items[0][price_data][product_data]`
- Environment variables (STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) not loading in tsx scripts
- Admin login failing with "Invalid login credentials" despite correct values in `.env.local`
- No way to quickly populate realistic test data for development

## What Didn't Work

**Attempted Solution 1:** Use inline `product_data` in subscription creation
```typescript
stripe.subscriptions.create({
  customer: customer.id,
  items: [{
    price_data: {
      currency: 'nok',
      unit_amount: amount,
      product_data: { name: 'Product name' }, // ❌ Not supported in this API version
      recurring: { interval: 'month' }
    }
  }]
})
```
- **Why it failed:** Stripe API version 2025-12-15.clover requires products and prices to be created separately, not inline with `product_data`

**Attempted Solution 2:** Rely on shell environment variables
- **Why it failed:** tsx scripts don't automatically load `.env.local` - requires explicit dotenv configuration

**Attempted Solution 3:** Use credentials from .env.local without creating Supabase Auth user
- **Why it failed:** Admin login uses Supabase Auth `signInWithPassword()`, which requires the user to actually exist in the auth database, not just environment variables

## Solution

Created two development scripts to solve the problem:

### 1. Stripe Test Data Seeding Script

**File:** `scripts/seed-stripe.ts`

**Key implementations:**

```typescript
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Create product and price separately (API requirement)
const product = await stripe.products.create({
  name: `Støtte til ${org.name}`,
  metadata: { test_seed: 'true' },
});

const price = await stripe.prices.create({
  product: product.id,
  currency: 'nok',
  unit_amount: amount,
  recurring: { interval: 'month' },
  metadata: { test_seed: 'true' },
});

// Create subscription with separate price
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: price.id }], // ✅ Use price ID, not inline data
  metadata: { test_seed: 'true', organization_id: org.id }
});

// Attach payment method to customer
const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: { token: 'tok_visa' }, // Stripe test token
});

await stripe.paymentMethods.attach(paymentMethod.id, {
  customer: customer.id,
});

await stripe.customers.update(customer.id, {
  invoice_settings: {
    default_payment_method: paymentMethod.id,
  },
});
```

**Features:**
- Creates 3 test organizations (Fotball, Håndball, Ski)
- 2 groups per organization with 3 individuals each
- 10 active monthly subscriptions with test payment methods
- Cleanup capability with `--clean` flag
- Validates Stripe test key (`sk_test_*` prefix)
- Completes in ~57 seconds

### 2. Admin User Creation Script

**File:** `scripts/create-admin-user.ts`

```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Check if user exists
const { data: existingUsers } = await supabase.auth.admin.listUsers();
const userExists = existingUsers?.users.some(u => u.email === ADMIN_EMAIL);

if (userExists) {
  // Update password to match .env.local
  const user = existingUsers?.users.find(u => u.email === ADMIN_EMAIL);
  await supabase.auth.admin.updateUserById(
    user.id,
    { password: ADMIN_PASSWORD }
  );
} else {
  // Create new admin user
  await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email confirmation for development
  });
}
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "create-admin": "tsx scripts/create-admin-user.ts",
    "seed:stripe": "tsx scripts/seed-stripe.ts",
    "seed:stripe:clean": "tsx scripts/seed-stripe.ts --clean"
  },
  "devDependencies": {
    "dotenv": "^17.2.3",
    "tsx": "^4.7.0"
  }
}
```

### 4. README Documentation

```markdown
## Development

### Setup Admin User
npm run create-admin

### Seed Test Data
npm run seed:stripe

This creates:
- 3 test organizations
- 6 groups (2 per org)
- 10 monthly subscriptions

Clean test data:
npm run seed:stripe:clean
```

## Why This Works

**Root causes addressed:**

1. **Stripe API compatibility:** The 2025-12-15.clover API version doesn't support inline `product_data` in price creation. Products and prices must be created as separate resources first, then referenced by ID in subscription creation.

2. **Environment variable loading:** tsx doesn't automatically load `.env.local` like Next.js does. Using `dotenv` with explicit path configuration (`config({ path: resolve(process.cwd(), '.env.local') })`) ensures environment variables are available in standalone scripts.

3. **Payment method requirement:** Stripe subscriptions require customers to have a payment method attached. Using test tokens (`tok_visa`) and explicitly attaching/setting as default payment method ensures subscriptions can be created successfully.

4. **Supabase Auth separation:** Environment variables in `.env.local` are just configuration values. Supabase Auth maintains its own user database, so users must be explicitly created via `admin.createUser()` or exist before `signInWithPassword()` will work.

## Prevention

**For future development setup:**

1. **Always load dotenv in standalone scripts:**
   ```typescript
   import { config } from 'dotenv';
   import { resolve } from 'path';
   config({ path: resolve(process.cwd(), '.env.local') });
   ```

2. **Check Stripe API version compatibility:** When using newer API versions, consult Stripe docs for parameter structure changes. Product/price creation patterns may differ between versions.

3. **Separate products and prices:** Don't use inline `product_data` - create products and prices as separate resources:
   ```typescript
   const product = await stripe.products.create({...});
   const price = await stripe.prices.create({ product: product.id, ...});
   ```

4. **Include payment methods in test customers:** Test subscriptions require payment methods:
   ```typescript
   const pm = await stripe.paymentMethods.create({ type: 'card', card: { token: 'tok_visa' }});
   await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
   await stripe.customers.update(customer.id, {
     invoice_settings: { default_payment_method: pm.id }
   });
   ```

5. **Create auth users programmatically:** Don't rely on `.env.local` credentials alone - create actual Supabase Auth users with `admin.createUser()` for development environments.

6. **Document setup scripts in README:** Include clear instructions for `npm run create-admin` and `npm run seed:stripe` so new developers can set up their environment quickly.

## Verification

**Successful seeding produces:**
- 3 organizations in Supabase `organizations` table
- 6 groups in `groups` table
- 18 individuals in `individuals` table
- 10 subscriptions in `subscriptions` table with status='active'
- 10 customers in Stripe test dashboard
- ~30 transactions in Stripe (subscription creation + initial charges)
- Admin user can log in at http://localhost:3000/admin/login

**Stripe Dashboard metrics:**
- Gross Volume: NOK 2,200.00
- Net Volume: NOK 2,060.54
- 20 successful payments (10 subscriptions × 2 transactions each)

## Related Issues

No related issues documented yet.

## Commands

```bash
# One-time setup
npm install
npm run create-admin

# Seed test data (repeatable)
npm run seed:stripe

# Clean all test data
npm run seed:stripe:clean

# Start dev server
npm run dev
# Then visit: http://localhost:3000/admin
```
