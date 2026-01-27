import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Organization, Subscription, Transaction } from '@/lib/database.types';
import { ReportClient } from './report-client';
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
    title: org ? `Rapport: ${org.name} | MinSponsor Admin` : 'Rapport | MinSponsor Admin',
  };
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params;

  // Fetch organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (orgError || !org) {
    notFound();
  }

  // Fetch active subscriptions
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('organization_id', id)
    .eq('status', 'active')
    .eq('interval', 'monthly');

  const activeSponsors = subscriptions?.length || 0;
  const mrr = subscriptions?.reduce((sum, s) => sum + s.amount, 0) || 0;

  // By provider
  const vippsSubscriptions = subscriptions?.filter(s => s.payment_provider === 'vipps') || [];
  const stripeSubscriptions = subscriptions?.filter(s => s.payment_provider === 'stripe') || [];

  // Fetch groups for names
  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('id, name')
    .eq('organization_id', id);

  const groupMap = new Map(groups?.map(g => [g.id, g.name]) || []);

  // By group
  const groupStats = new Map<string | null, { mrr: number; count: number }>();
  subscriptions?.forEach(s => {
    const key = s.group_id;
    const existing = groupStats.get(key) || { mrr: 0, count: 0 };
    groupStats.set(key, {
      mrr: existing.mrr + s.amount,
      count: existing.count + 1,
    });
  });

  const byGroup = Array.from(groupStats.entries()).map(([groupId, stats]) => ({
    groupId,
    groupName: groupId ? (groupMap.get(groupId) || 'Ukjent gruppe') : 'Generell støtte',
    mrr: stats.mrr,
    sponsorCount: stats.count,
  })).sort((a, b) => b.mrr - a.mrr);

  // Fetch all-time transaction totals
  const { data: allTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, platform_fee')
    .eq('organization_id', id)
    .eq('status', 'succeeded');

  const allTimeTotal = allTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const allTimePlatformFee = allTransactions?.reduce((sum, t) => sum + (t.platform_fee || 0), 0) || 0;

  // Fetch recent transactions
  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      subscription:subscriptions(sponsor_email, sponsor_name)
    `)
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const reportData = {
    organization: org as Organization,
    stats: {
      activeSponsors,
      mrr,
      allTimeTotal,
      allTimePlatformFee,
    },
    byProvider: {
      vipps: {
        mrr: vippsSubscriptions.reduce((sum, s) => sum + s.amount, 0),
        count: vippsSubscriptions.length,
      },
      stripe: {
        mrr: stripeSubscriptions.reduce((sum, s) => sum + s.amount, 0),
        count: stripeSubscriptions.length,
      },
    },
    byGroup,
    recentTransactions: recentTransactions || [],
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/admin/organizations/${id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Tilbake til {org.name}
      </Link>

      <ReportClient data={reportData} organizationId={id} isAdmin />
    </div>
  );
}
