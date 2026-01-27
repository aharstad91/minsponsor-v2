import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { organizationCreateSchema, generateSlug } from '@/lib/validations';
import { createConnectAccount } from '@/lib/stripe';
import type { Organization } from '@/lib/database.types';

// GET /api/admin/organizations - List all organizations
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  // Parse search params
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const status = searchParams.get('status');

  // Build query
  let query = supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,org_number.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente organisasjoner' },
      { status: 500 }
    );
  }

  return NextResponse.json({ organizations: data as Organization[] });
}

// POST /api/admin/organizations - Create new organization
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = organizationCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Check if org_number already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('org_number', input.org_number)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'En organisasjon med dette organisasjonsnummeret eksisterer allerede' },
        { status: 400 }
      );
    }

    // Generate slug
    let slug = generateSlug(input.name);

    // Check if slug exists and make it unique
    const { data: existingSlug } = await supabaseAdmin
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create Stripe Connect account
    let stripeAccountId: string | null = null;
    let stripeOnboardingUrl: string | null = null;

    try {
      const stripeResult = await createConnectAccount(
        'pending-org', // Will be updated after insert
        input.contact_email
      );
      stripeAccountId = stripeResult.accountId;
      stripeOnboardingUrl = stripeResult.onboardingUrl;
    } catch (stripeError) {
      console.error('Error creating Stripe account:', stripeError);
      // Continue without Stripe - they can set it up later
    }

    // Insert organization
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: input.name,
        slug,
        org_number: input.org_number,
        category: input.category,
        description: input.description || null,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone || null,
        logo_url: input.logo_url || null,
        suggested_amounts: input.suggested_amounts || [5000, 10000, 20000],
        stripe_account_id: stripeAccountId,
        stripe_charges_enabled: false,
        vipps_msn: null,
        vipps_enabled: false,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return NextResponse.json(
        { error: 'Kunne ikke opprette organisasjon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization: org as Organization,
      stripeOnboardingUrl,
    });
  } catch (err) {
    console.error('Error in POST /api/admin/organizations:', err);
    return NextResponse.json(
      { error: 'Noe gikk galt' },
      { status: 500 }
    );
  }
}
