import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Vipps webhook event types
type VippsWebhookEvent = {
  name: string;
  agreementId?: string;
  chargeId?: string;
  amount?: number;
  timestamp?: string;
  actor?: string;
  failureReason?: string;
};

export async function POST(request: Request) {
  const body = await request.text();

  // Note: Vipps webhook verification varies by API version
  // For production, verify the signature using the webhook secret
  // See: https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/

  let event: VippsWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Generate event ID for idempotency
  const eventId = `${event.name}-${event.agreementId || event.chargeId}-${event.timestamp || Date.now()}`;

  // Idempotency check
  const { error: idempotencyError } = await supabaseAdmin
    .from('processed_events')
    .insert({ provider: 'vipps', event_id: eventId });

  if (idempotencyError?.code === '23505') {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.name) {
      case 'recurring.agreement-activated.v1':
        await handleAgreementActivated(event);
        break;

      case 'recurring.agreement-stopped.v1':
        await handleAgreementStopped(event);
        break;

      case 'recurring.agreement-expired.v1':
        await handleAgreementExpired(event);
        break;

      case 'recurring.charge-captured.v1':
        await handleChargeCaptured(event);
        break;

      case 'recurring.charge-failed.v1':
        await handleChargeFailed(event);
        break;

      case 'recurring.charge-cancelled.v1':
        await handleChargeCancelled(event);
        break;

      default:
        console.log('Unhandled Vipps event:', event.name);
    }
  } catch (error) {
    console.error(`Error processing Vipps ${event.name}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleAgreementActivated(event: VippsWebhookEvent) {
  const { agreementId } = event;

  if (!agreementId) {
    console.error('Missing agreementId in agreement-activated event');
    return;
  }

  // Update subscription to active
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('vipps_agreement_id', agreementId);

  if (error) {
    console.error('Failed to activate subscription:', error);
    throw error;
  }

  console.log(`Vipps agreement ${agreementId} activated`);
}

async function handleAgreementStopped(event: VippsWebhookEvent) {
  const { agreementId, actor } = event;

  if (!agreementId) {
    console.error('Missing agreementId in agreement-stopped event');
    return;
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('vipps_agreement_id', agreementId);

  if (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }

  console.log(`Vipps agreement ${agreementId} stopped by ${actor || 'unknown'}`);
}

async function handleAgreementExpired(event: VippsWebhookEvent) {
  const { agreementId } = event;

  if (!agreementId) {
    console.error('Missing agreementId in agreement-expired event');
    return;
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'expired',
    })
    .eq('vipps_agreement_id', agreementId);

  if (error) {
    console.error('Failed to expire subscription:', error);
    throw error;
  }

  console.log(`Vipps agreement ${agreementId} expired`);
}

async function handleChargeCaptured(event: VippsWebhookEvent) {
  const { agreementId, chargeId, amount } = event;

  if (!agreementId || !chargeId) {
    console.error('Missing agreementId or chargeId in charge-captured event');
    return;
  }

  // Find subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('vipps_agreement_id', agreementId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for agreement:', agreementId);
    return;
  }

  // Check if transaction already exists
  const { data: existingTransaction } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('vipps_charge_id', chargeId)
    .single();

  if (existingTransaction) {
    // Update existing transaction to succeeded
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      })
      .eq('vipps_charge_id', chargeId);
  } else {
    // Create new transaction
    await supabaseAdmin.from('transactions').insert({
      subscription_id: subscription.id,
      payment_provider: 'vipps',
      vipps_charge_id: chargeId,
      organization_id: subscription.organization_id,
      group_id: subscription.group_id,
      individual_id: subscription.individual_id,
      amount: amount || subscription.amount,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    });
  }

  console.log(`Vipps charge ${chargeId} captured for agreement ${agreementId}`);
}

async function handleChargeFailed(event: VippsWebhookEvent) {
  const { agreementId, chargeId, failureReason } = event;

  console.log(
    `Vipps charge failed: ${chargeId} for agreement ${agreementId} - ${failureReason}`
  );

  if (!chargeId) {
    return;
  }

  // Update transaction to failed if it exists
  await supabaseAdmin
    .from('transactions')
    .update({ status: 'failed' })
    .eq('vipps_charge_id', chargeId);

  // Find subscription for potential notification
  if (agreementId) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*, organizations(name)')
      .eq('vipps_agreement_id', agreementId)
      .single();

    if (subscription) {
      // TODO: Send email notification about failed payment
      console.log(
        `Should notify ${subscription.sponsor_email} about failed Vipps payment for ${(subscription.organizations as { name: string })?.name}`
      );
    }
  }
}

async function handleChargeCancelled(event: VippsWebhookEvent) {
  const { chargeId } = event;

  if (!chargeId) {
    return;
  }

  // Update transaction to failed/cancelled
  await supabaseAdmin
    .from('transactions')
    .update({ status: 'failed' })
    .eq('vipps_charge_id', chargeId);

  console.log(`Vipps charge ${chargeId} cancelled`);
}
