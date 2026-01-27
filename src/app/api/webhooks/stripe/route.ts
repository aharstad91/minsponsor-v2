import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check using database constraint
  const { error: idempotencyError } = await supabaseAdmin
    .from('processed_events')
    .insert({ provider: 'stripe', event_id: event.id });

  if (idempotencyError) {
    // Already processed (unique constraint violation)
    if (idempotencyError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('Idempotency error:', idempotencyError);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  let metadata: Stripe.Metadata = session.metadata || {};

  // For subscriptions, get metadata from the subscription
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    metadata = { ...metadata, ...sub.metadata };
  } else if (session.payment_intent) {
    // For one-time payments, get metadata from the payment intent
    const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    metadata = { ...metadata, ...pi.metadata };
  }

  // Check if subscription already exists (idempotency)
  if (session.subscription) {
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', session.subscription as string)
      .single();

    if (existing) {
      console.log('Subscription already exists:', session.subscription);
      return;
    }
  }

  // Create subscription record
  const subscriptionData = {
    payment_provider: 'stripe' as const,
    stripe_subscription_id: (session.subscription as string) || null,
    stripe_customer_id: session.customer as string,
    sponsor_email: session.customer_email || metadata.sponsor_email || '',
    sponsor_name: metadata.sponsor_name || null,
    organization_id: metadata.organization_id,
    group_id: metadata.group_id || null,
    individual_id: metadata.individual_id || null,
    amount: session.amount_total!,
    interval: session.mode === 'subscription' ? 'monthly' : 'one_time',
    status: 'active' as const,
    started_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .insert(subscriptionData);

  if (error) {
    console.error('Failed to create subscription record:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update cancelled subscription:', error);
    throw error;
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ stripe_charges_enabled: account.charges_enabled ?? false })
    .eq('stripe_account_id', account.id);

  if (error) {
    console.error('Failed to update organization charges_enabled:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Get subscription ID from parent or linked subscription
  const subscriptionId = invoice.parent?.subscription_details?.subscription ||
    (invoice as unknown as { subscription?: string | null }).subscription;

  // Only process subscription invoices (not the initial checkout)
  if (!subscriptionId || invoice.billing_reason === 'subscription_create') {
    return;
  }

  // Find the subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId as string)
    .single();

  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Record transaction (check for duplicate first)
  // Note: In newer Stripe API, charge may be on a different path
  const invoiceAny = invoice as unknown as { charge?: string | { id: string } | null };
  const chargeId = typeof invoiceAny.charge === 'string'
    ? invoiceAny.charge
    : invoiceAny.charge?.id;

  if (chargeId) {
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('stripe_charge_id', chargeId)
      .single();

    if (existingTransaction) {
      console.log('Transaction already exists for charge:', chargeId);
      return;
    }

    await supabaseAdmin.from('transactions').insert({
      subscription_id: subscription.id,
      payment_provider: 'stripe',
      stripe_charge_id: chargeId,
      organization_id: subscription.organization_id,
      group_id: subscription.group_id,
      individual_id: subscription.individual_id,
      amount: invoice.amount_paid,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id);

  // Get subscription ID from parent or linked subscription
  const subscriptionId = invoice.parent?.subscription_details?.subscription ||
    (invoice as unknown as { subscription?: string | null }).subscription;

  // Find the subscription to get sponsor email
  if (subscriptionId) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*, organizations(name)')
      .eq('stripe_subscription_id', subscriptionId as string)
      .single();

    if (subscription) {
      // TODO: Send email notification about failed payment
      console.log(
        `Should notify ${subscription.sponsor_email} about failed payment for ${(subscription.organizations as { name: string })?.name}`
      );
    }
  }
}
