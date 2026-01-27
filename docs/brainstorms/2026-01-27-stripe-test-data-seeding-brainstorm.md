# Stripe Test Data Seeding - Brainstorm

**Date:** 2026-01-27
**Status:** Ready for Planning

## What We're Building

A comprehensive automated seeding solution to populate MinSponsor's admin panel with realistic Stripe test data, enabling developers to:

1. **See actual financial metrics** - MRR, subscriber counts, transaction history
2. **Verify Stripe integration** - Test webhook handlers, Connect onboarding, and payment flows
3. **Develop admin UI features** - Work with realistic data during development
4. **Test edge cases** - Simulate various subscription states and payment scenarios

### Key Components

- **Seeding script** (`scripts/seed-stripe-test-data.ts`) - Automated test data generator
- **Stripe CLI integration** - Local webhook forwarding for event testing
- **Test scenarios** - Organizations, subscriptions, transactions with realistic patterns
- **Teardown capability** - Clean reset of test data for fresh starts

## Why This Approach

**Selected: Comprehensive Seeding Script + Stripe CLI Webhooks**

This approach was chosen over alternatives because it:

✅ **Tests the real integration** - Uses actual Stripe APIs and webhook flows
✅ **Verifies Connect onboarding** - Tests Express account creation and capabilities
✅ **Catches bugs early** - Validates webhook idempotency and error handling
✅ **Repeatable** - One command to reset and re-seed entire test environment
✅ **Production-like** - Simulates real user flows and timing

### Alternatives Considered

**Direct Database Seeding** - Rejected because it doesn't verify actual Stripe integration works. Would create fake Stripe IDs without testing webhook handlers.

**Manual Testing Only** - Rejected because it's time-consuming and error-prone. Doesn't scale for ongoing development.

## Key Decisions

### 1. Test Data Scope

**Organizations:**
- 3 test organizations representing different states:
  - **"Test Fotballklubb"** - Fully onboarded, active subscriptions, charges_enabled
  - **"Test Håndballklubb"** - Onboarding in progress, pending charges_enabled
  - **"Test Skiklubb"** - No Stripe setup yet (clean slate)
- Each with Norwegian org numbers and realistic profiles

**Groups & Individuals:**
- 2-3 groups per organization (e.g., "Herrer A-lag", "Damer Senior", "Junior Gutt")
- 3-5 individuals per group with realistic Norwegian names
- Subscriptions attributed across all levels (org, group, individual)

**Subscriptions:**
- 8-12 total subscriptions across organizations
- Mix: 70% monthly recurring, 30% one-time payments
- Amounts: 50kr, 100kr, 200kr, and 1 custom amount (350kr)
- Statuses: 80% active, 15% cancelled, 5% expired

**Transactions:**
- 3 months of historical data per active monthly subscription
- 1 transaction per one-time payment
- 95% succeeded, 5% failed (realistic failure rate)
- Timestamps: Monthly intervals, randomly distributed within billing period

### 2. Stripe CLI Webhook Strategy

**Local Development:**
- Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Seeds script triggers events that flow through webhook handlers
- Verifies idempotency and data consistency

**Setup Requirements:**
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe` on macOS)
- Authenticated with test account (`stripe login`)
- Webhook secret from CLI output stored in `.env.local`

### 3. Connect Account Handling

**Test Mode Express Accounts:**
- Create Express accounts for test organizations
- Use Stripe test mode APIs to simulate onboarding completion
- For full onboarding testing, provide manual link in script output
- Set `charges_enabled: true` for fully onboarded orgs

**Decision:** Support both auto-completed and manual testing paths to balance automation with verification.

### 4. Script Execution Flow

```
npm run seed:stripe
  ↓
1. Check prerequisites (Stripe CLI running, env vars set)
2. Prompt: "This will reset test data. Continue? (y/N)"
3. Clean existing test data (mark with seed_source=test)
4. Create test organizations in Supabase
5. Create Stripe Connect accounts
6. Create test customers and subscriptions
7. Wait for webhooks to process
8. Seed historical transactions
9. Display summary with dashboard link
```

### 5. Test Data Markers

**Database Strategy:**
- Add `seed_source` column to organizations table (nullable text)
- Mark seeded orgs with `seed_source = 'test'`
- Teardown queries filter by this field
- Production data is never touched

**Stripe Strategy:**
- Use consistent metadata: `test_seed: 'true'`
- Allows bulk cleanup in Stripe Dashboard if needed

## Open Questions

### Resolved

✅ **Should we support Vipps test data too?**
Decision: Start with Stripe only. Vipps seeding can be added later if needed (separate script due to different APIs).

✅ **How to handle Stripe CLI not running?**
Decision: Script checks for Stripe CLI process, provides clear setup instructions if missing, offers to continue with webhook simulation disabled.

✅ **What happens to old test data?**
Decision: Script prompts before deletion, filters by `seed_source='test'` to avoid touching production data.

### Still Open

❓ **Should we support custom scenarios via config file?**
Could add `scripts/stripe-test-scenarios.json` for customizable test data patterns. Adds flexibility but increases complexity. **Decision:** Defer to future iteration - start with hardcoded scenarios.

### Answered During Brainstorm

✅ **Should script create groups and individuals too?**
**Decision:** Yes - Create full hierarchy (2-3 groups per org, 3-5 individuals per group). This tests attribution features and provides realistic dashboard data.

✅ **How many historical transactions per subscription?**
**Decision:** 3 months of history (3 transactions per monthly subscription). Balances realistic data volume with fast seeding.

## Success Criteria

**Must Have:**
- [ ] Running `npm run seed:stripe` populates admin dashboard with realistic data
- [ ] MRR calculations show accurate totals and provider splits
- [ ] Organizations table shows Stripe status badges correctly
- [ ] Organization detail pages display active subscribers and revenue
- [ ] Transaction history appears in database with correct relationships
- [ ] Webhook idempotency prevents duplicate subscriptions

**Nice to Have:**
- [ ] Multiple test scenarios (new org, active org, cancelled subs)
- [ ] Failed payment examples for testing error states
- [ ] Groups and individuals with attributed subscriptions
- [ ] Documentation for manual Connect onboarding testing

## Technical Constraints

**Environment:**
- Requires Stripe test keys (already configured)
- Needs Supabase service role key for direct DB access
- Stripe CLI for webhook forwarding

**Test Mode Limitations:**
- Stripe Connect Express accounts in test mode have simplified onboarding
- Can't test actual bank payouts (test mode)
- Some Stripe features behave differently in test vs production

**Data Cleanup:**
- Stripe test data persists in Stripe Dashboard until manually deleted
- Database seed data can be reset via script
- Should never mix test and production data in same environment

## Next Steps

**Ready for Implementation:**
1. Run `/workflows:plan` to create detailed implementation plan
2. Build seeding script with Stripe API integration
3. Add Stripe CLI setup documentation
4. Test webhook flows with various scenarios
5. Document usage in README

**Future Enhancements (Not in Scope):**
- Vipps test data seeding
- Admin UI "Generate Test Data" button
- Automated E2E tests using seeded data
- Stripe Connect onboarding flow automation
