import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Group } from '@/lib/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';

type Props = {
  params: Promise<{ orgId: string }>;
};

export const metadata: Metadata = {
  title: 'Grupper | MinSponsor Admin',
};

export default async function GroupsPage({ params }: Props) {
  const { orgId } = await params;

  // Fetch groups for this organization
  const { data: groupsData } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');

  const groups = (groupsData as Group[]) || [];

  // Fetch individual counts per group
  const { data: individualCounts } = await supabaseAdmin
    .from('individuals')
    .select('group_id')
    .eq('organization_id', orgId)
    .eq('status', 'active');

  const countByGroup = (individualCounts || []).reduce(
    (acc, i) => {
      if (i.group_id) {
        acc[i.group_id] = (acc[i.group_id] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupper</h1>
          <p className="text-gray-500">Administrer grupper i organisasjonen</p>
        </div>
        <Button asChild>
          <Link href={`/admin/org/${orgId}/groups/new`}>
            <Plus className="h-4 w-4" />
            Ny gruppe
          </Link>
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/admin/org/${orgId}/groups/${group.id}`}
              className="block"
            >
              <Card className="hover:border-stone-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {group.image_url ? (
                      <img
                        src={group.image_url}
                        alt={group.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-200 text-stone-500">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{group.name}</h3>
                        {group.status === 'inactive' && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="mt-2 text-sm text-gray-400">
                        {countByGroup[group.id] || 0} individer
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">Ingen grupper</h3>
            <p className="mt-2 text-gray-500">
              Opprett din første gruppe for å organisere individer.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/admin/org/${orgId}/groups/new`}>
                <Plus className="h-4 w-4" />
                Opprett gruppe
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
