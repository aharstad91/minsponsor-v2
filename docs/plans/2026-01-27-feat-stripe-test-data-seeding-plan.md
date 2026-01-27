---
title: Stripe Test Data Seeding Script
type: feat
date: 2026-01-27
---

# Stripe Test Data Seeding Script

## Overview

Create a comprehensive automated seeding script that populates MinSponsor's admin panel with realistic Stripe test data. This enables developers to see actual financial metrics (MRR, subscriber counts, transaction history) and verify that webhook handlers, Connect onboarding, and payment flows work correctly.

**Parent Brainstorm:** `docs/brainstorms/2026-01-27-stripe-test-data-seeding-brainstorm.md`

## Problem Statement / Motivation

Currently, the MinSponsor admin dashboard has no test data, making it difficult to:

- **Validate UI rendering** - Can't see how MRR calculations, subscriber counts, and provider splits display
- **Test webhook flows** - No way to verify idempotency, event handling, and state transitions
- **Develop new features** - Need realistic data to build against
- **Verify Stripe integration** - Connect onboarding and payment flows untested

The Stripe test keys are configured, but without subscriptions and transactions, the admin panel shows empty states. Manual test data creation is time-consuming and error-prone.

**Success looks like:** Running `npm run seed:stripe` populates the entire system with 3 test organizations, 8-12 subscriptions, groups/individuals, and 3 months of transaction history - ready for development and testing.

## Proposed Solution

Build a TypeScript seeding script that:

1. **Creates test organizations** in Supabase with Norwegian profiles and org numbers
2. **Provisions Stripe Connect accounts** for each organization using Stripe APIs
3. **Seeds hierarchical data** - Groups (2-3 per org) and individuals (3-5 per group)
4. **Generates subscriptions** via Stripe Checkout API (70% recurring, 30% one-time)
5. **Seeds historical transactions** - 3 months of payment records per subscription
6. **Verifies webhook processing** - Uses Stripe CLI for local webhook forwarding
7. **Supports teardown** - Marks data with `seed_source='test'` for safe cleanup

## Technical Approach

### Architecture

**Technology Stack:**
- **TypeScript** - Type-safe script execution
- **Stripe SDK** - Official Node.js library for Stripe API
- **Supabase Admin Client** - Direct database access (bypasses RLS)
- **Stripe CLI** - Local webhook forwarding during development
- **tsx** - TypeScript execution without build step

**Design Principles:**
- **Idempotent** - Can run multiple times without creating duplicates
- **Realistic** - Mirrors production data patterns and timing
- **Safe** - Never touches production data (marked with `seed_source='test'`)
- **Verifiable** - Logs progress and final summary with dashboard links

### Implementation Phases

#### Phase 1: Database Schema Updates

Add `seed_source` column to enable safe test data tracking and teardown.

**Files to modify:**
- `supabase/migrations/002_add_seed_source.sql` (NEW)
- `src/lib/database.types.ts` (UPDATE)

**Tasks:**
- [ ] Create migration to add `seed_source TEXT` column to `organizations` table
- [ ] Create migration to add `seed_source TEXT` column to `groups` table
- [ ] Create migration to add `seed_source TEXT` column to `individuals` table
- [ ] Create migration to add `seed_source TEXT` column to `subscriptions` table
- [ ] Run migration locally: `npx supabase db reset` (dev environment)
- [ ] Verify column exists in Supabase Studio
- [ ] Update TypeScript types by running: `npx supabase gen types typescript --local > src/lib/database.types.ts`

**002_add_seed_source.sql:**

```sql
-- Add seed_source column to track test data
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS seed_source TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS seed_source TEXT;
ALTER TABLE individuals ADD COLUMN IF NOT EXISTS seed_source TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS seed_source TEXT;

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_organizations_seed_source ON organizations(seed_source);
CREATE INDEX IF NOT EXISTS idx_subscriptions_seed_source ON subscriptions(seed_source);

-- Comment for documentation
COMMENT ON COLUMN organizations.seed_source IS 'Identifies source of test data (e.g., "test"). NULL for production data.';
```

---

#### Phase 2: Seed Script Foundation

Create the main seeding script with prerequisite checks and environment validation.

**Files to create:**
- `scripts/seed-stripe-test-data.ts` (NEW)
- `scripts/lib/seed-types.ts` (NEW)
- `scripts/lib/seed-utils.ts` (NEW)

**Files to modify:**
- `package.json` (UPDATE - add script command)

**Tasks:**
- [ ] Create `scripts/` directory
- [ ] Set up TypeScript execution with `tsx` (install: `npm install --save-dev tsx`)
- [ ] Create seed script entry point with CLI argument parsing
- [ ] Implement prerequisite checks (env vars, Stripe CLI)
- [ ] Add confirmation prompt before data deletion
- [ ] Implement logging utilities (colorized console output)

