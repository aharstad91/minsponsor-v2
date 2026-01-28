'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Group } from '@/lib/database.types';
import { ImageUpload } from './image-upload';

type Props = {
  organizationId: string;
  group?: Group;
  mode: 'create' | 'edit';
  redirectUrl?: string;
};

export function GroupForm({ organizationId, group, mode, redirectUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    image_url: group?.image_url || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url =
        mode === 'create'
          ? '/api/admin/groups'
          : `/api/admin/groups/${group?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      router.push(redirectUrl || `/admin/org/${organizationId}/groups`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gruppeinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Navn på gruppen"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Kort beskrivelse av gruppen"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 tegn
              </p>
            </div>

            <div>
              <Label>Gruppebilde</Label>
              <ImageUpload
                bucket="group-images"
                entityId={group?.id}
                currentUrl={formData.image_url || null}
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                onRemove={() => setFormData({ ...formData, image_url: '' })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Last opp et bilde av gruppen
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
                ? 'Opprett gruppe'
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
