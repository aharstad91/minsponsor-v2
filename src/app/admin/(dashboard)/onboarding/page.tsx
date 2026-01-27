import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import type { Organization } from '@/lib/database.types';
import { getOnboardingStatus, getHighestCompletedStep, ONBOARDING_STEPS, type OrganizationWithCounts } from '@/lib/onboarding';
import { OnboardingClient } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Onboarding | MinSponsor Admin',
  description: 'Onboarding-status for klubber',
};

export default async function OnboardingPage() {
  // Fetch all organizations
  const { data: organizations } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .neq('status', 'suspended')
    .order('created_at', { ascending: false });

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
  const enrichedOrgs = (organizations as Organization[] || []).map((org) => {
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

  // Count per step
  const stepCounts: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
  };

  enrichedOrgs.forEach((org) => {
    stepCounts[org.highestStep]++;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="text-gray-500">
          {enrichedOrgs.length} organisasjoner • {stepCounts[7]} fullt onboardet
        </p>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-lg shadow-sm mb-8 overflow-x-auto">
        <div className="flex min-w-[800px]">
          {ONBOARDING_STEPS.map((step) => {
            const count = stepCounts[step.step];
            const percentage = enrichedOrgs.length > 0
              ? Math.round((count / enrichedOrgs.length) * 100)
              : 0;

            return (
              <div
                key={step.step}
                className="flex-1 border-r last:border-r-0 p-4 text-center"
              >
                <div className="text-3xl font-bold">{count}</div>
                <div className="text-sm font-medium text-gray-900">{step.name}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Organization List */}
      <OnboardingClient organizations={enrichedOrgs} steps={ONBOARDING_STEPS} />
    </div>
  );
}
