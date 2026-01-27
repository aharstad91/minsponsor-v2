import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Organization } from '@/lib/database.types';
import { OrganizationForm } from '@/components/admin/organization-form';
import { ChevronLeft } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: org ? `Rediger ${org.name} | MinSponsor Admin` : 'Rediger organisasjon',
  };
}

export default async function EditOrganizationPage({ params }: Props) {
  const { id } = await params;

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !org) {
    notFound();
  }

  const organization = org as Organization;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/organizations/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbake til {organization.name}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Rediger {organization.name}</h1>
        <p className="text-gray-500">Oppdater organisasjonens informasjon</p>
      </div>

      <OrganizationForm organization={organization} mode="edit" />
    </div>
  );
}
