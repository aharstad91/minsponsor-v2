import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Transaction, Organization, Subscription } from '@/lib/database.types';
import { FinanceClient } from './finance-client';

export const metadata: Metadata = {
  title: 'Økonomi | MinSponsor Admin',
  description: 'Finansiell oversikt over MinSponsor',
};

type TransactionWithDetails = Transaction & {
  organization: Pick<Organization, 'id' | 'name'> | null;
  subscription: Pick<Subscription, 'id' | 'sponsor_email' | 'sponsor_name'> | null;
};

export default async function FinancePage() {
  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fetch transactions for this month
  const { data: monthlyTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, platform_fee, payment_provider, status')
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  // Calculate stats
  const successfulTx = monthlyTransactions?.filter(t => t.status === 'succeeded') || [];
  const totalVolume = successfulTx.reduce((sum, t) => sum + t.amount, 0);
  const totalPlatformFee = successfulTx.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
  const vippsVolume = successfulTx
    .filter(t => t.payment_provider === 'vipps')
    .reduce((sum, t) => sum + t.amount, 0);
  const stripeVolume = successfulTx
    .filter(t => t.payment_provider === 'stripe')
    .reduce((sum, t) => sum + t.amount, 0);

  // Fetch failed payments
  const { data: failedPayments } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      organization:organizations(id, name),
      subscription:subscriptions(id, sponsor_email, sponsor_name)
    `)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent transactions for initial view
  const { data: recentTransactions, count: totalCount } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      organization:organizations(id, name),
      subscription:subscriptions(id, sponsor_email, sponsor_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const stats = {
    totalVolume,
    platformFee: totalPlatformFee,
    vippsVolume,
    stripeVolume,
    transactionCount: successfulTx.length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Økonomi</h1>
        <p className="text-gray-500">Finansiell oversikt og transaksjoner</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">
            {(stats.totalVolume / 100).toLocaleString('nb-NO')} kr
          </div>
          <div className="text-gray-500 text-sm">Volum denne måneden</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.transactionCount} transaksjoner
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold text-green-600">
            {(stats.platformFee / 100).toLocaleString('nb-NO')} kr
          </div>
          <div className="text-gray-500 text-sm">Plattformgebyr tjent</div>
          <div className="text-xs text-gray-400 mt-1">
            Denne måneden
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#FF5B24] font-medium">Vipps</span>
              <span className="font-bold">
                {(stats.vippsVolume / 100).toLocaleString('nb-NO')} kr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">Stripe</span>
              <span className="font-bold">
                {(stats.stripeVolume / 100).toLocaleString('nb-NO')} kr
              </span>
            </div>
          </div>
          <div className="text-gray-500 text-xs mt-2">Volum per provider</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold text-red-600">
            {failedPayments?.length || 0}
          </div>
          <div className="text-gray-500 text-sm">Feilede betalinger</div>
          <div className="text-xs text-gray-400 mt-1">
            Trenger oppfølging
          </div>
        </div>
      </div>

      {/* Failed Payments Section */}
      {failedPayments && failedPayments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg mb-8">
          <div className="p-4 border-b border-red-200">
            <h2 className="font-semibold text-red-800">
              Feilede betalinger ({failedPayments.length})
            </h2>
            <p className="text-sm text-red-600">
              Disse betalingene feilet og kan trenge oppfølging
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-100 text-sm">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-red-800">Sponsor</th>
                  <th className="px-4 py-3 text-left font-medium text-red-800">Organisasjon</th>
                  <th className="px-4 py-3 text-right font-medium text-red-800">Beløp</th>
                  <th className="px-4 py-3 text-left font-medium text-red-800">Provider</th>
                  <th className="px-4 py-3 text-left font-medium text-red-800">Dato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {(failedPayments as TransactionWithDetails[]).map((tx) => (
                  <tr key={tx.id} className="hover:bg-red-100/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{tx.subscription?.sponsor_name || 'Ukjent'}</div>
                      <div className="text-sm text-red-600">{tx.subscription?.sponsor_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {tx.organization ? (
                        <Link
                          href={`/admin/organizations/${tx.organization.id}`}
                          className="hover:underline text-red-800"
                        >
                          {tx.organization.name}
                        </Link>
                      ) : (
                        <span className="text-red-400">Ukjent</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {(tx.amount / 100).toLocaleString('nb-NO')} kr
                    </td>
                    <td className="px-4 py-3">
                      <span className={tx.payment_provider === 'vipps' ? 'text-[#FF5B24]' : 'text-blue-600'}>
                        {tx.payment_provider === 'vipps' ? 'Vipps' : 'Stripe'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {new Date(tx.created_at).toLocaleDateString('nb-NO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Transactions */}
      <FinanceClient
        initialTransactions={recentTransactions as TransactionWithDetails[] || []}
        totalCount={totalCount || 0}
      />
    </div>
  );
}