**package.json:**

```json
{
  "scripts": {
    "seed:stripe": "tsx scripts/seed-stripe-test-data.ts",
    "seed:stripe:clean": "tsx scripts/seed-stripe-test-data.ts --clean-only"
  },
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
```

**scripts/seed-stripe-test-data.ts:**

```typescript
#!/usr/bin/env node
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/database.types';
import { checkPrerequisites, confirmReset, cleanTestData, logSuccess, logError, logInfo } from './lib/seed-utils';
import { seedOrganizations } from './lib/seed-organizations';
import { seedSubscriptions } from './lib/seed-subscriptions';
import { seedTransactions } from './lib/seed-transactions';

// Environment validation
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logError('Missing required environment variables');
  logInfo('Required: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes('--clean-only');

  console.log('🌱 MinSponsor Stripe Test Data Seeder\n');

  // Check prerequisites
  await checkPrerequisites();

  // Confirm reset
  if (!await confirmReset()) {
    logInfo('Cancelled by user');
    process.exit(0);
  }

  // Clean existing test data
  logInfo('Cleaning existing test data...');
  await cleanTestData(supabase);
  logSuccess('Test data cleaned');

  if (cleanOnly) {
    logSuccess('Clean-only mode complete');
    process.exit(0);
  }

  // Seed organizations with Stripe Connect accounts
  logInfo('\n📋 Creating test organizations...');
  const organizations = await seedOrganizations(stripe, supabase);
  logSuccess(`Created ${organizations.length} organizations`);

  // Seed subscriptions
  logInfo('\n💳 Creating subscriptions...');
  const subscriptions = await seedSubscriptions(stripe, supabase, organizations);
  logSuccess(`Created ${subscriptions.length} subscriptions`);

  // Seed historical transactions
  logInfo('\n💰 Seeding transaction history...');
  const transactions = await seedTransactions(supabase, subscriptions);
  logSuccess(`Created ${transactions.length} transactions`);

  // Display summary
  console.log('\n✅ Seeding complete!\n');
  console.log('Summary:');
  console.log(`  Organizations: ${organizations.length}`);
  console.log(`  Subscriptions: ${subscriptions.length}`);
  console.log(`  Transactions: ${transactions.length}`);
  console.log('\n🔗 View Admin Dashboard:');
  console.log(`  ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin\n`);
}

main().catch((error) => {
  logError(`Seeding failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
```

**scripts/lib/seed-utils.ts:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';
import * as readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Console logging utilities
export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

export function logError(message: string) {
  console.log(`❌ ${message}`);
}

export function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

export function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

// Check if Stripe CLI is running
export async function checkStripeCliRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('pgrep -f "stripe listen"');
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// Check all prerequisites
export async function checkPrerequisites() {
  logInfo('Checking prerequisites...');

  // Check Stripe CLI installation
  try {
    await execAsync('which stripe');
    logSuccess('Stripe CLI installed');
  } catch {
    logWarning('Stripe CLI not found. Install with: brew install stripe/stripe-cli/stripe');
    logWarning('You can continue without it, but webhooks won\'t be tested.');
  }

  // Check if Stripe CLI is running
  const isRunning = await checkStripeCliRunning();
  if (isRunning) {
    logSuccess('Stripe CLI webhook forwarding is active');
  } else {
    logWarning('Stripe CLI not running. Start with: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    logWarning('You can continue without it, but webhooks won\'t be tested.');
  }
}

// Prompt for user confirmation
export async function confirmReset(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('⚠️  This will DELETE all test data and create new test data. Continue? (y/N) ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Clean all test data
export async function cleanTestData(supabase: SupabaseClient<Database>) {
  // Delete in correct order (foreign key constraints)
  await supabase.from('transactions').delete().eq('subscription_id', 'subscription_id').in('subscription_id',
    (await supabase.from('subscriptions').select('id').eq('seed_source', 'test')).data?.map(s => s.id) || []
  );

  await supabase.from('subscriptions').delete().eq('seed_source', 'test');
  await supabase.from('individuals').delete().eq('seed_source', 'test');
  await supabase.from('groups').delete().eq('seed_source', 'test');
  await supabase.from('organizations').delete().eq('seed_source', 'test');

  logSuccess('Deleted existing test data from database');
}

// Utility: Generate Norwegian org number (9 digits)
export function generateOrgNumber(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// Utility: Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Utility: Random element from array
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Utility: Random integer between min and max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility: Sleep for ms
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**scripts/lib/seed-types.ts:**

```typescript
export interface SeededOrganization {
  id: string;
  name: string;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  groups: SeededGroup[];
}

