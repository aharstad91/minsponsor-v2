import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OrganizationForm } from '@/components/admin/organization-form';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ny organisasjon | MinSponsor Admin',
};

export default async function NewOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Tilbake til admin
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Ny organisasjon</h1>
          <p className="text-muted-foreground">
            Opprett en ny klubb eller organisasjon
          </p>
        </div>

        <OrganizationForm mode="create" />
      </div>
    </div>
  );
}
