-- MinSponsor Initial Schema
-- Run in Supabase SQL Editor or via Supabase CLI

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
CREATE INDEX idx_subscriptions_vipps_agreement_id ON subscriptions(vipps_agreement_id) WHERE vipps_agreement_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
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