export interface SeededGroup {
  id: string;
  name: string;
  organization_id: string;
  individuals: SeededIndividual[];
}

export interface SeededIndividual {
  id: string;
  name: string;
  group_id: string;
}

export interface SeededSubscription {
  id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  organization_id: string;
  group_id: string | null;
  individual_id: string | null;
  amount: number;
  interval: 'monthly' | 'one_time';
  status: string;
}
```

---

#### Phase 3: Organization & Hierarchy Seeding

Implement organization creation with Stripe Connect accounts, groups, and individuals.

**Files to create:**
- `scripts/lib/seed-organizations.ts` (NEW)

**Tasks:**
- [ ] Define test organization data (names, org numbers, categories)
- [ ] Create organizations in Supabase with `seed_source='test'`
- [ ] Create Stripe Connect Express accounts for fully onboarded orgs
- [ ] Update organizations with `stripe_account_id` and `charges_enabled` status
- [ ] Seed 2-3 groups per organization
- [ ] Seed 3-5 individuals per group with Norwegian names
- [ ] Handle errors gracefully (log and continue)

**scripts/lib/seed-organizations.ts:**

```typescript
import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';
import { SeededOrganization, SeededGroup, SeededIndividual } from './seed-types';
import { generateOrgNumber, generateSlug, logInfo, logSuccess, logError, randomInt } from './seed-utils';

// Test organization definitions
const TEST_ORGS = [
  {
    name: 'Test Fotballklubb',
    category: 'Fotball',
    contact_email: 'kontakt@testfotball.no',
    contact_phone: '+4798765432',
    description: 'En testorganisasjon for fotball',
    createStripeAccount: true,
    onboardingComplete: true,
  },
  {
    name: 'Test Håndballklubb',
    category: 'Håndball',
    contact_email: 'info@testhandball.no',
    contact_phone: '+4798765433',
    description: 'En testorganisasjon for håndball',
    createStripeAccount: true,
    onboardingComplete: false, // Pending charges_enabled
  },
  {
    name: 'Test Skiklubb',
    category: 'Ski',
    contact_email: 'post@testski.no',
    contact_phone: '+4798765434',
    description: 'En testorganisasjon for ski',
    createStripeAccount: false, // No Stripe setup
    onboardingComplete: false,
  },
];

// Norwegian group names
const GROUP_TEMPLATES = {
  Fotball: ['Herrer A-lag', 'Damer Senior', 'Junior Gutt', 'Junior Jente'],
  Håndball: ['Elite Herrer', 'Elite Damer', 'Ungdom 16-18'],
  Ski: ['Langrenn Senior', 'Alpint Junior', 'Hopp'],
};

// Norwegian individual names
const NORWEGIAN_NAMES = [
  'Lars Hansen', 'Emma Johansen', 'Magnus Olsen', 'Ingrid Berg', 'Ole Nilsen',
  'Kari Andresen', 'Erik Larsen', 'Sofie Pedersen', 'Jonas Kristiansen', 'Nora Svendsen',
  'Henrik Iversen', 'Marte Jensen', 'Andreas Karlsen', 'Thea Eriksen', 'Martin Haugen',
];

export async function seedOrganizations(
  stripe: Stripe,
  supabase: SupabaseClient<Database>
): Promise<SeededOrganization[]> {
  const seededOrgs: SeededOrganization[] = [];

  for (const orgData of TEST_ORGS) {
    try {
      logInfo(`Creating organization: ${orgData.name}...`);

      // Create Stripe Connect account if needed
      let stripeAccountId: string | null = null;
      let chargesEnabled = false;

      if (orgData.createStripeAccount) {
        logInfo(`  Creating Stripe Connect account...`);
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'NO',
          email: orgData.contact_email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'non_profit',
          metadata: {
            test_seed: 'true',
            organization_name: orgData.name,
          },
        });

        stripeAccountId = account.id;
        chargesEnabled = orgData.onboardingComplete;

        logSuccess(`  Stripe account created: ${stripeAccountId}`);

        // Note: In test mode, we can't fully complete onboarding programmatically
        // For fully onboarded orgs, we'll just mark them as charges_enabled
      }

      // Create organization in Supabase
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgData.name,
          org_number: generateOrgNumber(),
          slug: generateSlug(orgData.name),
          category: orgData.category,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          description: orgData.description,
          stripe_account_id: stripeAccountId,
          stripe_charges_enabled: chargesEnabled,
          status: 'active',
          suggested_amounts: [5000, 10000, 20000], // 50kr, 100kr, 200kr
          seed_source: 'test',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      logSuccess(`  Organization created: ${org.id}`);

      // Seed groups
      const groups = await seedGroups(supabase, org.id, orgData.category);

      seededOrgs.push({
        id: org.id,
        name: org.name,
        stripe_account_id: stripeAccountId,
        stripe_charges_enabled: chargesEnabled,
        groups,
      });
    } catch (error) {
      logError(`Failed to create organization ${orgData.name}: ${error}`);
      // Continue with next org
    }
  }

  return seededOrgs;
}

