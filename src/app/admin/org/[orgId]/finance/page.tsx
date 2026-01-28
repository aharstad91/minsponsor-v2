import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Transaction, Subscription } from '@/lib/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      ? `Økonomi: ${org.name} | MinSponsor Admin`
      : 'Økonomi | MinSponsor Admin',
  };
}

type TransactionWithDetails = Transaction & {
  subscription: Pick<Subscription, 'id' | 'sponsor_email' | 'sponsor_name'> | null;
};

export default async function OrgFinancePage({ params }: Props) {
  const { orgId } = await params;

  // Verify org exists
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    notFound();
  }

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  // Fetch transactions for this month for this org
  const { data: monthlyTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, platform_fee, payment_provider, status')
    .eq('organization_id', orgId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  // Calculate stats
  const successfulTx =
    monthlyTransactions?.filter((t) => t.status === 'succeeded') || [];
  const totalVolume = successfulTx.reduce((sum, t) => sum + t.amount, 0);
  const vippsVolume = successfulTx
    .filter((t) => t.payment_provider === 'vipps')
    .reduce((sum, t) => sum + t.amount, 0);
  const stripeVolume = successfulTx
    .filter((t) => t.payment_provider === 'stripe')
    .reduce((sum, t) => sum + t.amount, 0);

  // Fetch all-time stats
  const { data: allTimeData } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('organization_id', orgId)
    .eq('status', 'succeeded');

  const allTimeTotal = allTimeData?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Fetch recent transactions
  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select(
      `
      *,
      subscription:subscriptions(id, sponsor_email, sponsor_name)
    `
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Økonomi</h1>
        <p className="text-gray-500">Transaksjoner og finansiell oversikt</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(totalVolume / 100).toLocaleString('nb-NO')} kr
            </div>
            <div className="text-sm text-gray-500">Denne måneden</div>
            <div className="text-xs text-gray-400 mt-1">
              {successfulTx.length} transaksjoner
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(allTimeTotal / 100).toLocaleString('nb-NO')} kr
            </div>
            <div className="text-sm text-gray-500">Totalt innsamlet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#FF5B24] font-medium">Vipps</span>
                <span className="font-bold">
                  {(vippsVolume / 100).toLocaleString('nb-NO')} kr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">Stripe</span>
                <span className="font-bold">
                  {(stripeVolume / 100).toLocaleString('nb-NO')} kr
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Per provider</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {recentTransactions?.filter((t) => t.status === 'failed').length ||
                0}
            </div>
            <div className="text-sm text-gray-500">Feilede betalinger</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksjoner</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Sponsor</th>
                    <th className="px-4 py-3 text-right font-medium">Beløp</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Dato</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(recentTransactions as TransactionWithDetails[]).map(
                    (tx) => (
                      <tr key={tx.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {tx.subscription?.sponsor_name || 'Ukjent'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tx.subscription?.sponsor_email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {(tx.amount / 100).toLocaleString('nb-NO')} kr
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              tx.payment_provider === 'vipps'
                                ? 'text-[#FF5B24]'
                                : 'text-blue-600'
                            }
                          >
                            {tx.payment_provider === 'vipps'
                              ? 'Vipps'
                              : 'Stripe'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.status === 'succeeded' ? (
                            <Badge variant="success">OK</Badge>
                          ) : tx.status === 'failed' ? (
                            <Badge variant="destructive">Feilet</Badge>
                          ) : tx.status === 'refunded' ? (
                            <Badge variant="secondary">Refundert</Badge>
                          ) : (
                            <Badge variant="secondary">Venter</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('nb-NO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              Ingen transaksjoner ennå.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
