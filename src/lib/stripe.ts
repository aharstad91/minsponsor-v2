import Stripe from 'stripe';

// Initialize Stripe client only when STRIPE_SECRET_KEY is available
// This prevents build-time errors when environment variables aren't set
function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Return a proxy that throws helpful errors at runtime
    return new Proxy({} as Stripe, {
      get() {
        throw new Error('Stripe client not initialized: STRIPE_SECRET_KEY is not set');
      },
    });
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

export const stripe = createStripeClient();

// Create Stripe Connect Express account for a club
export async function createConnectAccount(orgId: string, email: string) {
  // Create Express account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'NO',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      organization_id: orgId,
    },
  });

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/refresh?org=${orgId}`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/complete?org=${orgId}`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}

// Create a new onboarding link for an existing account
export async function createAccountLink(accountId: string, orgId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/refresh?org=${orgId}`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/onboarding/complete?org=${orgId}`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

// Create billing portal session for sponsor to manage subscription
export async function createPortalSession(customerId: string, returnUrl?: string) {
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? process.env.NEXT_PUBLIC_BASE_URL!,
  });

  return portal.url;
}
