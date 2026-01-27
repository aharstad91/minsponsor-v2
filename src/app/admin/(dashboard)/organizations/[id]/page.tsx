import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Organization, Group, Individual } from '@/lib/database.types';
import { OrganizationDetails } from '@/components/admin/organization-details';
import { ChevronLeft } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: org ? `${org.name} | MinSponsor Admin` : 'Organisasjon',
  };
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch organization
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !org) {
    notFound();
  }

  const organization = org as Organization;

  // Fetch groups
  const { data: groupsData } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('organization_id', id)
    .eq('status', 'active')
    .order('name');

  const groups = (groupsData as Group[]) || [];

  // Fetch individuals
  const { data: individualsData } = await supabaseAdmin
    .from('individuals')
    .select('*')
    .eq('organization_id', id)
    .eq('status', 'active')
    .order('last_name');

  const individuals = (individualsData as Individual[]) || [];

  // Fetch subscription stats
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .eq('status', 'active');

  const { data: subscriptionData } = await supabaseAdmin
    .from('subscriptions')
    .select('amount')
    .eq('organization_id', id)
    .eq('status', 'active')
    .eq('interval', 'monthly');

  const mrr = subscriptionData?.reduce((sum, s) => sum + s.amount, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbake til organisasjoner
        </Link>
      </div>

      <OrganizationDetails
        organization={organization}
        groups={groups}
        individuals={individuals}
        stats={{
          subscriptionCount: activeSubscriptions || 0,
          mrr,
        }}
      />
    </div>
  );
}
