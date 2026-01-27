import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();

  // Search organizations by name (case-insensitive)
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, name, slug, category')
    .ilike('name', `%${query}%`)
    .eq('status', 'active')
    .limit(10);

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  // Also search groups
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      slug,
      organizations!inner(name, slug)
    `)
    .ilike('name', `%${query}%`)
    .limit(5);

  type GroupResult = {
    id: string;
    name: string;
    slug: string;
    organizations: { name: string; slug: string } | null;
  };

  const results = [
    ...(organizations || []).map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      category: org.category,
      type: 'organization' as const,
      url: `/stott/${org.slug}`,
    })),
    ...((groups as GroupResult[] | null) || []).map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      category: group.organizations?.name || '',
      type: 'group' as const,
      url: `/stott/${group.organizations?.slug}/gruppe/${group.slug}`,
    })),
  ].slice(0, 10);

  return NextResponse.json({ results });
}
