import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SupportPage } from '@/components/support-page';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ orgSlug: string; groupSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug, groupSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single();

  if (!org) {
    return { title: 'Ikke funnet' };
  }

  const { data: group } = await supabase
    .from('groups')
    .select('name, description')
    .eq('organization_id', org.id)
    .eq('slug', groupSlug)
    .eq('status', 'active')
    .single();

  if (!group) {
    return { title: 'Ikke funnet' };
  }

  return {
    title: `Støtt ${group.name} - ${org.name} | MinSponsor`,
    description: group.description || `Støtt ${group.name} via MinSponsor`,
  };
}

export default async function GroupPage({ params }: Props) {
  const { orgSlug, groupSlug } = await params;
  const supabase = await createClient();

  // Fetch organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single();

  if (!org) {
    notFound();
  }

  // Fetch group with its individuals
  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      individuals (*)
    `)
    .eq('organization_id', org.id)
    .eq('slug', groupSlug)
    .eq('status', 'active')
    .single();

  if (error || !group) {
    notFound();
  }

  return (
    <SupportPage
      type="group"
      organization={org}
      group={group}
      individuals={group.individuals || []}
    />
  );
}
