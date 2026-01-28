'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualForm } from '@/components/admin/individual-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import type { Individual } from '@/lib/database.types';

type Props = {
  params: Promise<{ orgId: string; individualId: string }>;
};

export default function EditIndividualPage({ params }: Props) {
  const { orgId, individualId } = use(params);
  const router = useRouter();
  const [individual, setIndividual] = useState<Individual | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/admin/individuals/${individualId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setIndividual(data.individual);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Kunne ikke laste individ'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [individualId]);

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/individuals/${individualId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke slette');
      }

      router.push(`/admin/org/${orgId}/individuals`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error && !individual) {
    return (
      <div className="max-w-3xl">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!individual) {
    return null;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Rediger {individual.first_name} {individual.last_name}
          </h1>
          <p className="text-gray-500">Oppdater individets informasjon</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Slett
        </Button>
      </div>

      <IndividualForm
        organizationId={orgId}
        individual={individual}
        mode="edit"
        redirectUrl={`/admin/org/${orgId}/individuals`}
      />

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett individ</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette {individual.first_name}{' '}
              {individual.last_name}? Denne handlingen kan ikke angres.
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
    </div>
  );
}
