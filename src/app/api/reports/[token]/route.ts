import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Organization, Transaction } from '@/lib/database.types';

type RouteParams = {
  params: Promise<{ token: string }>;
};

export interface PublicReportData {
  organization: {
    name: string;
    logo_url: string | null;
    category: string;
  };
  stats: {
    activeSponsors: number;
    mrr: number;
    allTimeTotal: number;
  };
  byProvider: {
    vipps: { mrr: number; count: number };
    stripe: { mrr: number; count: number };
  };
  byGroup: {
    groupName: string;
    mrr: number;
    sponsorCount: number;
  }[];
  recentTransactions: {
    amount: number;
    payment_provider: string;
    created_at: string;
  }[];
}

// GET /api/reports/[token] - Get public report data (no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  try {
    // Find the share record
    const { data: share, error: shareError } = await supabaseAdmin
      .from('report_shares')
      .select('*')
      .eq('token', token)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Ugyldig eller utløpt rapport-lenke' },
        { status: 404 }
      );
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Denne rapport-lenken har utløpt' },
        { status: 410 }
      );
    }

    const organizationId = share.organization_id;

    // Fetch organization (limited fields for public)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('name, logo_url, category')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
    }

    // Fetch active subscriptions (no personal data)
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('amount, payment_provider, group_id')
      .eq('organization_id', organizationId)
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
      .eq('organization_id', organizationId);

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
      groupName: groupId ? (groupMap.get(groupId) || 'Ukjent gruppe') : 'Generell støtte',
      mrr: stats.mrr,
      sponsorCount: stats.count,
    })).sort((a, b) => b.mrr - a.mrr);

    // Fetch all-time transaction totals
    const { data: allTransactions } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('status', 'succeeded');

    const allTimeTotal = allTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Fetch recent transactions (no personal data, just amounts)
    const { data: recentTransactions } = await supabaseAdmin
      .from('transactions')
      .select('amount, payment_provider, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(10);

    const reportData: PublicReportData = {
      organization: org,
      stats: {
        activeSponsors,
        mrr,
        allTimeTotal,
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
      recentTransactions: recentTransactions?.map(t => ({
        amount: t.amount,
        payment_provider: t.payment_provider,
        created_at: t.created_at,
      })) || [],
    };

    return NextResponse.json(reportData);
  } catch (err) {
    console.error('Error in GET /api/reports/[token]:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
