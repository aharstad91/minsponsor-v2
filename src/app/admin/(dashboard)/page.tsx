import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Organization, Subscription } from '@/lib/database.types';
import { OrgSelector } from '@/components/admin/org-selector';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Prepare orgs for selector
  const orgsForSelector = orgs?.map((o) => ({
    id: o.id,
    name: o.name,
    logo_url: o.logo_url,
    slug: o.slug,
  })) || [];

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Oversikt over MinSponsor</p>
        </div>
        <div className="w-64">
          <OrgSelector organizations={orgsForSelector} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">{orgs?.length || 0}</div>
          <div className="text-muted-foreground text-sm">Klubber totalt</div>
          <div className="text-xs text-muted-foreground/60 mt-1">
            {orgsActive} kan motta betaling
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">{activeSubCount}</div>
          <div className="text-muted-foreground text-sm">Aktive sponsorer</div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold">
            {(totalMrr / 100).toLocaleString('nb-NO')} kr
          </div>
          <div className="text-muted-foreground text-sm">Total MRR</div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm">
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
          <div className="text-muted-foreground text-xs mt-2">MRR per provider</div>
        </div>
      </div>

      {/* Organizations table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b">
          <CardTitle>Klubber - Betalingsstatus</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Klubb</TableHead>
                <TableHead className="px-4">Org.nr</TableHead>
                <TableHead className="px-4 text-center">Vipps</TableHead>
                <TableHead className="px-4 text-center">Stripe</TableHead>
                <TableHead className="px-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs?.slice(0, 5).map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/admin/org/${org.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {org.contact_email}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono">
                    {org.org_number}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    {org.vipps_enabled ? (
                      <Badge variant="success">✓ Aktiv</Badge>
                    ) : org.vipps_msn ? (
                      <Badge variant="warning">Venter</Badge>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    {org.stripe_charges_enabled ? (
                      <Badge variant="success">✓ Aktiv</Badge>
                    ) : org.stripe_account_id ? (
                      <Badge variant="warning">Venter</Badge>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {org.vipps_enabled || org.stripe_charges_enabled ? (
                      <Badge variant="success">Kan motta betaling</Badge>
                    ) : (
                      <Badge variant="warning">Trenger onboarding</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!orgs || orgs.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Ingen klubber registrert ennå.{' '}
                    <Link
                      href="/admin/organizations/new"
                      className="text-blue-600 hover:underline"
                    >
                      Opprett den første
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-4">
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
