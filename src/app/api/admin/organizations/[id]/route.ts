import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { organizationUpdateSchema, generateSlug } from '@/lib/validations';
import type { Organization } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/organizations/[id] - Get organization details
export async function GET(request: NextRequest, { params }: RouteParams) {
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
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !org) {
    return NextResponse.json(
      { error: 'Organisasjon ikke funnet' },
      { status: 404 }
    );
  }

  // Get group count
  const { count: groupCount } = await supabaseAdmin
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .eq('status', 'active');

  // Get individual count
  const { count: individualCount } = await supabaseAdmin
    .from('individuals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .eq('status', 'active');

  // Get active subscription count
  const { count: subscriptionCount } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .eq('status', 'active');

  return NextResponse.json({
    organization: org as Organization,
    stats: {
      groupCount: groupCount || 0,
      individualCount: individualCount || 0,
      subscriptionCount: subscriptionCount || 0,
    },
  });
}

// PUT /api/admin/organizations/[id] - Update organization
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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
    const validationResult = organizationUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Check if organization exists
    const { data: existingOrg, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingOrg) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
    }

    // If name changed, update slug
    let newSlug = existingOrg.slug;
    if (input.name && input.name !== existingOrg.name) {
      newSlug = generateSlug(input.name);

      // Check if new slug exists
      const { data: slugConflict } = await supabaseAdmin
        .from('organizations')
        .select('slug')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
    }

    // Update organization
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .update({
        ...input,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Kunne ikke oppdatere organisasjon' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: org as Organization });
  } catch (err) {
    console.error('Error in PUT /api/admin/organizations/[id]:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id] - Delete organization (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  // Check for active subscriptions
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .eq('status', 'active');

  if (activeSubscriptions && activeSubscriptions > 0) {
    return NextResponse.json(
      {
        error: `Kan ikke slette organisasjon med ${activeSubscriptions} aktive abonnementer. Kanseller abonnementene først.`,
      },
      { status: 400 }
    );
  }

  // Soft delete (set status to suspended)
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Kunne ikke slette organisasjon' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
