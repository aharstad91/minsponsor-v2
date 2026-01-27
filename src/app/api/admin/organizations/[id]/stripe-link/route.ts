import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createAccountLink, createConnectAccount } from '@/lib/stripe';
import type { Organization } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/organizations/[id]/stripe-link - Generate new Stripe onboarding link
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  // Fetch organization
  const { data: org, error: fetchError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !org) {
    return NextResponse.json(
      { error: 'Organisasjon ikke funnet' },
      { status: 404 }
    );
  }

  const organization = org as Organization;

  try {
    let onboardingUrl: string;

    if (organization.stripe_account_id) {
      // Generate new link for existing account
      onboardingUrl = await createAccountLink(
        organization.stripe_account_id,
        organization.id
      );
    } else {
      // Create new Stripe Connect account
      const result = await createConnectAccount(
        organization.id,
        organization.contact_email
      );

      // Update organization with Stripe account ID
      await supabaseAdmin
        .from('organizations')
        .update({
          stripe_account_id: result.accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      onboardingUrl = result.onboardingUrl;
    }

    return NextResponse.json({ onboardingUrl });
  } catch (err) {
    console.error('Error generating Stripe link:', err);
    return NextResponse.json(
      { error: 'Kunne ikke generere Stripe-lenke' },
      { status: 500 }
    );
  }
}