async function seedGroups(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  category: string
): Promise<SeededGroup[]> {
  const seededGroups: SeededGroup[] = [];
  const groupTemplates = GROUP_TEMPLATES[category as keyof typeof GROUP_TEMPLATES] || [];
  const numGroups = randomInt(2, Math.min(3, groupTemplates.length));

  for (let i = 0; i < numGroups; i++) {
    const groupName = groupTemplates[i];

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        organization_id: organizationId,
        name: groupName,
        description: `Testgruppe for ${groupName}`,
        status: 'active',
        seed_source: 'test',
      })
      .select()
      .single();

    if (error) {
      logError(`  Failed to create group ${groupName}: ${error}`);
      continue;
    }

    logInfo(`    Created group: ${groupName}`);

    // Seed individuals
    const individuals = await seedIndividuals(supabase, group.id);

    seededGroups.push({
      id: group.id,
      name: group.name,
      organization_id: organizationId,
      individuals,
    });
  }

  return seededGroups;
}

async function seedIndividuals(
  supabase: SupabaseClient<Database>,
  groupId: string
): Promise<SeededIndividual[]> {
  const seededIndividuals: SeededIndividual[] = [];
  const numIndividuals = randomInt(3, 5);

  // Shuffle names to avoid duplicates
  const shuffledNames = [...NORWEGIAN_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numIndividuals; i++) {
    const individualName = shuffledNames[i];

    const { data: individual, error } = await supabase
      .from('individuals')
      .insert({
        group_id: groupId,
        name: individualName,
        status: 'active',
        seed_source: 'test',
      })
      .select()
      .single();

    if (error) {
      logError(`    Failed to create individual ${individualName}: ${error}`);
      continue;
    }

    seededIndividuals.push({
      id: individual.id,
      name: individual.name,
      group_id: groupId,
    });
  }

  logInfo(`      Created ${seededIndividuals.length} individuals`);

  return seededIndividuals;
}
```

---

#### Phase 4: Subscription & Customer Seeding

Create Stripe customers and subscriptions using test cards, with attribution to orgs/groups/individuals.

**Files to create:**
- `scripts/lib/seed-subscriptions.ts` (NEW)

**Tasks:**
- [ ] Define subscription scenarios (amounts, intervals, recipients)
- [ ] Create Stripe customers with test emails
- [ ] Create Stripe checkout sessions (subscriptions and one-time payments)
- [ ] Wait for webhook processing (or simulate subscription creation)
- [ ] Create subscription records in Supabase
- [ ] Handle 70/30 split between monthly and one-time
- [ ] Distribute subscriptions across organizations/groups/individuals

**scripts/lib/seed-subscriptions.ts:**

```typescript
import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';
import { SeededOrganization, SeededSubscription } from './seed-types';
import { randomElement, randomInt, sleep, logInfo, logSuccess, logError } from './seed-utils';

// Subscription amounts in øre (NOK cents)
const AMOUNTS = [5000, 10000, 20000, 35000]; // 50kr, 100kr, 200kr, 350kr

// Sponsor email templates
const SPONSOR_EMAILS = [
  'sponsor1@example.com',
  'sponsor2@example.com',
  'sponsor3@example.com',
  'sponsor4@example.com',
  'sponsor5@example.com',
  'sponsor6@example.com',
  'sponsor7@example.com',
  'sponsor8@example.com',
  'sponsor9@example.com',
  'sponsor10@example.com',
  'sponsor11@example.com',
  'sponsor12@example.com',
];

const SPONSOR_NAMES = [
  'Ola Nordmann',
  'Kari Normann',
  'Per Hansen',
  'Anne Olsen',
  'Lars Berg',
  'Ingrid Lund',
  'Erik Strand',
  'Sofie Vik',
  'Magnus Dale',
  'Nora Fjell',
  'Jonas Holm',
  'Emma Haugen',
];

