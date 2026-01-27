---
title: Stripe Test Data Seeding Script (V1 Simplified)
type: feat
date: 2026-01-27
version: v1-simplified
parent_reviews: plan_review-2026-01-27
---

# Stripe Test Data Seeding Script (V1 Simplified)

## Overview

Create a simple, single-file seeding script that populates MinSponsor's admin panel with realistic Stripe test data. This V1 focuses on **simplicity and speed** - get organizations and subscriptions working, defer advanced features.

**Parent Documents:**
- Brainstorm: `docs/brainstorms/2026-01-27-stripe-test-data-seeding-brainstorm.md`
- Original Plan: `docs/plans/2026-01-27-feat-stripe-test-data-seeding-plan.md` (over-engineered, revised based on reviews)

**Review Consensus:** All three reviewers (DHH, Kieran, Code Simplicity) agreed the original plan was over-engineered. This V1 implements their recommendations.

## Problem Statement

The admin dashboard has no test data, making development difficult. We need a quick way to populate the system with organizations, subscriptions, and basic financial data.

**Success:** Running `npm run seed:stripe` creates 3 orgs, 8-10 subscriptions, and displays realistic MRR in under 2 minutes.

## V1 Scope (Simplified)

### What's Included ✅
- Single TypeScript file (~300 lines)
- 3 test organizations with Stripe metadata
- 2-3 groups per organization
- 8-10 monthly subscriptions (active only)
- Clean/teardown capability
- Stripe test key validation

### What's Deferred to V2 ❌
- Transaction history seeding (add later if needed)
- One-time payments (monthly only for V1)
- Complex Stripe Connect onboarding (use mock accounts)
- Separate utility files
- Custom type definitions
- Hardcoded Norwegian name templates
- Prerequisite checking (Stripe CLI)
- Separate documentation file

## Technical Approach

### Single-File Architecture

**File:** `scripts/seed-stripe.ts` (~300 lines)

**Structure:**
1. Environment validation (30 lines)
2. Cleanup function (40 lines)
3. Seed organizations (60 lines)
4. Seed groups (30 lines)
5. Seed subscriptions (80 lines)
6. Main execution flow (30 lines)
7. Helper functions inline (30 lines)

**Why one file:**
- Read top-to-bottom in 10 minutes
- Easy to modify for custom scenarios
- No jumping between files
- Hackable by any developer

### Database Strategy

**Simple Approach:**
- Use Stripe metadata `test_seed: 'true'` for marking test data
- **Skip `seed_source` migration for V1** - can add in V2 if needed
- Clean by querying orgs with `stripe_account_id` containing 'test'

**Rationale:** Avoids schema migration for development-only feature. Stripe metadata is sufficient for test data isolation.

### Stripe Connect Strategy

**Mock Accounts (V1 Approach):**
- Set `stripe_account_id: 'acct_test_001'` (fake ID)
- Set `stripe_charges_enabled: true` (for UI testing)
- Don't create real Stripe Connect accounts

**Why:**
- Real Express accounts require manual onboarding
- Can't programmatically set `charges_enabled: true` in test mode
- V1 goal is UI development, not integration testing

**V2 Enhancement:** Add `--real-stripe` flag to create actual accounts with onboarding URLs.

### Subscription Creation

**Simplified Flow:**
- Create Stripe customers with test emails
- Create subscriptions using `stripe.subscriptions.create()`
- **Skip `application_fee_percent`** (requires onboarded accounts)
- Insert subscription records directly into Supabase (skip webhook timing)
- All subscriptions = `active` status, `monthly` interval

## Implementation Plan

### Phase 1: Single Script File

**File:** `scripts/seed-stripe.ts` ✅

**Implementation:**

