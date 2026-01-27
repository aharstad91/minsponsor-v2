'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Individual, Group } from '@/lib/database.types';
import { ImageUpload } from './image-upload';

type Props = {
  organizationId: string;
  individual?: Individual;
  mode: 'create' | 'edit';
};

export function IndividualForm({ organizationId, individual, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [formData, setFormData] = useState({
    first_name: individual?.first_name || '',
    last_name: individual?.last_name || '',
    group_id: individual?.group_id || '',
    birth_year: individual?.birth_year?.toString() || '',
    bio: individual?.bio || '',
    photo_url: individual?.photo_url || '',
    consent_given_by: individual?.consent_given_by || '',
  });

  const [consentChecked, setConsentChecked] = useState(mode === 'edit');

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch(
          `/api/admin/groups?organization_id=${organizationId}`
        );
        const data = await response.json();
        if (response.ok) {
          setGroups(data.groups);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    }

    fetchGroups();
  }, [organizationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'create' && !consentChecked) {
      setError('Du må bekrefte at samtykke er gitt');
      setLoading(false);
      return;
    }

    try {
      const url =
        mode === 'create'
          ? '/api/admin/individuals'
          : `/api/admin/individuals/${individual?.id}`;

      const payload: Record<string, unknown> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        group_id: formData.group_id || null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year, 10) : null,
        bio: formData.bio || null,
        photo_url: formData.photo_url || null,
      };

      if (mode === 'create') {
        payload.organization_id = organizationId;
        payload.consent_given_by = formData.consent_given_by;
      }

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      router.push(`/admin/organizations/${organizationId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Fornavn *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Fornavn"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Etternavn *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Etternavn"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="group_id">Gruppe</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, group_id: value === 'none' ? '' : value })
                }
                disabled={loadingGroups}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingGroups ? 'Laster...' : 'Velg gruppe (valgfritt)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen gruppe</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Valgfritt - individet kan være direkte under organisasjonen
              </p>
            </div>

            <div>
              <Label htmlFor="birth_year">Fodselsår</Label>
              <Input
                id="birth_year"
                type="number"
                min={1900}
                max={currentYear}
                value={formData.birth_year}
                onChange={(e) =>
                  setFormData({ ...formData, birth_year: e.target.value })
                }
                placeholder={`F.eks. ${currentYear - 15}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Valgfritt - brukes for å vise alder
              </p>
            </div>

            <div>
              <Label htmlFor="bio">Biografi</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Kort beskrivelse av personen, interesser, mål osv."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 tegn
              </p>
            </div>

            <div>
              <Label>Profilbilde</Label>
              <ImageUpload
                bucket="photos"
                entityId={individual?.id}
                currentUrl={formData.photo_url || null}
                onUpload={(url) => setFormData({ ...formData, photo_url: url })}
                onRemove={() => setFormData({ ...formData, photo_url: '' })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Last opp et profilbilde
              </p>
            </div>
          </CardContent>
        </Card>

        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Samtykke</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="consent_given_by">Samtykke gitt av *</Label>
                <Input
                  id="consent_given_by"
                  value={formData.consent_given_by}
                  onChange={(e) =>
                    setFormData({ ...formData, consent_given_by: e.target.value })
                  }
                  placeholder="Navn på foresatt eller personen selv"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Oppgi hvem som har gitt samtykke til publisering
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="consent" className="text-sm text-gray-700">
                  Jeg bekrefter at samtykke er gitt til å publisere denne personens
                  informasjon og bilde på MinSponsor-plattformen. For mindreårige
                  er samtykke gitt av foresatt.
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? 'Lagrer...'
              : mode === 'create'
                ? 'Opprett individ'
                : 'Lagre endringer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
        </div>
      </div>
    </form>
  );
}