export async function seedSubscriptions(
  stripe: Stripe,
  supabase: SupabaseClient<Database>,
  organizations: SeededOrganization[]
): Promise<SeededSubscription[]> {
  const seededSubscriptions: SeededSubscription[] = [];

  // Only seed for organizations with Stripe accounts
  const eligibleOrgs = organizations.filter(org => org.stripe_account_id);

  if (eligibleOrgs.length === 0) {
    logError('No organizations with Stripe accounts found. Skipping subscription seeding.');
    return [];
  }

  // Target: 8-12 subscriptions total
  const targetSubscriptions = randomInt(8, 12);

  for (let i = 0; i < targetSubscriptions; i++) {
    try {
      const org = randomElement(eligibleOrgs);
      const amount = randomElement(AMOUNTS);
      const interval = Math.random() < 0.7 ? 'monthly' : 'one_time'; // 70% monthly
      const sponsorEmail = SPONSOR_EMAILS[i % SPONSOR_EMAILS.length];
      const sponsorName = SPONSOR_NAMES[i % SPONSOR_NAMES.length];

      // Determine recipient (org, group, or individual)
      const recipientType = randomElement(['org', 'group', 'individual']);
      let groupId: string | null = null;
      let individualId: string | null = null;

      if (recipientType === 'group' && org.groups.length > 0) {
        const group = randomElement(org.groups);
        groupId = group.id;
      } else if (recipientType === 'individual' && org.groups.length > 0) {
        const group = randomElement(org.groups);
        if (group.individuals.length > 0) {
          const individual = randomElement(group.individuals);
          groupId = group.id;
          individualId = individual.id;
        }
      }

      logInfo(`  Creating ${interval} subscription: ${amount / 100}kr for ${org.name}...`);

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: sponsorEmail,
        name: sponsorName,
        metadata: {
          test_seed: 'true',
        },
      });

      logInfo(`    Stripe customer created: ${customer.id}`);

      let stripeSubscriptionId: string | null = null;

      if (interval === 'monthly') {
        // Create subscription using Stripe Subscriptions API
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              price_data: {
                currency: 'nok',
                unit_amount: amount,
                product_data: {
                  name: `Støtte til ${org.name}`,
                },
                recurring: {
                  interval: 'month',
                },
              },
            },
          ],
          application_fee_percent: 10, // Platform fee
          transfer_data: {
            destination: org.stripe_account_id!,
          },
          metadata: {
            test_seed: 'true',
            organization_id: org.id,
            group_id: groupId || '',
            individual_id: individualId || '',
            sponsor_name: sponsorName,
            sponsor_email: sponsorEmail,
          },
        });

        stripeSubscriptionId = subscription.id;
        logSuccess(`    Stripe subscription created: ${stripeSubscriptionId}`);
      } else {
        // For one-time payments, create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          customer: customer.id,
          amount: amount,
          currency: 'nok',
          application_fee_amount: Math.round(amount * 0.1),
          transfer_data: {
            destination: org.stripe_account_id!,
          },
          metadata: {
            test_seed: 'true',
            organization_id: org.id,
            group_id: groupId || '',
            individual_id: individualId || '',
            sponsor_name: sponsorName,
            sponsor_email: sponsorEmail,
          },
          // Auto-confirm with test card
          payment_method: 'pm_card_visa', // Stripe test payment method
          confirm: true,
          return_url: 'http://localhost:3000/bekreftelse',
        });

        logSuccess(`    Stripe payment intent created: ${paymentIntent.id}`);
      }

      // Create subscription record in Supabase
      // Note: In production, this would be created by the webhook handler
      // For seeding, we create it directly to avoid webhook timing issues
      const status = Math.random() < 0.8 ? 'active' : (Math.random() < 0.75 ? 'cancelled' : 'expired');

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert({
          payment_provider: 'stripe',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: customer.id,
          sponsor_email: sponsorEmail,
          sponsor_name: sponsorName,
          organization_id: org.id,
          group_id: groupId,
          individual_id: individualId,
          amount: amount,
          interval: interval,
          status: status,
          started_at: status === 'active' ? new Date().toISOString() : null,
          cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
          seed_source: 'test',
        })
        .select()
        .single();

      if (error) throw error;

      logSuccess(`    Subscription record created: ${subscription.id} (${status})`);

      seededSubscriptions.push({
        id: subscription.id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: customer.id,
        organization_id: org.id,
        group_id: groupId,
        individual_id: individualId,
        amount: amount,
        interval: interval,
        status: status,
      });

      // Small delay to avoid rate limits
      await sleep(100);
    } catch (error) {
      logError(`  Failed to create subscription: ${error}`);
      // Continue with next subscription
    }
  }

  return seededSubscriptions;
}
```

---

#### Phase 5: Transaction History Seeding

Generate 3 months of historical transaction records for active subscriptions.

**Files to create:**
- `scripts/lib/seed-transactions.ts` (NEW)

**Tasks:**
- [ ] Filter for active monthly subscriptions
- [ ] Calculate historical payment dates (monthly intervals, 3 months back)
- [ ] Generate Stripe charge IDs (realistic format)
- [ ] Create transaction records with 95% success rate
- [ ] Randomize payment timing within billing period
- [ ] Create one-time payment transactions

**scripts/lib/seed-transactions.ts:**

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';
import { SeededSubscription } from './seed-types';
import { randomInt, logInfo, logSuccess, logError } from './seed-utils';

export async function seedTransactions(
  supabase: SupabaseClient<Database>,
  subscriptions: SeededSubscription[]
): Promise<any[]> {
  const seededTransactions: any[] = [];

  for (const subscription of subscriptions) {
    try {
      if (subscription.status !== 'active') {
        // Only seed transactions for active subscriptions
        continue;
      }

      if (subscription.interval === 'monthly') {
        // Create 3 months of historical transactions
        const numMonths = 3;

        for (let monthOffset = numMonths; monthOffset >= 1; monthOffset--) {
          const paidAt = new Date();
          paidAt.setMonth(paidAt.getMonth() - monthOffset);
          paidAt.setDate(randomInt(1, 28)); // Random day in month

          // 95% success rate
          const status = Math.random() < 0.95 ? 'succeeded' : 'failed';

          const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
              subscription_id: subscription.id,
              payment_provider: 'stripe',
              stripe_charge_id: `ch_test_${generateRandomId()}`,
              organization_id: subscription.organization_id,
              group_id: subscription.group_id,
              individual_id: subscription.individual_id,
              amount: subscription.amount,
              status: status,
              paid_at: status === 'succeeded' ? paidAt.toISOString() : null,
            })
            .select()
            .single();

          if (error) {
            logError(`    Failed to create transaction: ${error}`);
            continue;
          }

          seededTransactions.push(transaction);
        }

        logInfo(`    Created ${numMonths} transactions for subscription ${subscription.id}`);
      } else {
        // One-time payment - create single transaction
        const paidAt = new Date();

        const { data: transaction, error } = await supabase
          .from('transactions')
          .insert({
            subscription_id: subscription.id,
            payment_provider: 'stripe',
            stripe_charge_id: `ch_test_${generateRandomId()}`,
            organization_id: subscription.organization_id,
            group_id: subscription.group_id,
            individual_id: subscription.individual_id,
            amount: subscription.amount,
            status: 'succeeded',
            paid_at: paidAt.toISOString(),
          })
          .select()
          .single();

        if (error) {
          logError(`    Failed to create one-time transaction: ${error}`);
          continue;
        }

        seededTransactions.push(transaction);
        logInfo(`    Created one-time transaction for subscription ${subscription.id}`);
      }
    } catch (error) {
      logError(`  Failed to seed transactions for subscription ${subscription.id}: ${error}`);
    }
  }

  return seededTransactions;
}

// Generate realistic Stripe charge ID
function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

---

#### Phase 6: Documentation & Usage Guide

Create comprehensive documentation for setup, usage, and troubleshooting.

**Files to create:**
- `docs/stripe-test-data-guide.md` (NEW)

**Files to modify:**
- `README.md` (UPDATE - add reference to seeding)

**Tasks:**
- [ ] Document Stripe CLI installation steps
- [ ] Explain webhook forwarding setup
- [ ] Provide usage examples (`npm run seed:stripe`)
- [ ] Document cleanup process (`npm run seed:stripe:clean`)
- [ ] Add troubleshooting section
- [ ] Link to Stripe test card numbers

**docs/stripe-test-data-guide.md:**

```markdown
# Stripe Test Data Seeding Guide

