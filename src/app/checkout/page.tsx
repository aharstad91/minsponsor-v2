import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout-form';
import { canAcceptPayments } from '@/lib/database.types';
import type { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ org?: string; group?: string; individual?: string }>;
};

export const metadata: Metadata = {
  title: 'Utsjekk | MinSponsor',
  description: 'Fullfør din sponsing',
};

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  if (!params.org) {
    redirect('/');
  }

  // Fetch organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.org)
    .eq('status', 'active')
    .single();

  if (!org || !canAcceptPayments(org)) {
    redirect('/');
  }

  // Fetch group if specified
  let group = null;
  if (params.group) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('id', params.group)
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .single();
    group = data;
  }

  // Fetch individual if specified
  let individual = null;
  if (params.individual) {
    const { data } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', params.individual)
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .single();
    individual = data;
  }

  return (
    <CheckoutForm organization={org} group={group} individual={individual} />
  );
}
