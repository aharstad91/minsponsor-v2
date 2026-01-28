import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Organization } from '@/lib/database.types';
import { OrganizationForm } from '@/components/admin/organization-form';

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
    title: org ? `Innstillinger: ${org.name} | MinSponsor Admin` : 'Innstillinger',
  };
}

export default async function SettingsPage({ params }: Props) {
  const { orgId } = await params;

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error || !org) {
    notFound();
  }

  const organization = org as Organization;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Innstillinger</h1>
        <p className="text-gray-500">Oppdater organisasjonens informasjon</p>
      </div>

      <OrganizationForm
        organization={organization}
        mode="edit"
        redirectUrl={`/admin/org/${orgId}`}
      />
    </div>
  );
}
