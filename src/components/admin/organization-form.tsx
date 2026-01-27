'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { organizationCategories } from '@/lib/validations';
import type { Organization } from '@/lib/database.types';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { ImageUpload } from './image-upload';

type Props = {
  organization?: Organization;
  mode: 'create' | 'edit';
};

export function OrganizationForm({ organization, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    org_number: organization?.org_number || '',
    category: organization?.category || '',
    description: organization?.description || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    logo_url: organization?.logo_url || '',
    suggested_amounts: organization?.suggested_amounts || [5000, 10000, 20000],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url =
        mode === 'create'
          ? '/api/admin/organizations'
          : `/api/admin/organizations/${organization?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          suggested_amounts: formData.suggested_amounts.map((a) =>
            typeof a === 'string' ? parseInt(a) * 100 : a
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      if (mode === 'create' && data.stripeOnboardingUrl) {
        setStripeUrl(data.stripeOnboardingUrl);
      } else {
        router.push(`/admin/organizations/${data.organization.id}`);
        router.refresh();
      }
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

  function handleAmountChange(index: number, value: string) {
    const newAmounts = [...formData.suggested_amounts];
    newAmounts[index] = parseInt(value) * 100 || 0;
    setFormData({ ...formData, suggested_amounts: newAmounts });
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Grunnleggende informasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Navn på klubb/organisasjon"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="org_number">Organisasjonsnummer *</Label>
                  <Input
                    id="org_number"
                    value={formData.org_number}
                    onChange={(e) =>
                      setFormData({ ...formData, org_number: e.target.value })
                    }
                    placeholder="9 siffer"
                    maxLength={9}
                    required
                    disabled={mode === 'edit'}
                  />
                  {mode === 'edit' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Kan ikke endres etter opprettelse
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kort beskrivelse av organisasjonen"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 tegn
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact_email">E-post *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_email: e.target.value })
                    }
                    placeholder="kontakt@klubb.no"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_phone: e.target.value })
                    }
                    placeholder="12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Betalingsinnstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Foreslåtte beløp (kr)</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[0, 1, 2].map((index) => (
                    <Input
                      key={index}
                      type="number"
                      min="10"
                      max="100000"
                      value={
                        formData.suggested_amounts[index]
                          ? formData.suggested_amounts[index] / 100
                          : ''
                      }
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      placeholder={`Beløp ${index + 1}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Beløpene som vises som forslag i betalingsskjemaet
                </p>
              </div>

              <div>
                <Label>Logo</Label>
                <ImageUpload
                  bucket="logos"
                  entityId={organization?.id}
                  currentUrl={formData.logo_url || null}
                  onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                  onRemove={() => setFormData({ ...formData, logo_url: '' })}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Last opp organisasjonens logo
                </p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Lagrer...'
                : mode === 'create'
                  ? 'Opprett organisasjon'
                  : 'Lagre endringer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Avbryt
            </Button>
          </div>
        </div>
      </form>

      {/* Stripe onboarding modal */}
      <Dialog open={!!stripeUrl} onOpenChange={() => setStripeUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organisasjon opprettet</DialogTitle>
            <DialogDescription>
              Organisasjonen er opprettet. Del denne lenken med organisasjonen
              slik at de kan fullføre Stripe-onboarding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-stone-100 p-3 rounded-lg">
              <p className="text-sm font-mono break-all">{stripeUrl}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1">
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
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStripeUrl(null);
                router.push('/admin/organizations');
                router.refresh();
              }}
            >
              Gå til organisasjoner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
