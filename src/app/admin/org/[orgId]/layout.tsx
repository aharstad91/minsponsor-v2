import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AdminLayout } from '@/components/admin/admin-layout';
import { OrgSelector } from '@/components/admin/org-selector';
import type { Organization } from '@/lib/database.types';

type Props = {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
};

export default async function OrgScopedLayout({ children, params }: Props) {
  const { orgId } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  // Fetch current org
  const { data: currentOrg, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error || !currentOrg) {
    notFound();
  }

  // Fetch all orgs for selector
  const { data: organizations } = await supabaseAdmin
    .from('organizations')
    .select('id, name, logo_url, slug')
    .order('name');

  return (
    <AdminLayout
      userEmail={user.email}
      orgSelector={
        <OrgSelector organizations={organizations || []} currentOrgId={orgId} />
      }
      currentOrg={currentOrg as Organization}
    >
      {children}
    </AdminLayout>
  );
}
