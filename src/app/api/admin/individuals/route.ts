import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { individualCreateSchema, generateSlug } from '@/lib/validations';
import type { Individual } from '@/lib/database.types';

// GET /api/admin/individuals - List individuals (optionally filtered by organization/group)
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
  const groupId = searchParams.get('group_id');

  // Build query
  let query = supabaseAdmin
    .from('individuals')
    .select('*, groups(name)')
    .eq('status', 'active')
    .order('last_name')
    .order('first_name');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching individuals:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente individer' },
      { status: 500 }
    );
  }

  return NextResponse.json({ individuals: data as (Individual & { groups: { name: string } | null })[] });
}

// POST /api/admin/individuals - Create new individual
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
    const validationResult = individualCreateSchema.safeParse(body);
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

    // If group_id provided, verify it exists and belongs to the organization
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

      if (group.organization_id !== input.organization_id) {
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

    // Generate slug from name
    const fullName = `${input.first_name} ${input.last_name}`;
    let slug = generateSlug(fullName);

    // Check if slug exists within this organization
    const { data: existingSlug } = await supabaseAdmin
      .from('individuals')
      .select('slug')
      .eq('organization_id', input.organization_id)
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Insert individual
    const { data: individual, error } = await supabaseAdmin
      .from('individuals')
      .insert({
        organization_id: input.organization_id,
        group_id: input.group_id || null,
        first_name: input.first_name,
        last_name: input.last_name,
        slug,
        birth_year: input.birth_year || null,
        bio: input.bio || null,
        photo_url: input.photo_url || null,
        consent_given_by: input.consent_given_by,
        consent_given_at: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating individual:', error);
      return NextResponse.json(
        { error: 'Kunne ikke opprette individ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ individual: individual as Individual });
  } catch (err) {
    console.error('Error in POST /api/admin/individuals:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
