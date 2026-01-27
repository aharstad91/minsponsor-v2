import type { Organization } from './database.types';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  nextAction: string;
  daysInCurrentStep: number;
}

export interface OrganizationWithCounts extends Organization {
  groupCount: number;
  individualCount: number;
}

export const ONBOARDING_STEPS: { step: OnboardingStep; name: string; description: string }[] = [
  { step: 1, name: 'Registrert', description: 'Organisasjon opprettet' },
  { step: 2, name: 'Stripe', description: 'Stripe Connect startet' },
  { step: 3, name: 'Vipps', description: 'Vipps MSN registrert' },
  { step: 4, name: 'Gruppe', description: 'Første gruppe opprettet' },
  { step: 5, name: 'Utøver', description: 'Første utøver lagt til' },
  { step: 6, name: 'Test', description: 'Test-betaling verifisert' },
  { step: 7, name: 'Live', description: 'Klar for innsamling' },
];

export function getOnboardingStatus(
  org: OrganizationWithCounts
): OnboardingStatus {
  const completedSteps: OnboardingStep[] = [];
  let currentStep: OnboardingStep = 1;
  let nextAction = 'Start Stripe-onboarding';

  // Step 1: Organization exists (always complete if we have the org)
  completedSteps.push(1);

  // Step 2: Stripe Connect started
  if (org.stripe_account_id) {
    completedSteps.push(2);
    currentStep = 2;
  }

  // Step 3: Vipps setup
  if (org.vipps_msn) {
    completedSteps.push(3);
    currentStep = 3;
  }

  // Step 4: First group created
  if (org.groupCount >= 1) {
    completedSteps.push(4);
    currentStep = 4;
  }

  // Step 5: First individual added
  if (org.individualCount >= 1) {
    completedSteps.push(5);
    currentStep = 5;
  }

  // Step 6: Test payment verified (manual)
  if (org.test_payment_verified_at) {
    completedSteps.push(6);
    currentStep = 6;
  }

  // Step 7: Go-live (manual)
  if (org.went_live_at) {
    completedSteps.push(7);
    currentStep = 7;
  }

  // Determine next action based on what's missing
  if (!org.stripe_account_id && !org.vipps_msn) {
    nextAction = 'Start betalingsoppsett (Stripe eller Vipps)';
  } else if (!org.stripe_charges_enabled && org.stripe_account_id) {
    nextAction = 'Fullfør Stripe-onboarding';
  } else if (!org.vipps_enabled && org.vipps_msn) {
    nextAction = 'Vent på Vipps-aktivering';
  } else if (org.groupCount === 0) {
    nextAction = 'Opprett første gruppe/lag';
  } else if (org.individualCount === 0) {
    nextAction = 'Legg til første utøver';
  } else if (!org.test_payment_verified_at) {
    nextAction = 'Verifiser test-betaling';
  } else if (!org.went_live_at) {
    nextAction = 'Marker som live';
  } else {
    nextAction = 'Fullt onboardet!';
  }

  // Calculate days in current step
  let stepStartDate: Date;
  if (currentStep >= 7 && org.went_live_at) {
    stepStartDate = new Date(org.went_live_at);
  } else if (currentStep >= 6 && org.test_payment_verified_at) {
    stepStartDate = new Date(org.test_payment_verified_at);
  } else {
    stepStartDate = new Date(org.created_at);
  }

  const daysInCurrentStep = Math.floor(
    (Date.now() - stepStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    currentStep,
    completedSteps,
    nextAction,
    daysInCurrentStep,
  };
}

export function getHighestCompletedStep(org: OrganizationWithCounts): OnboardingStep {
  const status = getOnboardingStatus(org);
  return Math.max(...status.completedSteps) as OnboardingStep;
}

export function isFullyOnboarded(org: OrganizationWithCounts): boolean {
  return !!org.went_live_at;
}

export function canAcceptPayments(org: Organization): boolean {
  return org.stripe_charges_enabled || org.vipps_enabled;
}
