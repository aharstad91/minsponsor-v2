import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Organization } from '@/lib/database.types';
import { ReportClient } from '@/app/admin/(dashboard)/organizations/[id]/report/report-client';

type Props = {
  params: Promise<{ orgId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgId } = await params;
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  return {
    title: org
      ? `Rapport: ${org.name} | MinSponsor Admin`
      : 'Rapport | MinSponsor Admin',
  };
}

export default async function ReportPage({ params }: Props) {
  const { orgId } = await params;

  // Fetch organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    notFound();
  }

  // Fetch active subscriptions
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .eq('interval', 'monthly');

  const activeSponsors = subscriptions?.length || 0;
  const mrr = subscriptions?.reduce((sum, s) => sum + s.amount, 0) || 0;

  // By provider
  const vippsSubscriptions =
    subscriptions?.filter((s) => s.payment_provider === 'vipps') || [];
  const stripeSubscriptions =
    subscriptions?.filter((s) => s.payment_provider === 'stripe') || [];

  // Fetch groups for names
  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('id, name')
    .eq('organization_id', orgId);

  const groupMap = new Map(groups?.map((g) => [g.id, g.name]) || []);

  // By group
  const groupStats = new Map<string | null, { mrr: number; count: number }>();
  subscriptions?.forEach((s) => {
    const key = s.group_id;
    const existing = groupStats.get(key) || { mrr: 0, count: 0 };
    groupStats.set(key, {
      mrr: existing.mrr + s.amount,
      count: existing.count + 1,
    });
  });

  const byGroup = Array.from(groupStats.entries())
    .map(([groupId, stats]) => ({
      groupId,
      groupName: groupId
        ? groupMap.get(groupId) || 'Ukjent gruppe'
        : 'Generell støtte',
      mrr: stats.mrr,
      sponsorCount: stats.count,
    }))
    .sort((a, b) => b.mrr - a.mrr);

  // Fetch all-time transaction totals
  const { data: allTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, platform_fee')
    .eq('organization_id', orgId)
    .eq('status', 'succeeded');

  const allTimeTotal =
    allTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const allTimePlatformFee =
    allTransactions?.reduce((sum, t) => sum + (t.platform_fee || 0), 0) || 0;

  // Fetch recent transactions
  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      *,
      subscription:subscriptions(sponsor_email, sponsor_name)
    `
    )
    .eq('organization_id', orgId)
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
    <div className="max-w-4xl">
      <ReportClient data={reportData} organizationId={orgId} isAdmin />
    </div>
  );
}
