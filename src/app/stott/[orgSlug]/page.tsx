import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SupportPage } from '@/components/support-page';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('name, description')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single();

  if (!org) {
    return { title: 'Ikke funnet' };
  }

  return {
    title: `Støtt ${org.name} | MinSponsor`,
    description: org.description || `Støtt ${org.name} via MinSponsor`,
  };
}

export default async function OrganizationPage({ params }: Props) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  // Fetch organization with groups and direct individuals (not in a group)
  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      *,
      groups (*),
      individuals (*)
    `)
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single();

  if (error || !org) {
    notFound();
  }

  // Filter to only direct individuals (not in a group)
  const directIndividuals = org.individuals?.filter(
    (i: { group_id: string | null }) => !i.group_id
  ) || [];

  return (
    <SupportPage
      type="organization"
      organization={org}
      groups={org.groups || []}
      individuals={directIndividuals}
    />
  );
}