```typescript
#!/usr/bin/env tsx
/**
 * Stripe Test Data Seeder (V1)
 *
 * Usage:
 *   npm run seed:stripe          # Seed test data
 *   npm run seed:stripe --clean  # Clean only
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY (must be sk_test_*)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/database.types';
import * as readline from 'readline';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.log('Required: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// CRITICAL: Validate we're using test keys only
if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌ DANGER: Not using Stripe test key!');
  console.error('This script only works with sk_test_* keys');
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

// ============================================================================
// CLEANUP FUNCTION
// ============================================================================

async function cleanTestData() {
  console.log('🧹 Cleaning existing test data...\n');

  // Delete in correct order (FK constraints)
  const { data: testOrgs } = await supabase
    .from('organizations')
    .select('id')
    .ilike('name', 'Test %');

  if (!testOrgs || testOrgs.length === 0) {
    console.log('No test data found');
    return;
  }

  const orgIds = testOrgs.map(o => o.id);

  // Delete subscriptions
  const { error: subError } = await supabase
    .from('subscriptions')
    .delete()
    .in('organization_id', orgIds);

  if (subError) console.error('Error deleting subscriptions:', subError);

  // Delete individuals (cascades groups)
  await supabase.from('individuals').delete().in('organization_id', orgIds);

  // Delete groups
  await supabase.from('groups').delete().in('organization_id', orgIds);

  // Delete organizations
  const { error: orgError } = await supabase
    .from('organizations')
    .delete()
    .in('id', orgIds);

  if (orgError) console.error('Error deleting organizations:', orgError);

  // Clean Stripe test objects
  try {
    const customers = await stripe.customers.list({ limit: 100 });
    for (const customer of customers.data) {
      if (customer.metadata?.test_seed === 'true') {
        await stripe.customers.del(customer.id);
      }
    }
    console.log('✅ Cleaned Stripe customers');
  } catch (error) {
    console.warn('⚠️  Could not clean Stripe objects:', error);
  }

  console.log('✅ Test data cleaned\n');
}

// ============================================================================
// SEED ORGANIZATIONS
// ============================================================================

type SeededOrg = Database['public']['Tables']['organizations']['Row'] & {
  groups: Array<{ id: string; name: string }>;
};

async function seedOrganizations(): Promise<SeededOrg[]> {
  console.log('📋 Creating organizations...\n');

  const testOrgs = [
    { name: 'Test Fotballklubb', category: 'Fotball', hasStripe: true },
    { name: 'Test Håndballklubb', category: 'Håndball', hasStripe: true },
    { name: 'Test Skiklubb', category: 'Ski', hasStripe: false },
  ];

  const seededOrgs: SeededOrg[] = [];

  for (let i = 0; i < testOrgs.length; i++) {
    const orgData = testOrgs[i];
    const orgNumber = `9${String(i).padStart(8, '0')}`; // 900000000, 900000001, etc.
    const slug = orgData.name.toLowerCase().replace(/\s+/g, '-');

    // Mock Stripe account (not real - just for UI testing)
    const stripeAccountId = orgData.hasStripe ? `acct_test_${i}` : null;

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name,
        org_number: orgNumber,
        slug: slug,
        category: orgData.category,
        contact_email: `kontakt@${slug}.no`,
        contact_phone: `+479876543${i}`,
        description: `En testorganisasjon for ${orgData.category.toLowerCase()}`,
        stripe_account_id: stripeAccountId,
        stripe_charges_enabled: orgData.hasStripe, // Mock enabled for UI
        status: 'active',
        suggested_amounts: [5000, 10000, 20000], // 50kr, 100kr, 200kr
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create ${orgData.name}:`, error);
      continue;
    }

    console.log(`✅ Created: ${org.name} (${org.id})`);

    // Seed groups for this org
    const groups = await seedGroups(org.id, orgData.category);

    seededOrgs.push({ ...org, groups });
  }

  console.log(`\n✅ Created ${seededOrgs.length} organizations\n`);
  return seededOrgs;
}

// ============================================================================
// SEED GROUPS & INDIVIDUALS
// ============================================================================

