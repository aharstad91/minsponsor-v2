// Database types for MinSponsor
// Auto-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type PaymentProvider = 'stripe' | 'vipps';

export type OrganizationStatus = 'active' | 'pending' | 'suspended';
export type EntityStatus = 'active' | 'inactive';
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'completed' | 'expired';
export type SubscriptionInterval = 'monthly' | 'one_time';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

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
  // Stripe Connect
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  // Vipps Recurring
  vipps_msn: string | null;
  vipps_enabled: boolean;
  vipps_onboarding_sent_at: string | null;
  // Onboarding tracking (manual verification steps)
  test_payment_verified_at: string | null;
  went_live_at: string | null;
  // General
  suggested_amounts: number[];
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: EntityStatus;
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
  status: EntityStatus;
  created_at: string;
  updated_at: string;
};

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
  interval: SubscriptionInterval;
  status: SubscriptionStatus;
  started_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  subscription_id: string;
  payment_provider: PaymentProvider;
  stripe_charge_id: string | null;
  vipps_charge_id: string | null;
  organization_id: string;
  group_id: string | null;
  individual_id: string | null;
  amount: number;
  platform_fee: number; // Fee in øre, added on top of donation
  status: TransactionStatus;
  paid_at: string | null;
  created_at: string;
};

export type ProcessedEvent = {
  id: string;
  provider: PaymentProvider;
  event_id: string;
  created_at: string;
};

export type ReportShare = {
  id: string;
  organization_id: string;
  token: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
};

// Helper functions
export function canAcceptPayments(org: Organization): boolean {
  return org.stripe_charges_enabled || org.vipps_enabled;
}

export function getAvailablePaymentMethods(org: Organization): PaymentProvider[] {
  const methods: PaymentProvider[] = [];
  if (org.vipps_enabled) methods.push('vipps'); // Vipps first (primary for Norway)
  if (org.stripe_charges_enabled) methods.push('stripe');
  return methods;
}

// Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Group, 'id' | 'created_at'>>;
      };
      individuals: {
        Row: Individual;
        Insert: Omit<Individual, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Individual, 'id' | 'created_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      processed_events: {
        Row: ProcessedEvent;
        Insert: Omit<ProcessedEvent, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
      report_shares: {
        Row: ReportShare;
        Insert: Omit<ReportShare, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ReportShare, 'id' | 'created_at'>>;
      };
    };
  };
};
