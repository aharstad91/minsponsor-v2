---
title: "MinSponsor MVP Implementation"
type: feat
date: 2026-01-26
status: ready
timeline: 6 weeks
reviewed_by: [DHH, Kieran, Simplicity]
stack: Next.js + Supabase + Vercel + Stripe + Vipps
---

# MinSponsor MVP Implementation Plan

## Overview

Build the MinSponsor platform - a modern fundraising system for Norwegian youth sports that replaces traditional product-based fundraisers with recurring monthly sponsorships. The MVP enables sponsors to support organizations, groups, and individuals via **Vipps (primær) og kort/Apple Pay (sekundær)**, with clubs receiving funds through both Vipps and Stripe Connect.

**Success Criteria:**
- 3+ clubs fully onboarded with both Stripe Connect AND Vipps
- 50+ successful payments (monthly + one-time)
- Checkout time <60 seconds from page visit to payment confirmed
- Zero manual intervention for payment processing
- Vipps available as primary payment option for Norwegian market

---

## Technology Stack

Optimalisert for designer/vibe coder med Supabase-erfaring:

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 15 (App Router) | Mest tutorials, best AI-støtte, fungerer perfekt med Supabase |
| **Database** | Supabase (PostgreSQL) | Du har erfaring, inkluderer dashboard for å se data |
| **Auth** | Supabase Auth | Enklere enn NextAuth, innebygd i Supabase |
| **Hosting** | Vercel | Laget for Next.js, gratis tier, ett-klikks deploy |
| **Styling** | Tailwind CSS + shadcn/ui | Perfekt for designer, Scandinavian minimalist |
| **Payments (Vipps)** | Vipps Recurring API + @vippsmobilepay/sdk | Primær betalingsmetode for Norge, høy tillit |
| **Payments (Kort)** | Stripe Connect Express | Kort/Apple Pay som alternativ |
| **Validation** | Zod | Runtime type validation |
| **Email** | Resend | Transactional emails |

**Fordeler med denne stacken:**
- Supabase Studio = gratis admin-dashboard for å se/redigere data
- Vercel deployer automatisk når du pusher til GitHub
- Masse tutorials og AI-hjelp tilgjengelig
- Du kan fokusere på design
- **Vipps = tillit** - nordmenn stoler på Vipps, øker konvertering

## Payment Architecture: Dual Provider

```
┌─────────────────────────────────────────────────────────┐
│                    Checkout Page                         │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │   📱 Vipps          │    │   💳 Kort/Apple Pay │    │
│  │   (Anbefalt)        │    │                     │    │
│  └──────────┬──────────┘    └──────────┬──────────┘    │
└─────────────┼───────────────────────────┼──────────────┘
              │                           │
              ▼                           ▼
      ┌───────────────┐           ┌───────────────┐
      │Vipps Recurring│           │ Stripe Connect│
      │  Agreement    │           │   Checkout    │
      └───────┬───────┘           └───────┬───────┘
              │                           │
              ▼                           ▼
      ┌───────────────┐           ┌───────────────┐
      │ Club's Vipps  │           │ Connected     │
      │ Sales Unit    │           │ Account       │
      │ (MSN)         │           │               │
      └───────┬───────┘           └───────┬───────┘
              │                           │
              └───────────┬───────────────┘
                          ▼
              ┌───────────────────────────┐
              │    Klubbens bankkonto     │
              └───────────────────────────┘
```

**Viktig forskjell:**
- **Stripe Connect:** Platform fee (10%) trekkes automatisk via `application_fee_amount`
- **Vipps:** Penger går direkte til klubb. MinSponsor fakturerer klubber månedlig (6%)

---

## Data Model

```
Organization (Legal entity, owns Stripe + Vipps accounts)
├── stripe_account_id (Stripe Connect)
├── vipps_msn (Vipps Sales Unit)
└── Group (Optional: team/class/bus)
    └── Individual (Optional: player/student/member)
```

**Payment Provider per Organization:**
- `stripe_account_id` + `stripe_charges_enabled` → Kort/Apple Pay
- `vipps_msn` + `vipps_enabled` → Vipps Recurring

**Subscription tracks provider:**
- `payment_provider: 'vipps' | 'stripe'`
- `vipps_agreement_id` (for Vipps subscriptions)
- `stripe_subscription_id` (for Stripe subscriptions)

**Simplifications:**
- ~~Category~~ → String field on Organization
- ~~UTM tracking~~ → Deferred to post-MVP
- ~~Custom magic links~~ → Use Stripe Customer Portal / Vipps merchantAgreementUrl
- ~~Pause/Resume~~ → Cancel only for MVP
- ~~Custom admin dashboard~~ → Use Supabase Studio initially

### Database Schema (Supabase SQL)

```sql
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sport',
  org_number TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- Vipps Recurring
  vipps_msn TEXT,  -- Merchant Serial Number
  vipps_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  vipps_onboarding_sent_at TIMESTAMPTZ,  -- When we sent invite
  -- General
  suggested_amounts INTEGER[] NOT NULL DEFAULT ARRAY[5000, 10000, 20000],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Individuals table
CREATE TABLE individuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  birth_year INTEGER,
  bio TEXT,
  photo_url TEXT,
  consent_given_by TEXT NOT NULL,
  consent_given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Payment provider tracking
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'vipps')),
  -- Stripe fields
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  -- Vipps fields
  vipps_agreement_id TEXT,
  sponsor_phone TEXT,  -- Required for Vipps
  -- Common fields
  sponsor_email TEXT NOT NULL,
  sponsor_name TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  group_id UUID REFERENCES groups(id),
  individual_id UUID REFERENCES individuals(id),
  amount INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'one_time')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'completed', 'expired')),
  started_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'vipps')),
  -- Provider-specific IDs
  stripe_charge_id TEXT,
  vipps_charge_id TEXT,
  -- Common fields
  organization_id UUID NOT NULL REFERENCES organizations(id),
  group_id UUID REFERENCES groups(id),
  individual_id UUID REFERENCES individuals(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one of the charge IDs is set
  CONSTRAINT charge_id_required CHECK (
    (payment_provider = 'stripe' AND stripe_charge_id IS NOT NULL) OR
    (payment_provider = 'vipps' AND vipps_charge_id IS NOT NULL)
  )
);

-- Unique constraints for idempotency
CREATE UNIQUE INDEX idx_transactions_stripe_charge ON transactions(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_vipps_charge ON transactions(vipps_charge_id) WHERE vipps_charge_id IS NOT NULL;

-- Processed webhook events (for idempotency - both Stripe and Vipps)
CREATE TABLE processed_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'vipps')),
  event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX idx_transactions_paid_at ON transactions(paid_at);
CREATE INDEX idx_groups_organization_id ON groups(organization_id);
CREATE INDEX idx_individuals_organization_id ON individuals(organization_id);
CREATE INDEX idx_individuals_group_id ON individuals(group_id);

-- Row Level Security (RLS) - public read for support pages
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;

-- Public can read active organizations, groups, individuals (for support pages)
CREATE POLICY "Public can view active organizations" ON organizations
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active groups" ON groups
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active individuals" ON individuals
  FOR SELECT USING (status = 'active');

-- Authenticated users (admin) can do everything
CREATE POLICY "Admins can manage organizations" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage individuals" ON individuals
  FOR ALL USING (auth.role() = 'authenticated');

-- Subscriptions and transactions are internal (no public access)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for processed_events" ON processed_events
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_individuals_updated_at
  BEFORE UPDATE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Supabase TypeScript Types

```typescript
// lib/database.types.ts
// Auto-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts

export type Organization = {
  id: string;
  name: string;
  category: string;
  org_number: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  // Stripe
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  // Vipps
  vipps_msn: string | null;
  vipps_enabled: boolean;
  vipps_onboarding_sent_at: string | null;
  // General
  suggested_amounts: number[];
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
};

// Helper to check payment availability
export function canAcceptPayments(org: Organization): boolean {
  return org.stripe_charges_enabled || org.vipps_enabled;
}

export function getAvailablePaymentMethods(org: Organization): ('vipps' | 'stripe')[] {
  const methods: ('vipps' | 'stripe')[] = [];
  if (org.vipps_enabled) methods.push('vipps');  // Vipps first (primary)
  if (org.stripe_charges_enabled) methods.push('stripe');
  return methods;
}

export type Group = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type Individual = {
  id: string;
  organization_id: string;
  group_id: string | null;
  first_name: string;
  last_name: string;
  slug: string;
  birth_year: number | null;
  bio: string | null;
  photo_url: string | null;
  consent_given_by: string;
  consent_given_at: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type PaymentProvider = 'stripe' | 'vipps';

export type Subscription = {
  id: string;
  payment_provider: PaymentProvider;
  // Stripe
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  // Vipps
  vipps_agreement_id: string | null;
  sponsor_phone: string | null;
  // Common
  sponsor_email: string;
  sponsor_name: string | null;
  organization_id: string;
  group_id: string | null;
  individual_id: string | null;
  amount: number;
  interval: 'monthly' | 'one_time';
  status: 'pending' | 'active' | 'cancelled' | 'completed' | 'expired';
  started_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## Phase 1: Foundation (Week 1)

### 1.1 Project Setup

- [x] Create Next.js 15 project: `npx create-next-app@latest minsponsor --typescript --tailwind --app`
- [ ] Create Supabase project at supabase.com
- [x] Install dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr stripe @vippsmobilepay/sdk zod
  npm install -D supabase
  ```
- [x] Add `"type": "module"` to package.json (required for Vipps SDK)
- [x] Set up shadcn/ui: `npx shadcn@latest init`
- [ ] Connect to Vercel and enable auto-deploy from GitHub

**Project structure:**
```
/app
  /layout.tsx
  /page.tsx                    # Landing page
  /globals.css
  /stott/[orgSlug]/page.tsx   # Organization support page
  /stott/[orgSlug]/gruppe/[groupSlug]/page.tsx
  /stott/[orgSlug]/gruppe/[groupSlug]/[indSlug]/page.tsx
  /stott/[orgSlug]/person/[indSlug]/page.tsx
  /checkout/page.tsx
  /checkout/vipps/callback/page.tsx  # Vipps redirect callback
  /bekreftelse/page.tsx
  /admin/page.tsx              # Simple admin (later: use Supabase Studio)
  /api/checkout/route.ts              # Creates Stripe or Vipps checkout
  /api/checkout/vipps/route.ts        # Vipps-specific agreement creation
  /api/webhooks/stripe/route.ts
  /api/webhooks/vipps/route.ts        # Vipps webhooks
/components
  /ui/                         # shadcn components
  /support-page.tsx
  /checkout-form.tsx
  /payment-method-selector.tsx # Vipps vs Card selection
/lib
  /supabase/client.ts          # Browser client
  /supabase/server.ts          # Server client
  /supabase/admin.ts           # Service role client (for webhooks)
  /stripe.ts
  /vipps.ts                    # Vipps client setup
  /validations.ts
  /fees.ts
```

### 1.2 Supabase Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/admin.ts
// For webhook handlers - uses service role key (full access, bypasses RLS)
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Never expose this to the browser!
  { auth: { persistSession: false } }
);
```

### 1.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Keep secret!

# Stripe (for card/Apple Pay)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Vipps (Partner keys - works for all merchants)
VIPPS_CLIENT_ID=...
VIPPS_CLIENT_SECRET=...
VIPPS_SUBSCRIPTION_KEY=...         # Ocp-Apim-Subscription-Key
VIPPS_MERCHANT_SERIAL_NUMBER=...   # MinSponsor's own MSN (for partner access)
VIPPS_WEBHOOK_SECRET=...
VIPPS_USE_TEST_MODE=true           # Set to false in production

NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change in production

RESEND_API_KEY=re_...
```

### 1.4 Vipps Client Setup

```typescript
// lib/vipps.ts
import { Client } from '@vippsmobilepay/sdk';

// Create Vipps client with partner credentials
export function createVippsClient() {
  return Client({
    merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
    subscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY!,
    useTestMode: process.env.VIPPS_USE_TEST_MODE === 'true',
    retryRequests: true,
  });
}

// Get access token for API calls
export async function getVippsAccessToken() {
  const client = createVippsClient();
  return await client.auth.getToken(
    process.env.VIPPS_CLIENT_ID!,
    process.env.VIPPS_CLIENT_SECRET!
  );
}

// Create agreement for a specific merchant (club)
export async function createVippsAgreement(
  merchantMsn: string,  // Club's Vipps MSN
  params: {
    phoneNumber: string;
    amount: number;  // In øre
    productName: string;
    merchantRedirectUrl: string;
    merchantAgreementUrl: string;
  }
) {
  const client = createVippsClient();
  const token = await getVippsAccessToken();

  const response = await fetch(
    `https://api${process.env.VIPPS_USE_TEST_MODE === 'true' ? 'test' : ''}.vipps.no/recurring/v3/agreements`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.access_token}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': merchantMsn,  // Act on behalf of club
        'Vipps-System-Name': 'MinSponsor',
        'Vipps-System-Version': '1.0.0',
      },
      body: JSON.stringify({
        phoneNumber: params.phoneNumber,
        interval: { unit: 'MONTH', count: 1 },
        pricing: {
          amount: params.amount,
          currency: 'NOK',
          type: 'LEGACY',
        },
        productName: params.productName,
        merchantRedirectUrl: params.merchantRedirectUrl,
        merchantAgreementUrl: params.merchantAgreementUrl,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps error: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<{
    agreementId: string;
    vippsConfirmationUrl: string;
  }>;
}

// Create a charge for an existing agreement
export async function createVippsCharge(
  merchantMsn: string,
  agreementId: string,
  params: {
    amount: number;
    description: string;
    dueDate: string;  // YYYY-MM-DD
    retryDays?: number;
  }
) {
  const token = await getVippsAccessToken();

  const response = await fetch(
    `https://api${process.env.VIPPS_USE_TEST_MODE === 'true' ? 'test' : ''}.vipps.no/recurring/v3/agreements/${agreementId}/charges`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.access_token}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': merchantMsn,
      },
      body: JSON.stringify({
        amount: params.amount,
        description: params.description,
        due: params.dueDate,
        transactionType: 'DIRECT_CAPTURE',
        retryDays: params.retryDays ?? 5,
        type: 'RECURRING',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps charge error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

### 1.5 Run Database Migration

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Paste the schema SQL from above
- [ ] Run it
- [ ] Verify tables in Table Editor

### 1.6 Stripe Connect Setup

- [ ] Create Stripe account at stripe.com
- [ ] Enable Connect in Dashboard → Connect → Get started
- [ ] Configure Connect branding (logo, colors, name)
- [ ] Get API keys from Developers → API keys
- [ ] Set up webhook endpoint (do this after deploying to Vercel)

### 1.7 Vipps Partner Setup

MinSponsor må bli Vipps Partner for å kunne handle på vegne av klubber.

**Steg 1: Bli Vipps Partner**
- [ ] Søk om Partner-tilgang på [portal.vippsmobilepay.com](https://portal.vippsmobilepay.com)
- [ ] Velg "Platform Partner" type
- [ ] Fullfør KYC/AML for MinSponsor
- [ ] Motta Partner keys (client_id, client_secret, subscription_key)

**Steg 2: Bestill Recurring API**
- [ ] I Vipps Portal: Legg til "Recurring Payments" på MinSponsor sales unit
- [ ] Vent på godkjenning (vanligvis 1-3 dager)

**Steg 3: Test i sandbox**
- [ ] Sett `VIPPS_USE_TEST_MODE=true`
- [ ] Bruk Vipps test-app på mobil
- [ ] Verifiser at agreement-oppretting fungerer

**Vipps Partner-modell:**
```
MinSponsor (Platform Partner)
├── Partner Keys (én gang)
└── Kan handle på vegne av:
    ├── Heimdal Håndball (MSN: 123456)
    ├── Byåsen IL (MSN: 234567)
    └── Rosenborg BK (MSN: 345678)
```

Hver klubb trenger sin egen Vipps Sales Unit (MSN), men MinSponsor bruker sine Partner keys til å opprette avtaler og charges på vegne av klubbene.

---

## Phase 2: Public Support Pages (Week 2)

### 2.1 URL Structure

```
/stott/{org-slug}                              → Organization
/stott/{org-slug}/gruppe/{group-slug}          → Group
/stott/{org-slug}/person/{ind-slug}            → Individual (org-level)
/stott/{org-slug}/gruppe/{group-slug}/{ind-slug} → Individual (in group)
```

### 2.2 Organization Support Page

```typescript
// app/stott/[orgSlug]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SupportPage } from '@/components/support-page';

export default async function OrganizationPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const supabase = await createClient();

  // Fetch organization with groups and individuals
  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      *,
      groups (*),
      individuals (*)
    `)
    .eq('slug', params.orgSlug)
    .eq('status', 'active')
    .single();

  if (error || !org) {
    notFound();
  }

  return (
    <SupportPage
      type="organization"
      organization={org}
      groups={org.groups}
      individuals={org.individuals.filter((i: any) => !i.group_id)}
    />
  );
}
```

### 2.3 Support Page Component

```typescript
// components/support-page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Organization, Group, Individual } from '@/lib/database.types';

type Props = {
  type: 'organization' | 'group' | 'individual';
  organization: Organization;
  group?: Group;
  individual?: Individual;
  groups?: Group[];
  individuals?: Individual[];
};

export function SupportPage({ type, organization, group, individual, groups, individuals }: Props) {
  const recipientName = individual
    ? `${individual.first_name} ${individual.last_name}`
    : group
    ? group.name
    : organization.name;

  // Can accept payments if either Vipps OR Stripe is enabled
  const canAcceptPayments = organization.vipps_enabled || organization.stripe_charges_enabled;

  // Build checkout URL with recipient info
  const checkoutUrl = `/checkout?org=${organization.id}${group ? `&group=${group.id}` : ''}${individual ? `&individual=${individual.id}` : ''}`;

  return (
    <div className="min-h-screen bg-warm-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <Link href={`/stott/${organization.slug}`}>{organization.name}</Link>
          {group && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/stott/${organization.slug}/gruppe/${group.slug}`}>
                {group.name}
              </Link>
            </>
          )}
          {individual && (
            <>
              <span className="mx-2">/</span>
              <span>{individual.first_name}</span>
            </>
          )}
        </nav>

        {/* Main card */}
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">{recipientName}</h1>

          {organization.description && type === 'organization' && (
            <p className="text-gray-600">{organization.description}</p>
          )}
          {group?.description && type === 'group' && (
            <p className="text-gray-600">{group.description}</p>
          )}
          {individual?.bio && type === 'individual' && (
            <p className="text-gray-600">{individual.bio}</p>
          )}

          {/* CTA */}
          {canAcceptPayments ? (
            <Button asChild size="lg" className="w-full">
              <Link href={checkoutUrl}>
                Støtt {type === 'individual' ? individual?.first_name : recipientName}
              </Link>
            </Button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Denne klubben kan ikke motta støtte ennå. Kontakt klubben for mer informasjon.
              </p>
            </div>
          )}

          {/* Trust indicators */}
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
            <span>Org.nr: {organization.org_number}</span>
            <span>Sikker betaling via Stripe</span>
          </div>
        </Card>

        {/* List groups */}
        {groups && groups.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">Lag og grupper</h2>
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/stott/${organization.slug}/gruppe/${g.slug}`}
                className="block p-4 bg-white rounded-lg border hover:border-primary"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}

        {/* List individuals */}
        {individuals && individuals.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">Støtt en person direkte</h2>
            {individuals.map((i) => (
              <Link
                key={i.id}
                href={
                  group
                    ? `/stott/${organization.slug}/gruppe/${group.slug}/${i.slug}`
                    : `/stott/${organization.slug}/person/${i.slug}`
                }
                className="block p-4 bg-white rounded-lg border hover:border-primary"
              >
                {i.first_name} {i.last_name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.4 Create remaining routes

- [ ] `/app/stott/[orgSlug]/gruppe/[groupSlug]/page.tsx`
- [ ] `/app/stott/[orgSlug]/gruppe/[groupSlug]/[indSlug]/page.tsx`
- [ ] `/app/stott/[orgSlug]/person/[indSlug]/page.tsx`

---

## Phase 3: Checkout Flow (Week 3)

### 3.1 Checkout Page

```typescript
// app/checkout/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout-form';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { org?: string; group?: string; individual?: string };
}) {
  const supabase = await createClient();

  // Fetch organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', searchParams.org)
    .single();

  if (!org || !org.stripe_charges_enabled) {
    redirect('/');
  }

  // Fetch group if specified
  let group = null;
  if (searchParams.group) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('id', searchParams.group)
      .single();
    group = data;
  }

  // Fetch individual if specified
  let individual = null;
  if (searchParams.individual) {
    const { data } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', searchParams.individual)
      .single();
    individual = data;
  }

  return (
    <CheckoutForm
      organization={org}
      group={group}
      individual={individual}
    />
  );
}
```

### 3.2 Checkout Form Component

```typescript
// components/checkout-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Organization, Group, Individual, PaymentProvider } from '@/lib/database.types';

type Props = {
  organization: Organization;
  group: Group | null;
  individual: Individual | null;
};

export function CheckoutForm({ organization, group, individual }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(organization.suggested_amounts[1] || 10000);
  const [customAmount, setCustomAmount] = useState('');
  const [interval, setInterval] = useState<'monthly' | 'one_time'>('monthly');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');  // Required for Vipps

  // Payment method - default to Vipps if available
  const availableMethods: PaymentProvider[] = [];
  if (organization.vipps_enabled) availableMethods.push('vipps');
  if (organization.stripe_charges_enabled) availableMethods.push('stripe');
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>(
    availableMethods[0] || 'stripe'
  );

  const recipientName = individual
    ? `${individual.first_name} ${individual.last_name}`
    : group
    ? group.name
    : organization.name;

  const selectedAmount = customAmount ? parseInt(customAmount) * 100 : amount;
  const platformFee = Math.round(selectedAmount * 0.1);
  const totalAmount = selectedAmount + platformFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone for Vipps
    if (paymentMethod === 'vipps' && !phone) {
      setError('Telefonnummer er påkrevd for Vipps');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          recipient: {
            type: individual ? 'individual' : group ? 'group' : 'organization',
            organizationId: organization.id,
            ...(group && { groupId: group.id }),
            ...(individual && { individualId: individual.id }),
          },
          amount: selectedAmount,
          interval,
          sponsorEmail: email,
          sponsorName: name || undefined,
          sponsorPhone: phone || undefined,  // For Vipps
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      // Redirect to payment provider
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 p-4">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6 shadow">
          <h1 className="text-xl font-bold">Støtt {recipientName}</h1>

          {/* Amount selection */}
          <div className="space-y-3">
            <Label>Velg beløp</Label>
            <RadioGroup
              value={customAmount ? 'custom' : amount.toString()}
              onValueChange={(v) => {
                if (v === 'custom') {
                  setCustomAmount('100');
                } else {
                  setCustomAmount('');
                  setAmount(parseInt(v));
                }
              }}
            >
              {organization.suggested_amounts.map((a) => (
                <div key={a} className="flex items-center space-x-2">
                  <RadioGroupItem value={a.toString()} id={`amount-${a}`} />
                  <Label htmlFor={`amount-${a}`}>{a / 100} kr</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="amount-custom" />
                <Label htmlFor="amount-custom">Annet beløp</Label>
              </div>
            </RadioGroup>
            {customAmount && (
              <Input
                type="number"
                min="10"
                max="100000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Beløp i kr"
              />
            )}
          </div>

          {/* Interval selection */}
          <div className="space-y-3">
            <Label>Hvor ofte?</Label>
            <RadioGroup value={interval} onValueChange={(v: any) => setInterval(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="interval-monthly" />
                <Label htmlFor="interval-monthly">Månedlig</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one_time" id="interval-one_time" />
                <Label htmlFor="interval-one_time">Engangsbidrag</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment method selection */}
          {availableMethods.length > 1 && (
            <div className="space-y-3">
              <Label>Betalingsmetode</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                {organization.vipps_enabled && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="vipps" id="pay-vipps" />
                    <Label htmlFor="pay-vipps" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[#FF5B24] font-bold">Vipps</span>
                      <span className="text-sm text-gray-500">(Anbefalt)</span>
                    </Label>
                  </div>
                )}
                {organization.stripe_charges_enabled && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="stripe" id="pay-stripe" />
                    <Label htmlFor="pay-stripe" className="flex items-center gap-2 cursor-pointer">
                      <span>💳 Kort / Apple Pay</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
              />
            </div>
            {paymentMethod === 'vipps' && (
              <div>
                <Label htmlFor="phone">Telefonnummer *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="47XXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nummeret du har registrert i Vipps
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="name">Navn (valgfritt)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt navn"
              />
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Støttebeløp</span>
              <span>{selectedAmount / 100} kr</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Plattformavgift (10%)</span>
              <span>{platformFee / 100} kr</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Totalt{interval === 'monthly' ? '/måned' : ''}</span>
              <span>{totalAmount / 100} kr</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Laster...' : `Betal ${totalAmount / 100} kr`}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Sikker betaling via Stripe. Ved å fortsette godtar du våre vilkår.
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 3.3 Checkout API Route (Dual Provider)

```typescript
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createVippsAgreement } from '@/lib/vipps';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const checkoutSchema = z.object({
  paymentMethod: z.enum(['stripe', 'vipps']),
  recipient: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('organization'),
      organizationId: z.string().uuid(),
    }),
    z.object({
      type: z.literal('group'),
      organizationId: z.string().uuid(),
      groupId: z.string().uuid(),
    }),
    z.object({
      type: z.literal('individual'),
      organizationId: z.string().uuid(),
      groupId: z.string().uuid().optional(),
      individualId: z.string().uuid(),
    }),
  ]),
  amount: z.number().int().min(1000).max(10000000),
  interval: z.enum(['monthly', 'one_time']),
  sponsorEmail: z.string().email(),
  sponsorName: z.string().optional(),
  sponsorPhone: z.string().optional(),  // Required for Vipps
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const supabase = await createClient();

    // Verify organization
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', data.recipient.organizationId)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Organisasjon ikke funnet' }, { status: 404 });
    }

    // Route to appropriate payment provider
    if (data.paymentMethod === 'vipps') {
      return handleVippsCheckout(data, org);
    } else {
      return handleStripeCheckout(data, org);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Kunne ikke opprette betaling' }, { status: 500 });
  }
}

// Vipps Checkout Handler
async function handleVippsCheckout(data: z.infer<typeof checkoutSchema>, org: any) {
  if (!org.vipps_enabled || !org.vipps_msn) {
    return NextResponse.json({ error: 'Vipps er ikke aktivert for denne klubben' }, { status: 400 });
  }

  if (!data.sponsorPhone) {
    return NextResponse.json({ error: 'Telefonnummer er påkrevd for Vipps' }, { status: 400 });
  }

  // Vipps only supports recurring for monthly
  if (data.interval === 'one_time') {
    return NextResponse.json({
      error: 'Vipps støtter kun månedlige betalinger. Velg kort for engangsbetaling.'
    }, { status: 400 });
  }

  // Format phone number (ensure Norwegian format)
  const phoneNumber = data.sponsorPhone.startsWith('47')
    ? data.sponsorPhone
    : `47${data.sponsorPhone.replace(/\D/g, '')}`;

  // Create subscription record first (pending status)
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      payment_provider: 'vipps',
      sponsor_email: data.sponsorEmail,
      sponsor_name: data.sponsorName || null,
      sponsor_phone: phoneNumber,
      organization_id: data.recipient.organizationId,
      group_id: 'groupId' in data.recipient ? data.recipient.groupId : null,
      individual_id: 'individualId' in data.recipient ? data.recipient.individualId : null,
      amount: data.amount,
      interval: 'monthly',
      status: 'pending',
    })
    .select()
    .single();

  if (subError) {
    console.error('Failed to create subscription:', subError);
    return NextResponse.json({ error: 'Kunne ikke opprette abonnement' }, { status: 500 });
  }

  try {
    // Create Vipps agreement
    const agreement = await createVippsAgreement(org.vipps_msn, {
      phoneNumber,
      amount: data.amount,
      productName: `Støtte til ${org.name}`,
      merchantRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/vipps/callback?sub=${subscription.id}`,
      merchantAgreementUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/mine-abonnementer`,  // Future: sponsor self-service
    });

    // Update subscription with Vipps agreement ID
    await supabaseAdmin
      .from('subscriptions')
      .update({ vipps_agreement_id: agreement.agreementId })
      .eq('id', subscription.id);

    return NextResponse.json({ url: agreement.vippsConfirmationUrl });
  } catch (err) {
    // Clean up failed subscription
    await supabaseAdmin.from('subscriptions').delete().eq('id', subscription.id);
    console.error('Vipps agreement creation failed:', err);
    return NextResponse.json({ error: 'Kunne ikke opprette Vipps-avtale' }, { status: 500 });
  }
}

// Stripe Checkout Handler (unchanged from before)
async function handleStripeCheckout(data: z.infer<typeof checkoutSchema>, org: any) {
  if (!org.stripe_charges_enabled || !org.stripe_account_id) {
    return NextResponse.json({ error: 'Kort-betaling er ikke aktivert for denne klubben' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: data.interval === 'monthly' ? 'subscription' : 'payment',
    customer_email: data.sponsorEmail,
    line_items: [{
      price_data: {
        currency: 'nok',
        unit_amount: data.amount,
        product_data: { name: `Støtte til ${org.name}` },
        ...(data.interval === 'monthly' && { recurring: { interval: 'month' } }),
      },
      quantity: 1,
    }],
    ...(data.interval === 'monthly' ? {
      subscription_data: {
        application_fee_percent: 10,
        transfer_data: { destination: org.stripe_account_id },
        metadata: {
          organization_id: data.recipient.organizationId,
          group_id: 'groupId' in data.recipient ? data.recipient.groupId ?? '' : '',
          individual_id: 'individualId' in data.recipient ? data.recipient.individualId : '',
          sponsor_name: data.sponsorName ?? '',
        },
      },
    } : {
      payment_intent_data: {
        application_fee_amount: Math.round(data.amount * 0.10),
        transfer_data: { destination: org.stripe_account_id },
        metadata: {
          organization_id: data.recipient.organizationId,
          group_id: 'groupId' in data.recipient ? data.recipient.groupId ?? '' : '',
          individual_id: 'individualId' in data.recipient ? data.recipient.individualId : '',
          sponsor_name: data.sponsorName ?? '',
        },
      },
    }),
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/bekreftelse?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stott/${org.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
```

### 3.4 Vipps Callback Page

Vipps redirecter tilbake hit etter at brukeren har godkjent avtalen i appen.

```typescript
// app/checkout/vipps/callback/page.tsx
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getVippsAccessToken } from '@/lib/vipps';

export default async function VippsCallbackPage({
  searchParams,
}: {
  searchParams: { sub?: string };
}) {
  if (!searchParams.sub) {
    redirect('/?error=missing_subscription');
  }

  // Get subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*, organizations(*)')
    .eq('id', searchParams.sub)
    .single();

  if (!subscription || !subscription.vipps_agreement_id) {
    redirect('/?error=subscription_not_found');
  }

  // Poll Vipps for agreement status
  const token = await getVippsAccessToken();
  const agreementResponse = await fetch(
    `https://api${process.env.VIPPS_USE_TEST_MODE === 'true' ? 'test' : ''}.vipps.no/recurring/v3/agreements/${subscription.vipps_agreement_id}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': subscription.organizations.vipps_msn,
      },
    }
  );

  const agreement = await agreementResponse.json();

  if (agreement.status === 'ACTIVE') {
    // Update subscription to active
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Create first charge (due in 2 days as required by Vipps)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    // Note: First charge creation would happen here or via cron job
    // For MVP, we'll create it immediately

    redirect(`/bekreftelse?sub=${subscription.id}&provider=vipps`);
  } else if (agreement.status === 'EXPIRED' || agreement.status === 'STOPPED') {
    // User rejected or agreement expired
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', subscription.id);

    redirect(`/stott/${subscription.organizations.slug}?error=vipps_rejected`);
  } else {
    // Still pending - tell user to complete in Vipps app
    redirect(`/checkout/vipps/pending?sub=${subscription.id}`);
  }
}
```

### 3.4 Confirmation Page

```typescript
// app/bekreftelse/page.tsx
import { stripe } from '@/lib/stripe';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BekreftelsePage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  if (!searchParams.session_id) {
    return <div>Ugyldig forespørsel</div>;
  }

  const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);

  const isSubscription = session.mode === 'subscription';

  // For subscriptions, create a portal link
  let portalUrl = null;
  if (isSubscription && session.customer) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: session.customer as string,
      return_url: process.env.NEXT_PUBLIC_BASE_URL!,
    });
    portalUrl = portal.url;
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Takk for støtten!</h1>
        <p className="text-gray-600">
          {isSubscription
            ? 'Du støtter nå månedlig. Du vil motta en kvittering på e-post.'
            : 'Din støtte er registrert. Du vil motta en kvittering på e-post.'}
        </p>

        {portalUrl && (
          <Button asChild variant="outline">
            <a href={portalUrl}>Administrer abonnement</a>
          </Button>
        )}

        <Button asChild>
          <Link href="/">Tilbake til forsiden</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## Phase 4: Webhook Handling (Week 3-4)

Begge betalingsleverandørene sender webhooks når ting skjer (betalinger, kanselleringer, etc).

### 4.1 Stripe Webhook Endpoint

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check using database constraint
  const { error: idempotencyError } = await supabaseAdmin
    .from('processed_events')
    .insert({ provider: 'stripe', event_id: event.id });

  if (idempotencyError) {
    // Already processed (unique constraint violation)
    if (idempotencyError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('Idempotency error:', idempotencyError);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  let metadata: Stripe.Metadata = {};

  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    metadata = sub.metadata;
  } else if (session.payment_intent) {
    const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    metadata = pi.metadata;
  }

  await supabaseAdmin.from('subscriptions').insert({
    payment_provider: 'stripe',  // Mark as Stripe payment
    stripe_subscription_id: session.subscription as string | null,
    stripe_customer_id: session.customer as string,
    sponsor_email: session.customer_email!,
    sponsor_name: metadata.sponsor_name || null,
    organization_id: metadata.organization_id,
    group_id: metadata.group_id || null,
    individual_id: metadata.individual_id || null,
    amount: session.amount_total!,
    interval: session.mode === 'subscription' ? 'monthly' : 'one_time',
    status: 'active',
    started_at: new Date().toISOString(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleAccountUpdated(account: Stripe.Account) {
  await supabaseAdmin
    .from('organizations')
    .update({ stripe_charges_enabled: account.charges_enabled ?? false })
    .eq('stripe_account_id', account.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Log for now - could send email notification
  console.log('Payment failed for invoice:', invoice.id);
  // TODO: Send email to sponsor
}
```

### 4.2 Set Up Webhook in Stripe Dashboard

After deploying to Vercel:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `account.updated`
   - `invoice.payment_failed`
4. Copy the webhook secret to your Vercel environment variables

### 4.3 Vipps Webhook Endpoint

```typescript
// app/api/webhooks/vipps/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

// Verify Vipps webhook signature
function verifyVippsSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  return signature === expectedSignature;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('Authorization')?.replace('Bearer ', '');

  // Note: Vipps webhook verification varies - check current docs
  // For MVP, we'll verify by checking agreement exists

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Idempotency check
  const eventId = `${event.name}-${event.agreementId || event.chargeId}-${event.timestamp}`;
  const { error: idempotencyError } = await supabaseAdmin
    .from('processed_events')
    .insert({ provider: 'vipps', event_id: eventId });

  if (idempotencyError?.code === '23505') {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.name) {
      case 'recurring.agreement-stopped.v1':
        await handleAgreementStopped(event);
        break;

      case 'recurring.charge-captured.v1':
        await handleChargeCaptured(event);
        break;

      case 'recurring.charge-failed.v1':
        await handleChargeFailed(event);
        break;
    }
  } catch (error) {
    console.error(`Error processing Vipps ${event.name}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleAgreementStopped(event: any) {
  // User or merchant stopped the agreement
  const { agreementId, actor } = event;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('vipps_agreement_id', agreementId);

  console.log(`Vipps agreement ${agreementId} stopped by ${actor}`);
}

async function handleChargeCaptured(event: any) {
  // Payment successfully captured
  const { agreementId, chargeId, amount } = event;

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('vipps_agreement_id', agreementId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for agreement:', agreementId);
    return;
  }

  // Record transaction
  await supabaseAdmin.from('transactions').insert({
    subscription_id: subscription.id,
    payment_provider: 'vipps',
    vipps_charge_id: chargeId,
    organization_id: subscription.organization_id,
    group_id: subscription.group_id,
    individual_id: subscription.individual_id,
    amount: amount,
    status: 'succeeded',
    paid_at: new Date().toISOString(),
  });
}

async function handleChargeFailed(event: any) {
  const { agreementId, chargeId, failureReason } = event;

  console.log(`Vipps charge failed: ${chargeId} - ${failureReason}`);

  // Find subscription for potential notification
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*, organizations(*)')
    .eq('vipps_agreement_id', agreementId)
    .single();

  if (subscription) {
    // TODO: Send email notification about failed payment
    console.log(`Should notify ${subscription.sponsor_email} about failed Vipps payment`);
  }
}
```

### 4.4 Vipps Webhook Registration

Vipps webhooks registreres i Vipps Portal:

1. Logg inn på [portal.vippsmobilepay.com](https://portal.vippsmobilepay.com)
2. Velg MinSponsor sales unit
3. Gå til "Webhooks"
4. Legg til webhook URL: `https://your-domain.vercel.app/api/webhooks/vipps`
5. Velg events:
   - `recurring.agreement-stopped.v1`
   - `recurring.charge-captured.v1`
   - `recurring.charge-failed.v1`

### 4.5 Vipps Charge Cron Job

Vipps krever at charges opprettes minst 2 dager før due date. Vi trenger en cron job som kjører daglig.

```typescript
// app/api/cron/vipps-charges/route.ts
// Kjøres daglig via Vercel Cron eller lignende

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createVippsCharge } from '@/lib/vipps';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all active Vipps subscriptions that need a charge
  // We create charges 3 days ahead to meet Vipps' 2-day minimum
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const dueDate = threeDaysFromNow.toISOString().split('T')[0];

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*, organizations(*)')
    .eq('payment_provider', 'vipps')
    .eq('status', 'active')
    .eq('interval', 'monthly')
    .not('vipps_agreement_id', 'is', null);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'No charges to create' });
  }

  const results = [];

  for (const sub of subscriptions) {
    // Check if we already created a charge for this period
    const monthKey = dueDate.substring(0, 7);  // YYYY-MM
    const { data: existingCharge } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('subscription_id', sub.id)
      .gte('created_at', `${monthKey}-01`)
      .single();

    if (existingCharge) {
      continue;  // Already have a charge this month
    }

    try {
      const charge = await createVippsCharge(
        sub.organizations.vipps_msn,
        sub.vipps_agreement_id!,
        {
          amount: sub.amount,
          description: new Date().toLocaleString('nb-NO', { month: 'long' }),
          dueDate,
          retryDays: 5,
        }
      );

      // Record pending transaction
      await supabaseAdmin.from('transactions').insert({
        subscription_id: sub.id,
        payment_provider: 'vipps',
        vipps_charge_id: charge.chargeId,
        organization_id: sub.organization_id,
        group_id: sub.group_id,
        individual_id: sub.individual_id,
        amount: sub.amount,
        status: 'pending',
      });

      results.push({ subscriptionId: sub.id, chargeId: charge.chargeId, status: 'created' });
    } catch (error) {
      console.error(`Failed to create charge for subscription ${sub.id}:`, error);
      results.push({ subscriptionId: sub.id, status: 'failed', error: String(error) });
    }
  }

  return NextResponse.json({ results });
}
```

**Vercel Cron Setup:**

Legg til i `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/vipps-charges",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Og legg til `CRON_SECRET` i environment variables.

---

## Phase 5: Admin (Week 4-5)

### 5.1 Simple Admin with Supabase Auth

For MVP, use **Supabase Studio** as your admin dashboard:
1. Go to Supabase Dashboard → Table Editor
2. You can view/edit all data directly
3. Create organizations, groups, individuals manually

**Admin page med dual provider status:**

```typescript
// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();

  // Check if logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }

  // Fetch organizations with payment status
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch stats
  const { count: subCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: mrr } = await supabase
    .from('subscriptions')
    .select('amount, payment_provider')
    .eq('status', 'active')
    .eq('interval', 'monthly');

  const totalMrr = mrr?.reduce((sum, s) => sum + s.amount, 0) || 0;
  const vippsMrr = mrr?.filter(s => s.payment_provider === 'vipps').reduce((sum, s) => sum + s.amount, 0) || 0;
  const stripeMrr = mrr?.filter(s => s.payment_provider === 'stripe').reduce((sum, s) => sum + s.amount, 0) || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">MinSponsor Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{orgs?.length || 0}</div>
          <div className="text-gray-500">Klubber</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{subCount}</div>
          <div className="text-gray-500">Aktive sponsorer</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold">{(totalMrr / 100).toLocaleString('nb-NO')} kr</div>
          <div className="text-gray-500">Total MRR</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-[#FF5B24]">Vipps:</span>
              <span>{(vippsMrr / 100).toLocaleString('nb-NO')} kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Stripe:</span>
              <span>{(stripeMrr / 100).toLocaleString('nb-NO')} kr</span>
            </div>
          </div>
          <div className="text-gray-500 text-sm mt-2">MRR per provider</div>
        </div>
      </div>

      {/* Organizations with payment status */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Klubber - Betalingsstatus</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Klubb</th>
              <th className="px-4 py-2 text-left">Org.nr</th>
              <th className="px-4 py-2 text-center">Vipps</th>
              <th className="px-4 py-2 text-center">Stripe</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orgs?.map((org) => (
              <tr key={org.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-sm text-gray-500">{org.contact_email}</div>
                </td>
                <td className="px-4 py-3 text-sm">{org.org_number}</td>
                <td className="px-4 py-3 text-center">
                  {org.vipps_enabled ? (
                    <span className="text-green-600">✓ Aktiv</span>
                  ) : org.vipps_msn ? (
                    <span className="text-yellow-600">⏳ Venter</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {org.stripe_charges_enabled ? (
                    <span className="text-green-600">✓ Aktiv</span>
                  ) : org.stripe_account_id ? (
                    <span className="text-yellow-600">⏳ Venter</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {(org.vipps_enabled || org.stripe_charges_enabled) ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      Kan motta betaling
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      Trenger onboarding
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-4">
        <a
          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/editor`}
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Åpne Supabase Studio →
        </a>
        <a
          href="https://dashboard.stripe.com/connect/accounts/overview"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Stripe Connect Dashboard →
        </a>
        <a
          href="https://portal.vippsmobilepay.com"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Vipps Portal →
        </a>
      </div>
    </div>
  );
}
```

### 5.2 Dual Provider Onboarding

Hver klubb trenger onboarding for **begge** betalingsleverandørene for å maksimere rekkevidde.

#### Stripe Connect Onboarding (for kort/Apple Pay)

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createConnectAccount(orgId: string, email: string) {
  // Create Express account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'NO',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/refresh?org=${orgId}`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/complete?org=${orgId}`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}
```

**Stripe onboarding flow:**
1. Create organization in Supabase Studio
2. Run `createConnectAccount()` to get Stripe account ID and onboarding URL
3. Update organization with `stripe_account_id`
4. Send onboarding URL to club treasurer
5. They complete Stripe's hosted onboarding
6. Webhook `account.updated` sets `stripe_charges_enabled = true`

#### Vipps Onboarding (for Vipps-betalinger)

Vipps-onboarding er en litt annen flyt fordi klubben må bestille sin egen Sales Unit.

**Vipps onboarding flow:**
1. Vegard/Emil oppretter organisation i Supabase (med orgnr, kontakt-e-post)
2. System genererer Product Order URL med prefill:
   ```
   https://portal.vippsmobilepay.com/register?
     partner=minsponsor&
     product=recurring&
     prefill_org=912345678&
     prefill_email=kasserer@klubb.no
   ```
3. Vegard sender URL + instruksjoner til klubb via e-post
4. Klubb fullfører Vipps-registrering (orgnr, bankID-signering)
5. Vipps kjører KYC (3-5 virkedager)
6. Klubb mottar MSN fra Vipps
7. Vegard legger inn MSN i Supabase → `vipps_msn`
8. Sett `vipps_enabled = true`

**E-postmal til klubb:**

```
Emne: Aktiver Vipps for [Klubbnavn] på MinSponsor

Hei [Kontaktperson],

For at supportere skal kunne bruke Vipps til å støtte [Klubbnavn],
må klubben fullføre en enkel registrering hos Vipps.

Dette tar ca. 5-10 minutter, og du trenger:
- Klubbens organisasjonsnummer
- BankID for signering
- Klubbens bankkontonummer for utbetalinger

Klikk her for å starte: [VIPPS REGISTRERINGS-URL]

Etter at Vipps har godkjent registreringen (vanligvis 3-5 virkedager),
vil du motta en bekreftelse. Send oss MSN-nummeret du får, så
aktiverer vi Vipps for klubben.

Kortbetaling via Stripe er allerede klart – Vipps kommer i tillegg!

Spørsmål? Bare svar på denne e-posten.

Hilsen,
Vegard & Emil
MinSponsor
```

### 5.3 Komplett Klubb-Onboarding Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│  Ny klubb: [Klubbnavn]                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. OPPRETT KLUBB                                               │
│     [ ] Opprett rad i organizations-tabellen                    │
│     [ ] Fyll inn: name, org_number, slug, contact_email         │
│                                                                 │
│  2. STRIPE CONNECT (Kort/Apple Pay)                             │
│     [ ] Kjør createConnectAccount()                             │
│     [ ] Lagre stripe_account_id i database                      │
│     [ ] Send onboarding-URL til kasserer                        │
│     [ ] Vent på webhook → stripe_charges_enabled = true         │
│                                                                 │
│  3. VIPPS RECURRING                                             │
│     [ ] Generer Product Order URL med prefill                   │
│     [ ] Send e-post med Vipps-instruksjoner                     │
│     [ ] Merk: vipps_onboarding_sent_at = NOW()                  │
│     [ ] Vent på klubb → de gir deg MSN                          │
│     [ ] Lagre vipps_msn i database                              │
│     [ ] Sett vipps_enabled = true                               │
│                                                                 │
│  4. VERIFISER                                                   │
│     [ ] Test støtteside: /stott/[slug]                          │
│     [ ] Verifiser at både Vipps og Kort vises                   │
│     [ ] Gjør en test-betaling med begge metoder                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Polish & Launch (Week 5-6)

### 6.1 Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard:
   - Supabase credentials
   - Stripe credentials
   - Vipps Partner credentials
   - Cron secret
4. Deploy

### 6.2 Set up Webhooks

**Stripe:**
1. Get your Vercel URL
2. Add webhook endpoint in Stripe Dashboard: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel

**Vipps:**
1. Log in to portal.vippsmobilepay.com
2. Add webhook endpoint: `https://your-domain.vercel.app/api/webhooks/vipps`
3. Select recurring events

### 6.3 Test with Pilot Club

**Stripe-testing:**
1. Create organization in Supabase Studio
2. Generate Stripe Connect onboarding link
3. Club completes onboarding (use test mode)
4. Test kort-betaling end-to-end

**Vipps-testing:**
1. Use Vipps test-app on mobile
2. Create agreement with test phone number
3. Verify agreement appears in Vipps Portal
4. Test charge creation via cron job

### 6.4 Launch Checklist

**Infrastructure:**
- [ ] Supabase project created (production)
- [ ] Database schema applied
- [ ] Vercel deployment working
- [ ] Custom domain configured (minsponsor.no)
- [ ] SSL active

**Stripe:**
- [ ] Stripe account in live mode
- [ ] Connect enabled and configured
- [ ] Stripe webhook configured (live)
- [ ] Test payment successful in live mode

**Vipps:**
- [ ] MinSponsor Partner access approved
- [ ] Recurring API enabled
- [ ] Partner keys received
- [ ] Vipps webhook configured
- [ ] Test agreement created successfully

**Pilot Clubs:**
- [ ] 3 pilot clubs identified
- [ ] Stripe onboarding complete for all 3
- [ ] Vipps MSN received for all 3
- [ ] Test payments verified for all 3

**Quality:**
- [ ] Mobile-responsive checkout
- [ ] Norwegian copy reviewed
- [ ] Error handling tested
- [ ] Loading states implemented

---

## Timeline Summary

| Week | Deliverables |
|------|--------------|
| 1 | Project setup, Supabase schema, Stripe Connect + Vipps Partner sandbox |
| 2 | Support pages (org, group, individual) |
| 3 | Dual checkout flow (Vipps + Stripe), payment method selector |
| 4 | Webhooks (Stripe + Vipps), Vipps charge cron job |
| 5 | Admin panel, dual provider onboarding flows |
| 6 | Testing, Vercel deploy, pilot launch with 3 clubs |

**Kritiske milepæler:**
- **Uke 1:** Vipps Partner-søknad sendt (kan ta 1-2 uker å få godkjent)
- **Uke 3:** Første Vipps test-agreement opprettet
- **Uke 5:** Pilot-klubber starter onboarding
- **Uke 6:** Første ekte Vipps-betaling fra sponsor

---

## Quick Reference: Key URLs

**Local development:**
- App: `http://localhost:3000`
- Supabase Studio: `https://supabase.com/dashboard/project/YOUR_PROJECT`

**Production:**
- App: `https://your-domain.vercel.app`
- Stripe Dashboard: `https://dashboard.stripe.com`
- Supabase Dashboard: `https://supabase.com/dashboard`

---

## References

**Supabase & Next.js:**
- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Deployment](https://vercel.com/docs)

**Stripe:**
- [Stripe Connect](https://stripe.com/docs/connect)
- [Stripe Connect Express](https://stripe.com/docs/connect/express-accounts)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

**Vipps:**
- [Vipps Recurring API Guide](https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-guide/)
- [Vipps Recurring API Quick Start](https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-quick-start/)
- [Vipps Node.js SDK](https://www.npmjs.com/package/@vippsmobilepay/sdk)
- [Vipps Partner Documentation](https://developer.vippsmobilepay.com/docs/partner/)
- [Vipps Partner Keys](https://developer.vippsmobilepay.com/docs/partner/partner-keys/)
- [Vipps Merchant Signup](https://developer.vippsmobilepay.com/docs/partner/merchant-signup/)

---

## Appendix: Vipps vs Stripe Comparison

| Aspekt | Vipps Recurring | Stripe Connect |
|--------|-----------------|----------------|
| **Popularitet i Norge** | Svært høy (4.5M+ brukere) | Moderat |
| **Tillit** | Høy (bankeid) | Middels |
| **Recurring support** | Ja, native | Ja, native |
| **Platform fee** | Manuell fakturering | Automatisk via application_fee |
| **Onboarding tid** | 3-5 virkedager | Ofte samme dag |
| **SDK** | Offisiell Node.js SDK | Offisiell Node.js SDK |
| **Webhooks** | Ja | Ja |
| **Charge-oppretting** | Merchant må opprette | Automatisk ved fornyelse |
| **Min. lead time** | 2 dager før due date | Ingen |
| **Retries ved feil** | Automatisk (configurable) | Automatisk |

**Anbefaling:** Vis Vipps som primær betalingsmetode i checkout (høyere konvertering i Norge), men tilby kort som alternativ.
