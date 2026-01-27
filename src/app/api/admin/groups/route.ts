import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { groupCreateSchema, generateSlug } from '@/lib/validations';
import type { Group } from '@/lib/database.types';

// GET /api/admin/groups - List all groups (optionally filtered by organization)
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
  const organizationId = searchParams.get('organization_id');

  // Build query
  let query = supabaseAdmin
    .from('groups')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente grupper' },
      { status: 500 }
    );
  }

  return NextResponse.json({ groups: data as Group[] });
}

// POST /api/admin/groups - Create new group
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
    const validationResult = groupCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Verify organization exists and is active
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, status')
      .eq('id', input.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
    }

    if (org.status !== 'active') {
      return NextResponse.json(
        { error: 'Organisasjonen er ikke aktiv' },
        { status: 400 }
      );
    }

    // Generate slug
    let slug = generateSlug(input.name);

    // Check if slug exists within this organization
    const { data: existingSlug } = await supabaseAdmin
      .from('groups')
      .select('slug')
      .eq('organization_id', input.organization_id)
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Insert group
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .insert({
        organization_id: input.organization_id,
        name: input.name,
        slug,
        description: input.description || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return NextResponse.json(
        { error: 'Kunne ikke opprette gruppe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group: group as Group });
  } catch (err) {
    console.error('Error in POST /api/admin/groups:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
