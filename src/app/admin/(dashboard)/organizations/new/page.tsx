import type { Metadata } from 'next';
import Link from 'next/link';
import { OrganizationForm } from '@/components/admin/organization-form';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ny organisasjon | MinSponsor Admin',
};

export default function NewOrganizationPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbake til organisasjoner
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ny organisasjon</h1>
        <p className="text-gray-500">
          Opprett en ny klubb eller organisasjon
        </p>
      </div>

      <OrganizationForm mode="create" />
    </div>
  );
}
