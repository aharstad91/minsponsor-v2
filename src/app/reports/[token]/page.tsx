import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Users, TrendingUp, Wallet } from 'lucide-react';

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const { data: share } = await supabaseAdmin
    .from('report_shares')
    .select('organization_id')
    .eq('token', token)
    .single();

  if (!share) {
    return { title: 'Rapport ikke funnet' };
  }

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name')
    .eq('id', share.organization_id)
    .single();

  return {
    title: org ? `Støtterapport: ${org.name}` : 'Støtterapport',
  };
}

export default async function PublicReportPage({ params }: Props) {
  const { token } = await params;

  // Find the share record
  const { data: share, error: shareError } = await supabaseAdmin
    .from('report_shares')
    .select('*')
    .eq('token', token)
    .single();

  if (shareError || !share) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-xl font-bold mb-2">Ugyldig lenke</h1>
          <p className="text-gray-500">
            Denne rapport-lenken finnes ikke eller har blitt slettet.
          </p>
        </div>
      </div>
    );
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-xl font-bold mb-2">Lenken har utløpt</h1>
          <p className="text-gray-500">
            Denne rapport-lenken er ikke lenger gyldig. Be om en ny lenke fra organisasjonen.
          </p>
        </div>
      </div>
    );
  }

  const organizationId = share.organization_id;

  // Fetch organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('name, logo_url, category')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    notFound();
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

  // Fetch recent transactions (no personal data)
  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, payment_provider, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            {org.logo_url && (
              <Image
                src={org.logo_url}
                alt={org.name}
                width={64}
                height={64}
                className="rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="text-gray-500">Støtterapport</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">Aktive sponsorer</span>
            </div>
            <div className="text-3xl font-bold">{activeSponsors}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-sm">Månedlig inntekt</span>
            </div>
            <div className="text-3xl font-bold">
              {(mrr / 100).toLocaleString('nb-NO')} kr
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-sm">Totalt innsamlet</span>
            </div>
            <div className="text-3xl font-bold">
              {(allTimeTotal / 100).toLocaleString('nb-NO')} kr
            </div>
          </div>
        </div>

        {/* By Provider */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold mb-4">Per betalingsmetode</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#FF5B24]/10 rounded-lg">
              <div className="text-[#FF5B24] font-medium mb-1">Vipps</div>
              <div className="text-2xl font-bold">
                {(vippsSubscriptions.reduce((sum, s) => sum + s.amount, 0) / 100).toLocaleString('nb-NO')} kr/mnd
              </div>
              <div className="text-sm text-gray-500">
                {vippsSubscriptions.length} sponsorer
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-medium mb-1">Stripe</div>
              <div className="text-2xl font-bold">
                {(stripeSubscriptions.reduce((sum, s) => sum + s.amount, 0) / 100).toLocaleString('nb-NO')} kr/mnd
              </div>
              <div className="text-sm text-gray-500">
                {stripeSubscriptions.length} sponsorer
              </div>
            </div>
          </div>
        </div>

        {/* By Group */}
        {byGroup.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold mb-4">Per gruppe/lag</h2>
            <div className="space-y-3">
              {byGroup.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{group.groupName}</div>
                    <div className="text-sm text-gray-500">
                      {group.sponsorCount} sponsor{group.sponsorCount !== 1 ? 'er' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {(group.mrr / 100).toLocaleString('nb-NO')} kr/mnd
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions && recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Siste transaksjoner</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-sm">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">Beløp</th>
                  <th className="px-4 py-3 text-center font-medium">Metode</th>
                  <th className="px-4 py-3 text-left font-medium">Dato</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-right font-mono">
                      {(tx.amount / 100).toLocaleString('nb-NO')} kr
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={tx.payment_provider === 'vipps' ? 'text-[#FF5B24]' : 'text-blue-600'}>
                        {tx.payment_provider === 'vipps' ? 'Vipps' : 'Stripe'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 mt-8">
          Rapport generert av MinSponsor
        </div>
      </div>
    </div>
  );
}