This guide explains how to populate MinSponsor with realistic Stripe test data for development and testing.

## Prerequisites

### 1. Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Other platforms:** See https://stripe.com/docs/stripe-cli

### 2. Authenticate Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe test account.

### 3. Environment Variables

Ensure `.env.local` has these variables set:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Usage

### Full Seeding (Recommended)

This creates organizations, subscriptions, and transaction history:

```bash
# 1. Start Stripe webhook forwarding (in separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Run seeding script
npm run seed:stripe
```

The script will:
1. ✅ Prompt for confirmation before deleting existing test data
2. 🧹 Clean old test data
3. 📋 Create 3 test organizations with Stripe Connect accounts
4. 👥 Create 2-3 groups per organization
5. 🧑‍🤝‍🧑 Create 3-5 individuals per group
6. 💳 Create 8-12 subscriptions (70% monthly, 30% one-time)
7. 💰 Generate 3 months of transaction history
8. 📊 Display summary with admin dashboard link

### Clean Only

To remove all test data without creating new data:

```bash
npm run seed:stripe:clean
```

## What Gets Created

### Organizations

1. **Test Fotballklubb** (Fully onboarded)
   - ✅ Stripe Connect account active
   - ✅ `charges_enabled: true`
   - Groups: "Herrer A-lag", "Damer Senior", etc.

