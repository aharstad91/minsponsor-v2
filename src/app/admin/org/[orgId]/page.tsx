import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Organization, Group, Individual } from '@/lib/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  User,
  CreditCard,
  TrendingUp,
  ExternalLink,
  Settings,
  ArrowRight,
} from 'lucide-react';

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
    title: org ? `${org.name} | MinSponsor Admin` : 'Dashboard',
  };
}

export default async function OrgDashboardPage({ params }: Props) {
  const { orgId } = await params;

  // Fetch organization
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error || !org) {
    notFound();
  }

  const organization = org as Organization;

  // Fetch counts and stats in parallel
  const [groupsResult, individualsResult, subscriptionsResult, mrrResult] =
    await Promise.all([
      supabaseAdmin
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('individuals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('subscriptions')
        .select('amount')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .eq('interval', 'monthly'),
    ]);

  const groupCount = groupsResult.count || 0;
  const individualCount = individualsResult.count || 0;
  const subscriptionCount = subscriptionsResult.count || 0;
  const mrr = mrrResult.data?.reduce((sum, s) => sum + s.amount, 0) || 0;

  const canAcceptPayments =
    organization.vipps_enabled || organization.stripe_charges_enabled;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-stone-200 text-xl font-medium text-stone-500">
              {organization.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              {organization.status === 'active' ? (
                canAcceptPayments ? (
                  <Badge variant="success">Aktiv</Badge>
                ) : (
                  <Badge variant="warning">Trenger onboarding</Badge>
                )
              ) : organization.status === 'pending' ? (
                <Badge variant="secondary">Venter</Badge>
              ) : (
                <Badge variant="destructive">Suspendert</Badge>
              )}
            </div>
            <p className="text-gray-500">
              Org.nr: {organization.org_number} • {organization.category}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/${organization.slug}`} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4" />
              Se offentlig side
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/org/${orgId}/settings`}>
              <Settings className="h-4 w-4" />
              Innstillinger
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">{groupCount}</div>
                <div className="text-sm text-gray-500">Grupper</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">{individualCount}</div>
                <div className="text-sm text-gray-500">Individer</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">{subscriptionCount}</div>
                <div className="text-sm text-gray-500">Aktive sponsorer</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">
                  {(mrr / 100).toLocaleString('nb-NO')} kr
                </div>
                <div className="text-sm text-gray-500">MRR</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Betalingsstatus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Stripe</div>
                <div className="text-sm text-gray-500">
                  {organization.stripe_charges_enabled
                    ? 'Aktiv - kan motta kort'
                    : organization.stripe_account_id
                      ? 'Onboarding ikke fullført'
                      : 'Ikke konfigurert'}
                </div>
              </div>
              {organization.stripe_charges_enabled ? (
                <Badge variant="success">Aktiv</Badge>
              ) : (
                <Badge variant="secondary">Ikke konfigurert</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Vipps</div>
                <div className="text-sm text-gray-500">
                  {organization.vipps_enabled
                    ? `Aktiv - MSN: ${organization.vipps_msn}`
                    : organization.vipps_msn
                      ? 'Venter på aktivering'
                      : 'Ikke konfigurert'}
                </div>
              </div>
              {organization.vipps_enabled ? (
                <Badge variant="success">Aktiv</Badge>
              ) : organization.vipps_msn ? (
                <Badge variant="warning">Venter</Badge>
              ) : (
                <Badge variant="secondary">Ikke konfigurert</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Snarveier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href={`/admin/org/${orgId}/groups`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-stone-400" />
                <span>Administrer grupper</span>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
            <Link
              href={`/admin/org/${orgId}/individuals`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-stone-400" />
                <span>Administrer individer</span>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
            <Link
              href={`/admin/org/${orgId}/report`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-stone-400" />
                <span>Se rapport</span>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
