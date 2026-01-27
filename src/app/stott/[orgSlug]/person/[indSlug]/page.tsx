import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SupportPage } from '@/components/support-page';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ orgSlug: string; indSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug, indSlug } = await params;
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

  const { data: individual } = await supabase
    .from('individuals')
    .select('first_name, last_name, bio')
    .eq('organization_id', org.id)
    .eq('slug', indSlug)
    .eq('status', 'active')
    .is('group_id', null)
    .single();

  if (!individual) {
    return { title: 'Ikke funnet' };
  }

  const fullName = `${individual.first_name} ${individual.last_name}`;
  return {
    title: `Støtt ${fullName} - ${org.name} | MinSponsor`,
    description: individual.bio || `Støtt ${fullName} via MinSponsor`,
  };
}

export default async function IndividualPage({ params }: Props) {
  const { orgSlug, indSlug } = await params;
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

  // Fetch individual (directly under org, not in a group)
  const { data: individual, error } = await supabase
    .from('individuals')
    .select('*')
    .eq('organization_id', org.id)
    .eq('slug', indSlug)
    .eq('status', 'active')
    .is('group_id', null)
    .single();

  if (error || !individual) {
    notFound();
  }

  return (
    <SupportPage
      type="individual"
      organization={org}
      individual={individual}
    />
  );
}