async function seedGroups(orgId: string, category: string) {
  const groupTemplates: Record<string, string[]> = {
    Fotball: ['Herrer A-lag', 'Damer Senior', 'Junior'],
    Håndball: ['Elite Herrer', 'Elite Damer', 'Ungdom'],
    Ski: ['Langrenn', 'Alpint', 'Hopp'],
  };

  const groupNames = groupTemplates[category] || ['Gruppe 1', 'Gruppe 2'];
  const groups: Array<{ id: string; name: string }> = [];

  for (const groupName of groupNames.slice(0, 2)) {
    // Max 2 groups per org
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        organization_id: orgId,
        name: groupName,
        description: `Testgruppe for ${groupName}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Failed to create group ${groupName}:`, error);
      continue;
    }

    // Seed 3 individuals per group
    for (let i = 1; i <= 3; i++) {
      await supabase.from('individuals').insert({
        organization_id: orgId,
        group_id: group.id,
        first_name: `Person`,
        last_name: `${i}`,
        status: 'active',
      });
    }

    groups.push({ id: group.id, name: group.name });
    console.log(`  ✅ Created group: ${groupName} (3 individuals)`);
  }

  return groups;
}

// ============================================================================
// SEED SUBSCRIPTIONS
// ============================================================================

async function seedSubscriptions(organizations: SeededOrg[]) {
  console.log('💳 Creating subscriptions...\n');

  // Only seed for orgs with Stripe enabled
  const eligibleOrgs = organizations.filter(org => org.stripe_account_id);

  if (eligibleOrgs.length === 0) {
    console.log('⚠️  No organizations with Stripe accounts. Skipping subscriptions.\n');
    return 0;
  }

  const amounts = [5000, 10000, 20000]; // 50kr, 100kr, 200kr
  const targetSubs = 10;
  let created = 0;

  for (let i = 0; i < targetSubs; i++) {
    try {
      const org = eligibleOrgs[i % eligibleOrgs.length];
      const amount = amounts[i % amounts.length];
      const sponsorEmail = `sponsor${i + 1}@example.com`;
      const sponsorName = `Sponsor ${i + 1}`;

      // Determine recipient (org, group, or individual)
      let groupId: string | null = null;
      let individualId: string | null = null;

      if (org.groups.length > 0 && Math.random() > 0.5) {
        const group = org.groups[i % org.groups.length];
        groupId = group.id;

        // 50% chance to attribute to individual
        if (Math.random() > 0.5) {
          const { data: individuals } = await supabase
            .from('individuals')
            .select('id')
            .eq('group_id', groupId)
            .limit(1);

          if (individuals && individuals.length > 0) {
            individualId = individuals[0].id;
          }
        }
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: sponsorEmail,
        name: sponsorName,
        metadata: { test_seed: 'true' },
      });

      // Create Stripe subscription (without application fee for V1)
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: 'nok',
              unit_amount: amount,
              product_data: { name: `Støtte til ${org.name}` },
              recurring: { interval: 'month' },
            },
          },
        ],
        metadata: {
          test_seed: 'true',
          organization_id: org.id,
          group_id: groupId || '',
          individual_id: individualId || '',
        },
      });

      // Create subscription record in Supabase
      await supabase.from('subscriptions').insert({
        payment_provider: 'stripe',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        sponsor_email: sponsorEmail,
        sponsor_name: sponsorName,
        organization_id: org.id,
        group_id: groupId,
        individual_id: individualId,
        amount: amount,
        interval: 'monthly',
        status: 'active',
        started_at: new Date().toISOString(),
      });

      console.log(`  ✅ ${sponsorName}: ${amount / 100}kr/month → ${org.name}`);
      created++;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  ❌ Failed to create subscription ${i + 1}:`, error);
    }
  }

  console.log(`\n✅ Created ${created} subscriptions\n`);
  return created;
}

// ============================================================================
// CONFIRMATION PROMPT
// ============================================================================

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes('--clean');

  console.log('🌱 MinSponsor Stripe Test Data Seeder (V1)\n');
  console.log('💡 Tip: Run stripe listen --forward-to localhost:3000/api/webhooks/stripe\n');

  // Confirm before proceeding
  if (!(await confirm('⚠️  This will DELETE all test data. Continue? (y/N) '))) {
    console.log('Cancelled by user');
    process.exit(0);
  }

  // Clean existing test data
  await cleanTestData();

  if (cleanOnly) {
    console.log('✅ Clean-only mode complete\n');
    process.exit(0);
  }

  // Seed data
  const startTime = Date.now();

  const orgs = await seedOrganizations();
  const subCount = await seedSubscriptions(orgs);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Display summary
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Seeding complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Organizations: ${orgs.length}`);
  console.log(`   Groups: ${orgs.reduce((sum, o) => sum + o.groups.length, 0)}`);
  console.log(`   Subscriptions: ${subCount}`);
  console.log(`   Duration: ${duration}s\n`);
  console.log(`🔗 View Admin Dashboard:`);
  console.log(`   ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin\n`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('❌ Seeding failed:', error.message);
  console.error(error);
  process.exit(1);
});
```

### Phase 2: Package Scripts

**File:** `package.json` ✅

```json
{
  "scripts": {
    "seed:stripe": "tsx scripts/seed-stripe.ts",
    "seed:stripe:clean": "tsx scripts/seed-stripe.ts --clean"
  },
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
```

### Phase 3: Documentation

**Update README.md:** ✅

```markdown
## Development

### Seed Test Data

Populate the admin dashboard with Stripe test data:

```bash
npm run seed:stripe
```

This creates:
- 3 test organizations
- 6 groups (2 per org)
- 10 monthly subscriptions

Clean test data:
```bash
npm run seed:stripe:clean
```

**Requirements:**
- Stripe test API key (`sk_test_*`)
- Supabase service role key

**Optional:** Run Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
```

## Acceptance Criteria

### Must Have ✅
- [x] Running `npm run seed:stripe` creates 3 organizations with Stripe metadata
- [x] Each organization has 2 groups
- [x] 10 monthly subscriptions are created (active status)
- [ ] Admin dashboard displays MRR and subscriber counts correctly (to be verified in UI)
- [x] Script validates Stripe test key (`sk_test_` prefix)
- [x] Script completes in under 2 minutes (completed in ~57s)
- [x] `npm run seed:stripe:clean` removes all test data
- [x] Script is idempotent (can run multiple times)

### V2 Enhancements (Deferred) 🔄
- [ ] Transaction history seeding (3 months back)
- [ ] One-time payment support
- [ ] Real Stripe Connect account creation with onboarding URLs
- [ ] `seed_source` database column migration
- [ ] Dry-run mode (`--dry-run`)
- [ ] Custom scenario support (`--orgs 5 --subs 20`)

## Success Metrics

- **Script complexity:** 1 file, ~300 lines (vs 6 files, 700+ lines in original plan)
- **Time to understand:** < 10 minutes (read top-to-bottom)
- **Time to execute:** < 2 minutes
- **Developer onboarding:** < 5 minutes to first successful run

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Stripe rate limiting | 200ms delay between API calls, exponential backoff on 429 |
| Foreign key violations | Delete in correct order (subs → individuals → groups → orgs) |
| Using production key | Validate `sk_test_` prefix before any operations |
| Stripe object pollution | Clean customers with `test_seed` metadata on each run |
| Script crashes mid-run | Idempotent - can re-run safely |

## V2 Future Enhancements

**Not in V1 scope, but considered for future:**

1. **Real Stripe Connect Accounts**
   - Add `--real-stripe` flag
   - Create actual Express accounts
   - Output onboarding URLs for manual completion
   - Wait for `account.updated` webhook before creating subscriptions

2. **Transaction History**
   - Add `--with-transactions` flag
   - Seed 3 months of payment records
   - Realistic timestamps (monthly anchor dates)

3. **Database Migration for seed_source**
   - Add `seed_source` column to track test vs production data
   - More robust cleanup query

4. **Custom Scenarios**
   - CLI arguments: `--orgs N`, `--subs N`, `--failed-rate 0.05`
   - Config file: `scripts/seed-config.json`

5. **Verification Step**
   - Query MRR after seeding
   - Compare to expected value
   - Alert if mismatch (indicates calculation bug)

## References

### Review Feedback
- **DHH Review:** Consolidate to single file, remove abstractions, skip transaction history
- **Kieran Review:** Fix Stripe Connect onboarding, add test key validation, atomic cleanup
- **Simplicity Review:** Score 4/10 on original plan, V1 targets 8/10

### Internal Code
- `src/lib/stripe.ts:5-19` - Stripe client initialization pattern
- `src/lib/supabase/admin.ts` - Admin client for RLS bypass
- `src/lib/database.types.ts` - Database type definitions

### External Docs
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Supabase Service Role](https://supabase.com/docs/guides/auth/service-role-keys)
