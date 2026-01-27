import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { groupUpdateSchema, generateSlug } from '@/lib/validations';
import type { Group } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/groups/[id] - Get group details
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

  // Fetch group
  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: 'Gruppe ikke funnet' }, { status: 404 });
  }

  // Get individual count
  const { count: individualCount } = await supabaseAdmin
    .from('individuals')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', id)
    .eq('status', 'active');

  return NextResponse.json({
    group: group as Group,
    stats: {
      individualCount: individualCount || 0,
    },
  });
}

// PUT /api/admin/groups/[id] - Update group
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
    const validationResult = groupUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Check if group exists
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json({ error: 'Gruppe ikke funnet' }, { status: 404 });
    }

    // If name changed, update slug
    let newSlug = existingGroup.slug;
    if (input.name && input.name !== existingGroup.name) {
      newSlug = generateSlug(input.name);

      // Check if new slug exists within the organization
      const { data: slugConflict } = await supabaseAdmin
        .from('groups')
        .select('slug')
        .eq('organization_id', existingGroup.organization_id)
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
    }

    // Update group
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .update({
        ...input,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      return NextResponse.json(
        { error: 'Kunne ikke oppdatere gruppe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group: group as Group });
  } catch (err) {
    console.error('Error in PUT /api/admin/groups/[id]:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

// DELETE /api/admin/groups/[id] - Delete group (soft delete)
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

  // Check for active subscriptions to this group
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', id)
    .eq('status', 'active');

  if (activeSubscriptions && activeSubscriptions > 0) {
    return NextResponse.json(
      {
        error: `Kan ikke slette gruppe med ${activeSubscriptions} aktive abonnementer.`,
      },
      { status: 400 }
    );
  }

  // Soft delete (set status to inactive)
  const { error } = await supabaseAdmin
    .from('groups')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Kunne ikke slette gruppe' },
      { status: 500 }
    );
  }

  // Also set individuals in this group to inactive
  await supabaseAdmin
    .from('individuals')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('group_id', id);

  return NextResponse.json({ success: true });
}
