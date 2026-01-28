import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import { IndividualForm } from '@/components/admin/individual-form';

type Props = {
  params: Promise<{ orgId: string }>;
};

export const metadata: Metadata = {
  title: 'Nytt individ | MinSponsor Admin',
};

export default async function NewIndividualPage({ params }: Props) {
  const { orgId } = await params;

  // Verify organization exists
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single();

  if (error || !org) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nytt individ</h1>
        <p className="text-gray-500">Opprett et nytt individ i {org.name}</p>
      </div>

      <IndividualForm
        organizationId={orgId}
        mode="create"
        redirectUrl={`/admin/org/${orgId}/individuals`}
      />
    </div>
  );
}
