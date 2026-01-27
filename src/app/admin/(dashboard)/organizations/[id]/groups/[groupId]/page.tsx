'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GroupForm } from '@/components/admin/group-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, Trash2 } from 'lucide-react';
import type { Group } from '@/lib/database.types';

type Props = {
  params: Promise<{ id: string; groupId: string }>;
};

export default function EditGroupPage({ params }: Props) {
  const { id, groupId } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/admin/groups/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setGroup(data.group);

        // Fetch org name
        const orgResponse = await fetch(`/api/admin/organizations/${id}`);
        const orgData = await orgResponse.json();
        if (orgResponse.ok) {
          setOrgName(orgData.organization.name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke laste gruppe');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, groupId]);

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke slette');
      }

      router.push(`/admin/organizations/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/organizations/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbake til {orgName || 'organisasjon'}
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Rediger {group.name}</h1>
          <p className="text-gray-500">Oppdater gruppens informasjon</p>
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

      <GroupForm organizationId={id} group={group} mode="edit" />

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett gruppe</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette {group.name}? Denne handlingen kan
              ikke angres. Alle individer i gruppen vil også bli deaktivert.
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
