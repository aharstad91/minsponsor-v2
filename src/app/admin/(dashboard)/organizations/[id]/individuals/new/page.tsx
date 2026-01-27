import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import { IndividualForm } from '@/components/admin/individual-form';
import { ChevronLeft } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Ny person | MinSponsor Admin',
};

export default async function NewIndividualPage({ params }: Props) {
  const { id } = await params;

  // Verify organization exists
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('id', id)
    .single();

  if (error || !org) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/organizations/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbake til {org.name}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ny person</h1>
        <p className="text-gray-500">Legg til en ny person i {org.name}</p>
      </div>

      <IndividualForm organizationId={id} mode="create" />
    </div>
  );
}
