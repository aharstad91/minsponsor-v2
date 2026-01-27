import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Organization, Subscription } from '@/lib/database.types';

export const metadata: Metadata = {
  title: 'Dashboard | MinSponsor Admin',
  description: 'MinSponsor administrasjonspanel',
};

export default async function AdminDashboardPage() {
  // Fetch organizations with payment status (use admin to bypass RLS)
  const { data: orgsData } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  const orgs = orgsData as Organization[] | null;

  // Fetch subscription stats (use admin to bypass RLS)
  const { count: activeSubCount } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: subscriptionsData } = await supabaseAdmin
    .from('subscriptions')
    .select('amount, payment_provider')
    .eq('status', 'active')
    .eq('interval', 'monthly');

  const subscriptions = subscriptionsData as Pick<
    Subscription,
    'amount' | 'payment_provider'
  >[] | null;

  const totalMrr = subscriptions?.reduce((sum, s) => sum + s.amount, 0) || 0;
  const vippsMrr =
    subscriptions
      ?.filter((s) => s.payment_provider === 'vipps')
      .reduce((sum, s) => sum + s.amount, 0) || 0;
  const stripeMrr =
    subscriptions
      ?.filter((s) => s.payment_provider === 'stripe')
      .reduce((sum, s) => sum + s.amount, 0) || 0;

  // Count organizations by payment status
  const orgsWithVipps = orgs?.filter((o) => o.vipps_enabled).length || 0;
  const orgsWithStripe = orgs?.filter((o) => o.stripe_charges_enabled).length || 0;
  const orgsActive =
    orgs?.filter((o) => o.vipps_enabled || o.stripe_charges_enabled).length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Oversikt over MinSponsor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">{orgs?.length || 0}</div>
          <div className="text-gray-500 text-sm">Klubber totalt</div>
          <div className="text-xs text-gray-400 mt-1">
            {orgsActive} kan motta betaling
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">{activeSubCount}</div>
          <div className="text-gray-500 text-sm">Aktive sponsorer</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">
            {(totalMrr / 100).toLocaleString('nb-NO')} kr
          </div>
          <div className="text-gray-500 text-sm">Total MRR</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#FF5B24] font-medium">Vipps</span>
              <span className="font-bold">
                {(vippsMrr / 100).toLocaleString('nb-NO')} kr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">Stripe</span>
              <span className="font-bold">
                {(stripeMrr / 100).toLocaleString('nb-NO')} kr
              </span>
            </div>
          </div>
          <div className="text-gray-500 text-xs mt-2">MRR per provider</div>
        </div>
      </div>

      {/* Organizations table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Klubber - Betalingsstatus</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="text-[#FF5B24]">{orgsWithVipps} Vipps</span>
              <span className="mx-2">•</span>
              <span className="text-blue-600">{orgsWithStripe} Stripe</span>
            </div>
            <Link
              href="/admin/organizations"
              className="text-sm text-blue-600 hover:underline"
            >
              Se alle →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 text-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Klubb</th>
                <th className="px-4 py-3 text-left font-medium">Org.nr</th>
                <th className="px-4 py-3 text-center font-medium">Vipps</th>
                <th className="px-4 py-3 text-center font-medium">Stripe</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orgs?.slice(0, 5).map((org) => (
                <tr key={org.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">
                        {org.contact_email}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {org.org_number}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {org.vipps_enabled ? (
                      <span className="text-green-600 font-medium">
                        ✓ Aktiv
                      </span>
                    ) : org.vipps_msn ? (
                      <span className="text-amber-600">Venter</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {org.stripe_charges_enabled ? (
                      <span className="text-green-600 font-medium">
                        ✓ Aktiv
                      </span>
                    ) : org.stripe_account_id ? (
                      <span className="text-amber-600">Venter</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {org.vipps_enabled || org.stripe_charges_enabled ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Kan motta betaling
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
                        Trenger onboarding
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(!orgs || orgs.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Ingen klubber registrert ennå.{' '}
                    <Link
                      href="/admin/organizations/new"
                      className="text-blue-600 hover:underline"
                    >
                      Opprett den første
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.supabase.studio')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          Supabase Studio →
        </a>
        <a
          href="https://dashboard.stripe.com/connect/accounts/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          Stripe Connect →
        </a>
        <a
          href="https://portal.vippsmobilepay.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          Vipps Portal →
        </a>
      </div>
    </div>
  );
}
