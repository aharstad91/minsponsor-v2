'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';

type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
};

type Props = {
  organizations: Organization[];
  currentOrgId?: string;
};

export function OrgSelector({ organizations, currentOrgId }: Props) {
  const router = useRouter();

  const handleSelect = (orgId: string) => {
    if (orgId === 'new') {
      router.push('/admin/organizations/new');
    } else {
      router.push(`/admin/org/${orgId}`);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <Select value={currentOrgId} onValueChange={handleSelect}>
      <SelectTrigger className="w-full border-stone-200 bg-stone-50 hover:bg-stone-100">
        <SelectValue placeholder="Velg organisasjon...">
          {currentOrg && (
            <div className="flex items-center gap-2">
              {currentOrg.logo_url ? (
                <img
                  src={currentOrg.logo_url}
                  alt=""
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-xs font-medium text-stone-600">
                  {currentOrg.name[0]}
                </div>
              )}
              <span className="truncate">{currentOrg.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center gap-2">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt=""
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-xs font-medium text-stone-600">
                  {org.name[0]}
                </div>
              )}
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
        <div className="border-t border-stone-100 mt-1 pt-1">
          <SelectItem value="new">
            <div className="flex items-center gap-2 text-stone-600">
              <Plus className="h-4 w-4" />
              <span>Opprett ny organisasjon</span>
            </div>
          </SelectItem>
        </div>
      </SelectContent>
    </Select>
  );
}

export function OrgSelectorSkeleton() {
  return (
    <div className="h-10 w-full animate-pulse rounded-md border border-stone-200 bg-stone-100" />
  );
}
