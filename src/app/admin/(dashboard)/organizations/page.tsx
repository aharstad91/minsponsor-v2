import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Organization } from '@/lib/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Organisasjoner | MinSponsor Admin',
};

export default async function OrganizationsPage() {
  const { data: orgsData } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  const organizations = (orgsData as Organization[]) || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Organisasjoner</h1>
          <p className="text-gray-500">
            {organizations.length} organisasjon{organizations.length !== 1 ? 'er' : ''} registrert
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/organizations/new">
            <Plus className="h-4 w-4" />
            Ny organisasjon
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 text-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Organisasjon</th>
                <th className="px-4 py-3 text-left font-medium">Org.nr</th>
                <th className="px-4 py-3 text-left font-medium">Kategori</th>
                <th className="px-4 py-3 text-center font-medium">Betalinger</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {organizations.map((org) => {
                const canAcceptPayments =
                  org.vipps_enabled || org.stripe_charges_enabled;
                const hasStripeAccount = !!org.stripe_account_id;
                const hasVippsAccount = !!org.vipps_msn;

                return (
                  <tr key={org.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/org/${org.id}`}
                        className="hover:underline"
                      >
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt={org.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 text-sm font-medium">
                              {org.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">
                              {org.contact_email}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {org.org_number}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {org.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {org.vipps_enabled ? (
                          <Badge variant="success">Vipps</Badge>
                        ) : hasVippsAccount ? (
                          <Badge variant="warning">Vipps</Badge>
                        ) : null}
                        {org.stripe_charges_enabled ? (
                          <Badge variant="success">Stripe</Badge>
                        ) : hasStripeAccount ? (
                          <Badge variant="warning">Stripe</Badge>
                        ) : null}
                        {!hasVippsAccount && !hasStripeAccount && (
                          <span className="text-gray-400 text-sm">Ingen</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {org.status === 'active' ? (
                        canAcceptPayments ? (
                          <Badge variant="success">Aktiv</Badge>
                        ) : (
                          <Badge variant="warning">Trenger onboarding</Badge>
                        )
                      ) : org.status === 'pending' ? (
                        <Badge variant="secondary">Venter</Badge>
                      ) : (
                        <Badge variant="destructive">Suspendert</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/org/${org.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Administrer
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {organizations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Ingen organisasjoner registrert ennå.{' '}
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
    </div>
  );
}
