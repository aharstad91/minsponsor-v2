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

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/database.types';
import * as readline from 'readline';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

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

  const orgIds = testOrgs.map((o: { id: string }) => o.id);

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
    // Delete customers (this also cancels their subscriptions)
    const customers = await stripe.customers.list({ limit: 100 });
    for (const customer of customers.data) {
      if (customer.metadata?.test_seed === 'true') {
        await stripe.customers.del(customer.id);
      }
    }

    // Archive products (can't delete products with prices)
    const products = await stripe.products.list({ limit: 100 });
    for (const product of products.data) {
      if (product.metadata?.test_seed === 'true') {
        try {
          await stripe.products.update(product.id, { active: false });
        } catch (e) {
          // Ignore errors when archiving products
        }
      }
    }

    console.log('✅ Cleaned Stripe customers and products');
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
    const groupSlug = groupName.toLowerCase().replace(/\s+/g, '-');

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        organization_id: orgId,
        name: groupName,
        slug: groupSlug,
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
      const individualSlug = `person-${i}`;

      await supabase.from('individuals').insert({
        organization_id: orgId,
        group_id: group.id,
        first_name: `Person`,
        last_name: `${i}`,
        slug: individualSlug,
        consent_given_by: 'Test Admin',
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

      // Create a test payment method and attach to customer
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: 'tok_visa', // Stripe test token for Visa card
        },
      });

      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Create a product and price
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

      // Create Stripe subscription (without application fee for V1)
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
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