2. **Test Håndballklubb** (Onboarding pending)
   - ⏳ Stripe Connect account created
   - ❌ `charges_enabled: false`
   - Groups: "Elite Herrer", "Elite Damer", etc.

3. **Test Skiklubb** (No Stripe setup)
   - ❌ No Stripe account
   - Groups: "Langrenn Senior", "Alpint Junior", etc.

### Subscriptions

- **8-12 subscriptions** distributed across organizations
- **70% monthly recurring**, 30% one-time payments
- Amounts: 50kr, 100kr, 200kr, 350kr
- Statuses: 80% active, 15% cancelled, 5% expired
- Attribution: Mix of org-level, group-level, and individual-level

### Transactions

- **3 months** of history for each active monthly subscription
- **95% success rate**, 5% failed payments
- Realistic timestamps (monthly intervals, random day in month)

## Verification

After seeding, verify in the admin dashboard:

1. Navigate to http://localhost:3000/admin
2. Check **Dashboard Stats**:
   - Total Organizations: 3
   - Active Subscribers: ~8-10
   - MRR: ~600-1200kr
3. Check **Organizations Table**:
   - Stripe status badges (Active/Pending/—)
4. Click into an organization:
   - View active sponsors
   - View MRR
   - Check Stripe onboarding status

## Troubleshooting

### "Stripe CLI not found"

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

### "Stripe CLI not running"

Start webhook forwarding in a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Note: You can run the seeding script without Stripe CLI, but webhooks won't be tested.

### "Missing environment variables"

Ensure `.env.local` has all required variables (see Prerequisites).

### "Failed to create Stripe account"

**Cause:** Rate limiting or authentication issues.

**Solution:**
- Wait 1 minute and retry
- Verify `stripe login` is authenticated
- Check Stripe test mode is enabled

### "Subscriptions not appearing"

**Cause:** Webhook events may not have been processed yet.

**Solution:**
- Wait 5-10 seconds for webhook processing
- Check Stripe CLI output for webhook events
- Verify webhook endpoint is accessible at `localhost:3000/api/webhooks/stripe`

## Stripe Test Cards

For manual testing after seeding, use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success (Visa) |
| `5555 5555 5555 4444` | Success (Mastercard) |
| `4000 0027 6000 3184` | Requires 3D Secure |
| `4000 0000 0000 0002` | Declined (generic) |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

Use any future expiration date and any 3-digit CVC.

More test cards: https://stripe.com/docs/testing

## Cleanup

To reset test data:

```bash
npm run seed:stripe:clean
```

This deletes all data marked with `seed_source='test'` (production data is never touched).

## Advanced: Manual Stripe Connect Onboarding

To test the full Stripe Connect onboarding flow:

1. Seed organizations with `npm run seed:stripe`
2. Navigate to admin dashboard: http://localhost:3000/admin
3. Click on "Test Håndballklubb" (pending onboarding)
4. Click "Generate Stripe Onboarding Link"
5. Copy the link and open in browser
6. Complete Stripe Express onboarding (use test data)
7. Return to admin dashboard
8. Verify organization shows "Active" Stripe status

## Notes

- All test data is marked with `seed_source='test'` in the database
- Stripe objects are marked with `metadata.test_seed='true'`
- Stripe test data persists in Stripe Dashboard until manually deleted
- Database test data can be reset with `npm run seed:stripe:clean`
```

**README.md update:**

```markdown
<!-- Add to Development section -->

## Development

### Seeding Test Data

To populate the admin dashboard with Stripe test data:

```bash
# Start Stripe webhook forwarding (separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Run seeding script
npm run seed:stripe
```

See [Stripe Test Data Guide](docs/stripe-test-data-guide.md) for full details.
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Running `npm run seed:stripe` creates 3 test organizations with Norwegian profiles
- [ ] Each organization has 2-3 groups with 3-5 individuals
- [ ] 8-12 subscriptions are created (70% monthly, 30% one-time)
- [ ] Subscriptions are attributed across organizations, groups, and individuals
- [ ] Active monthly subscriptions have 3 months of transaction history
- [ ] Transaction records have 95% success rate and realistic timestamps
- [ ] Stripe Connect accounts are created for 2 organizations
- [ ] One organization is fully onboarded (`charges_enabled: true`)
- [ ] Test data is marked with `seed_source='test'` for safe cleanup
- [ ] Running `npm run seed:stripe:clean` removes all test data without affecting production

### Non-Functional Requirements

