import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getOnboardingStatus, getHighestCompletedStep, type OrganizationWithCounts } from '@/lib/onboarding';
import type { Organization } from '@/lib/database.types';

// GET /api/admin/onboarding - Get organizations grouped by onboarding step
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    // Fetch all organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .neq('status', 'suspended')
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json(
        { error: 'Kunne ikke hente organisasjoner' },
        { status: 500 }
      );
    }

    // Fetch group counts
    const { data: groupCounts } = await supabaseAdmin
      .from('groups')
      .select('organization_id')
      .eq('status', 'active');

    // Fetch individual counts
    const { data: individualCounts } = await supabaseAdmin
      .from('individuals')
      .select('organization_id')
      .eq('status', 'active');

    // Create count maps
    const groupCountMap = new Map<string, number>();
    groupCounts?.forEach((g) => {
      const current = groupCountMap.get(g.organization_id) || 0;
      groupCountMap.set(g.organization_id, current + 1);
    });

    const individualCountMap = new Map<string, number>();
    individualCounts?.forEach((i) => {
      const current = individualCountMap.get(i.organization_id) || 0;
      individualCountMap.set(i.organization_id, current + 1);
    });

    // Enrich organizations with counts and onboarding status
    const enrichedOrgs = (organizations as Organization[]).map((org) => {
      const orgWithCounts: OrganizationWithCounts = {
        ...org,
        groupCount: groupCountMap.get(org.id) || 0,
        individualCount: individualCountMap.get(org.id) || 0,
      };

      return {
        ...orgWithCounts,
        onboardingStatus: getOnboardingStatus(orgWithCounts),
        highestStep: getHighestCompletedStep(orgWithCounts),
      };
    });

    // Group by highest completed step
    const byStep: Record<number, typeof enrichedOrgs> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };

    enrichedOrgs.forEach((org) => {
      byStep[org.highestStep].push(org);
    });

    // Count per step
    const stepCounts = {
      1: byStep[1].length,
      2: byStep[2].length,
      3: byStep[3].length,
      4: byStep[4].length,
      5: byStep[5].length,
      6: byStep[6].length,
      7: byStep[7].length,
    };

    return NextResponse.json({
      organizations: enrichedOrgs,
      byStep,
      stepCounts,
      total: enrichedOrgs.length,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/onboarding:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
