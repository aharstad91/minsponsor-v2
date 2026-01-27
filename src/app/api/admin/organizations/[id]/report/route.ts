import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Organization, Subscription, Transaction } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export interface ReportData {
  organization: Organization;
  stats: {
    activeSponsors: number;
    mrr: number;
    allTimeTotal: number;
    allTimePlatformFee: number;
  };
  byProvider: {
    vipps: { mrr: number; count: number };
    stripe: { mrr: number; count: number };
  };
  byGroup: {
    groupId: string | null;
    groupName: string;
    mrr: number;
    sponsorCount: number;
  }[];
  recentTransactions: (Transaction & {
    subscription: Pick<Subscription, 'sponsor_email' | 'sponsor_name'> | null;
  })[];
}

// GET /api/admin/organizations/[id]/report - Get report data for organization
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    // Fetch organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
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

    const reportData: ReportData = {
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

    return NextResponse.json(reportData);
  } catch (err) {
    console.error('Error in GET /api/admin/organizations/[id]/report:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
