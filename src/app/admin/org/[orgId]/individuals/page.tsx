import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Individual, Group } from '@/lib/database.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, User } from 'lucide-react';

type Props = {
  params: Promise<{ orgId: string }>;
};

export const metadata: Metadata = {
  title: 'Individer | MinSponsor Admin',
};

export default async function IndividualsPage({ params }: Props) {
  const { orgId } = await params;

  // Fetch individuals for this organization
  const { data: individualsData } = await supabaseAdmin
    .from('individuals')
    .select('*')
    .eq('organization_id', orgId)
    .order('last_name');

  const individuals = (individualsData as Individual[]) || [];

  // Fetch groups for display
  const { data: groupsData } = await supabaseAdmin
    .from('groups')
    .select('id, name')
    .eq('organization_id', orgId);

  const groups = (groupsData as Pick<Group, 'id' | 'name'>[]) || [];
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Individer</h1>
          <p className="text-gray-500">
            Administrer individer i organisasjonen
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/org/${orgId}/individuals/new`}>
            <Plus className="h-4 w-4" />
            Nytt individ
          </Link>
        </Button>
      </div>

      {individuals.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 text-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Navn</th>
                <th className="px-4 py-3 text-left font-medium">Gruppe</th>
                <th className="px-4 py-3 text-left font-medium">Fodselsår</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {individuals.map((individual) => (
                <tr key={individual.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {individual.photo_url ? (
                        <img
                          src={individual.photo_url}
                          alt={`${individual.first_name} ${individual.last_name}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-500 text-sm">
                          {individual.first_name[0]}
                          {individual.last_name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {individual.first_name} {individual.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {individual.group_id
                      ? groupMap.get(individual.group_id) || 'Ukjent'
                      : 'Ingen gruppe'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {individual.birth_year || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {individual.status === 'active' ? (
                      <Badge variant="success">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/org/${orgId}/individuals/${individual.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Rediger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">Ingen individer</h3>
            <p className="mt-2 text-gray-500">
              Opprett ditt første individ for å komme i gang.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/admin/org/${orgId}/individuals/new`}>
                <Plus className="h-4 w-4" />
                Opprett individ
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