- [ ] Script completes in under 2 minutes (including Stripe API calls)
- [ ] Errors are logged clearly with actionable messages
- [ ] Script is idempotent (can run multiple times safely)
- [ ] Prerequisites are checked before execution
- [ ] User confirmation is required before deleting data
- [ ] Progress is logged with visual indicators (emoji + colors)
- [ ] Summary displays total counts and admin dashboard link

### Quality Gates

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Script runs successfully in local development environment
- [ ] Admin dashboard displays correct metrics after seeding
- [ ] MRR calculations match expected totals (sum of active monthly subscriptions)
- [ ] Organization detail pages show correct subscriber counts
- [ ] Stripe Dashboard shows created Connect accounts and customers
- [ ] Documentation is complete and accurate

## Success Metrics

**Primary Metrics:**
- **Time to seed full dataset:** < 2 minutes
- **Data accuracy:** 100% (all created records are valid and consistent)
- **Idempotency:** Running script 3x produces same end state

**Secondary Metrics:**
- **Developer onboarding time:** New developers can seed data in < 5 minutes
- **Admin UI usability:** Dashboard shows realistic data patterns
- **Webhook testing:** Idempotency and event handling can be verified

## Dependencies & Prerequisites

**Environment:**
- Node.js 18+ (for native fetch support)
- Stripe test account with API keys configured
- Supabase project with service role key
- Stripe CLI installed (optional but recommended)

**Code Dependencies:**
- `stripe` npm package (already installed)
- `@supabase/supabase-js` (already installed)
- `tsx` for TypeScript execution (`npm install --save-dev tsx`)

**Database:**
- Migration `002_add_seed_source.sql` applied
- `organizations`, `groups`, `individuals`, `subscriptions`, `transactions` tables exist

**External Services:**
- Stripe API (test mode)
- Supabase API

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe API rate limiting | High | Low | Add delays between API calls, implement retry logic |
| Webhook timing issues | Medium | Medium | Create subscriptions directly in DB, verify with Stripe CLI |
| Test data cleanup fails | High | Low | Use transactions, mark data with `seed_source`, confirm before delete |
| Stripe Connect account creation fails | Medium | Low | Log errors, continue with other orgs, provide manual onboarding fallback |
| Database constraint violations | Medium | Low | Use unique checks before insert, generate unique slugs with timestamps |
| Missing environment variables | High | Low | Check prerequisites at start, provide clear error messages |

## Future Considerations

**Not in scope for MVP, but considered for future iterations:**

### Vipps Test Data Seeding
- Separate script for Vipps subscriptions and agreements
- Requires Vipps test mode API access

### Custom Scenarios via Config File
- `scripts/stripe-test-scenarios.json` for customizable test data
- Allows testing specific edge cases (failed payments, expired subscriptions, etc.)

### Admin UI "Generate Test Data" Button
- In-app seeding without running CLI commands
- Useful for non-technical stakeholders

### E2E Test Integration
- Use seeded data for automated E2E tests
- Reset database state before each test run

### Stripe Connect Onboarding Automation
- Programmatically complete Express account onboarding
- Requires test mode APIs or Stripe test fixtures

## References & Research

### Internal References

**Existing Stripe Integration:**
- `src/lib/stripe.ts:5-19` - Stripe client initialization pattern
- `src/lib/stripe.ts:24-51` - Connect account creation
- `src/app/api/checkout/route.ts:143-202` - Checkout session creation
- `src/app/api/webhooks/stripe/route.ts:26-37` - Webhook idempotency pattern
- `src/lib/supabase/admin.ts:1-26` - Supabase admin client setup

**Database Schema:**
- `supabase/migrations/001_initial_schema.sql:8-30` - Organizations table
- `supabase/migrations/001_initial_schema.sql:66-89` - Subscriptions table
- `supabase/migrations/001_initial_schema.sql:92-112` - Transactions table
- `src/lib/database.types.ts` - TypeScript type definitions

**Validation & Utils:**
- `src/lib/validations.ts:4-13` - Slug generation function
- `src/lib/validations.ts:15-25` - Organization validation schema
- `src/lib/fees.ts` - Platform fee calculation (10%)

### External References

**Stripe Documentation:**
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI Webhooks](https://stripe.com/docs/stripe-cli/webhooks)
- [Stripe Subscriptions API](https://stripe.com/docs/api/subscriptions)

**Supabase Documentation:**
- [Supabase Service Role](https://supabase.com/docs/guides/auth/service-role-keys)
- [Bypassing RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#bypassing-row-level-security)

### Related Work

**Brainstorm Document:**
- `docs/brainstorms/2026-01-27-stripe-test-data-seeding-brainstorm.md` - Complete context and decisions

**Implementation Plan:**
- `docs/plans/2026-01-26-feat-minsponsor-mvp-implementation-plan.md` - Original MVP plan with Stripe integration details
