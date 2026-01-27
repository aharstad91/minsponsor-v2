-- Platform Admin Extensions Migration
-- Adds support for financial tracking, onboarding status, and shareable reports

-- ============================================
-- 1. Add platform_fee to transactions
-- ============================================
-- Platform fee in øre (e.g., 500 = 5 kr)
-- Fee is added ON TOP of donation amount, so club receives 100%
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0;

-- ============================================
-- 2. Add onboarding tracking to organizations
-- ============================================
-- Manual verification steps (auto-steps derived from existing data)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS test_payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS went_live_at TIMESTAMPTZ;

-- ============================================
-- 3. Create report_shares table for shareable reports
-- ============================================
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policy for report_shares (admin-only access via service role)
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Performance indexes
-- ============================================
-- For finance queries - filter by status and sort by date
CREATE INDEX IF NOT EXISTS idx_transactions_status_created
  ON transactions(status, created_at DESC);

-- For organization finance queries
CREATE INDEX IF NOT EXISTS idx_transactions_org_created
  ON transactions(organization_id, created_at DESC);

-- For public report token lookup
CREATE INDEX IF NOT EXISTS idx_report_shares_token
  ON report_shares(token);

-- For finding active reports by org
CREATE INDEX IF NOT EXISTS idx_report_shares_org
  ON report_shares(organization_id);

-- ============================================
-- 5. Comments for documentation
-- ============================================
COMMENT ON COLUMN transactions.platform_fee IS 'Platform fee in øre. Added on top of donation amount.';
COMMENT ON COLUMN organizations.test_payment_verified_at IS 'When MinSponsor verified test payment works';
COMMENT ON COLUMN organizations.went_live_at IS 'When organization started accepting real payments';
COMMENT ON TABLE report_shares IS 'Shareable report tokens for organizations';
