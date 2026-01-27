import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { individualUpdateSchema, generateSlug } from '@/lib/validations';
import type { Individual } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/individuals/[id] - Get individual details
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

  // Fetch individual with group info
  const { data: individual, error } = await supabaseAdmin
    .from('individuals')
    .select('*, groups(id, name)')
    .eq('id', id)
    .single();

  if (error || !individual) {
    return NextResponse.json({ error: 'Individ ikke funnet' }, { status: 404 });
  }

  // Get subscription stats
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('individual_id', id)
    .eq('status', 'active');

  const { data: mrrData } = await supabaseAdmin
    .from('subscriptions')
    .select('amount')
    .eq('individual_id', id)
    .eq('status', 'active');

  const totalMRR = mrrData?.reduce((sum, s) => sum + s.amount, 0) || 0;

  return NextResponse.json({
    individual: individual as Individual & { groups: { id: string; name: string } | null },
    stats: {
      activeSubscriptions: activeSubscriptions || 0,
      totalMRR,
    },
  });
}

// PUT /api/admin/individuals/[id] - Update individual
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
    const validationResult = individualUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Check if individual exists
    const { data: existingIndividual, error: fetchError } = await supabaseAdmin
      .from('individuals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingIndividual) {
      return NextResponse.json({ error: 'Individ ikke funnet' }, { status: 404 });
    }

    // If group_id provided, verify it exists and belongs to the same organization
    if (input.group_id) {
      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .select('id, organization_id, status')
        .eq('id', input.group_id)
        .single();

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Gruppe ikke funnet' },
          { status: 404 }
        );
      }

      if (group.organization_id !== existingIndividual.organization_id) {
        return NextResponse.json(
          { error: 'Gruppen tilhører ikke denne organisasjonen' },
          { status: 400 }
        );
      }

      if (group.status !== 'active') {
        return NextResponse.json(
          { error: 'Gruppen er ikke aktiv' },
          { status: 400 }
        );
      }
    }

    // If name changed, update slug
    let newSlug = existingIndividual.slug;
    const firstName = input.first_name || existingIndividual.first_name;
    const lastName = input.last_name || existingIndividual.last_name;

    if (
      (input.first_name && input.first_name !== existingIndividual.first_name) ||
      (input.last_name && input.last_name !== existingIndividual.last_name)
    ) {
      const fullName = `${firstName} ${lastName}`;
      newSlug = generateSlug(fullName);

      // Check if new slug exists within the organization
      const { data: slugConflict } = await supabaseAdmin
        .from('individuals')
        .select('slug')
        .eq('organization_id', existingIndividual.organization_id)
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
    }

    // Update individual
    const { data: individual, error } = await supabaseAdmin
      .from('individuals')
      .update({
        ...input,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating individual:', error);
      return NextResponse.json(
        { error: 'Kunne ikke oppdatere individ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ individual: individual as Individual });
  } catch (err) {
    console.error('Error in PUT /api/admin/individuals/[id]:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

// DELETE /api/admin/individuals/[id] - Delete individual (soft delete)
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

  // Check for active subscriptions to this individual
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('individual_id', id)
    .eq('status', 'active');

  if (activeSubscriptions && activeSubscriptions > 0) {
    return NextResponse.json(
      {
        error: `Kan ikke slette individ med ${activeSubscriptions} aktive abonnementer.`,
      },
      { status: 400 }
    );
  }

  // Soft delete (set status to inactive)
  const { error } = await supabaseAdmin
    .from('individuals')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error deleting individual:', error);
    return NextResponse.json(
      { error: 'Kunne ikke slette individ' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
