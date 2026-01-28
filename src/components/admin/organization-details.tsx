'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Organization, Group, Individual } from '@/lib/database.types';
import {
  Copy,
  Check,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  Users,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';

type Props = {
  organization: Organization;
  groups: Group[];
  individuals: Individual[];
  stats: {
    subscriptionCount: number;
    mrr: number;
  };
};

export function OrganizationDetails({
  organization,
  groups,
  individuals,
  stats,
}: Props) {
  const router = useRouter();
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canAcceptPayments =
    organization.vipps_enabled || organization.stripe_charges_enabled;

  async function generateStripeLink() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/org/${organization.id}/stripe-link`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke generere lenke');
      }

      setStripeUrl(data.onboardingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (stripeUrl) {
      await navigator.clipboard.writeText(stripeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/org/${organization.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke slette');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 text-xl font-medium">
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
            <Link href={`/admin/org/${organization.id}/report`}>
              <FileText className="h-4 w-4" />
              Rapport
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/org/${organization.id}/edit`}>
              <Edit className="h-4 w-4" />
              Rediger
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Slett
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold">{groups.length}</div>
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
                <div className="text-2xl font-bold">{individuals.length}</div>
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
                <div className="text-2xl font-bold">{stats.subscriptionCount}</div>
                <div className="text-sm text-gray-500">Aktive sponsorer</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <div className="text-2xl font-bold">
                {(stats.mrr / 100).toLocaleString('nb-NO')} kr
              </div>
              <div className="text-sm text-gray-500">MRR</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informasjon</TabsTrigger>
          <TabsTrigger value="groups">Grupper ({groups.length})</TabsTrigger>
          <TabsTrigger value="individuals">
            Individer ({individuals.length})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">E-post</div>
                  <div>{organization.contact_email}</div>
                </div>
                {organization.contact_phone && (
                  <div>
                    <div className="text-sm text-gray-500">Telefon</div>
                    <div>{organization.contact_phone}</div>
                  </div>
                )}
                {organization.description && (
                  <div>
                    <div className="text-sm text-gray-500">Beskrivelse</div>
                    <div>{organization.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Betalingsstatus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stripe */}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateStripeLink}
                      disabled={loading}
                    >
                      {loading ? 'Laster...' : 'Generer lenke'}
                    </Button>
                  )}
                </div>

                {/* Vipps */}
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
                    <span className="text-sm text-gray-400">
                      Konfigureres manuelt
                    </span>
                  )}
                </div>

                {/* Suggested amounts */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-2">
                    Foreslåtte beløp
                  </div>
                  <div className="flex gap-2">
                    {organization.suggested_amounts.map((amount) => (
                      <Badge key={amount} variant="secondary">
                        {amount / 100} kr
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Public link */}
          <Card>
            <CardHeader>
              <CardTitle>Offentlig side</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <code className="flex-1 bg-stone-100 px-3 py-2 rounded text-sm">
                  {process.env.NEXT_PUBLIC_BASE_URL || 'https://minsponsor.no'}/
                  {organization.slug}
                </code>
                <Button variant="outline" asChild>
                  <a
                    href={`/${organization.slug}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Åpne
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Grupper</CardTitle>
              <Button asChild size="sm">
                <Link href={`/admin/org/${organization.id}/groups/new`}>
                  <Plus className="h-4 w-4" />
                  Ny gruppe
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="divide-y">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-gray-500">
                            {group.description}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/admin/org/${organization.id}/groups/${group.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Rediger
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Ingen grupper opprettet ennå.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individuals Tab */}
        <TabsContent value="individuals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Individer</CardTitle>
              <Button asChild size="sm">
                <Link
                  href={`/admin/org/${organization.id}/individuals/new`}
                >
                  <Plus className="h-4 w-4" />
                  Nytt individ
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {individuals.length > 0 ? (
                <div className="divide-y">
                  {individuals.map((individual) => {
                    const group = groups.find(
                      (g) => g.id === individual.group_id
                    );
                    return (
                      <div
                        key={individual.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {individual.photo_url ? (
                            <img
                              src={individual.photo_url}
                              alt={`${individual.first_name} ${individual.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-sm">
                              {individual.first_name[0]}
                              {individual.last_name[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {individual.first_name} {individual.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {group?.name || 'Ingen gruppe'}
                              {individual.birth_year &&
                                ` • ${individual.birth_year}`}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/admin/org/${organization.id}/individuals/${individual.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Rediger
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Ingen individer opprettet ennå.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stripe link modal */}
      <Dialog open={!!stripeUrl} onOpenChange={() => setStripeUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stripe onboarding-lenke</DialogTitle>
            <DialogDescription>
              Del denne lenken med organisasjonen for å fullføre
              Stripe-oppsettet.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-stone-100 p-3 rounded-lg">
            <p className="text-sm font-mono break-all">{stripeUrl}</p>
          </div>

          <DialogFooter>
            <Button onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Kopier lenke
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <a href={stripeUrl || ''} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" />
                Åpne
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett organisasjon</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette {organization.name}? Denne
              handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Sletter...' : 'Slett'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
