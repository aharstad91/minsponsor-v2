import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { createVippsAgreement, formatNorwegianPhone } from '@/lib/vipps';
import { checkoutSchema } from '@/lib/validations';
import { PLATFORM_FEE_PERCENT } from '@/lib/fees';
import type { Organization } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const supabase = await createClient();

    // Verify organization
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', data.recipient.organizationId)
      .eq('status', 'active')
      .single();

    if (error || !org) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
    }

    // Route to appropriate payment provider
    if (data.paymentMethod === 'vipps') {
      return handleVippsCheckout(data, org);
    } else {
      return handleStripeCheckout(data, org);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ugyldig data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Kunne ikke opprette betaling' },
      { status: 500 }
    );
  }
}

// Vipps Checkout Handler
async function handleVippsCheckout(
  data: z.infer<typeof checkoutSchema>,
  org: Organization
) {
  if (!org.vipps_enabled || !org.vipps_msn) {
    return NextResponse.json(
      { error: 'Vipps er ikke aktivert for denne klubben' },
      { status: 400 }
    );
  }

  if (!data.sponsorPhone) {
    return NextResponse.json(
      { error: 'Telefonnummer er påkrevd for Vipps' },
      { status: 400 }
    );
  }

  // Vipps only supports recurring for monthly
  if (data.interval === 'one_time') {
    return NextResponse.json(
      {
        error:
          'Vipps støtter kun månedlige betalinger. Velg kort for engangsbetaling.',
      },
      { status: 400 }
    );
  }

  // Format phone number (ensure Norwegian format)
  const phoneNumber = formatNorwegianPhone(data.sponsorPhone);

  // Create subscription record first (pending status)
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      payment_provider: 'vipps',
      sponsor_email: data.sponsorEmail,
      sponsor_name: data.sponsorName || null,
      sponsor_phone: phoneNumber,
      organization_id: data.recipient.organizationId,
      group_id: 'groupId' in data.recipient ? data.recipient.groupId : null,
      individual_id:
        'individualId' in data.recipient ? data.recipient.individualId : null,
      amount: data.amount,
      interval: 'monthly',
      status: 'pending',
    })
    .select()
    .single();

  if (subError) {
    console.error('Failed to create subscription:', subError);
    return NextResponse.json(
      { error: 'Kunne ikke opprette abonnement' },
      { status: 500 }
    );
  }

  try {
    // Create Vipps agreement
    const agreement = await createVippsAgreement(org.vipps_msn, {
      phoneNumber,
      amount: data.amount,
      productName: `Støtte til ${org.name}`,
      merchantRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/vipps/callback?sub=${subscription.id}`,
      merchantAgreementUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/mine-abonnementer`,
    });

    // Update subscription with Vipps agreement ID
    await supabaseAdmin
      .from('subscriptions')
      .update({ vipps_agreement_id: agreement.agreementId })
      .eq('id', subscription.id);

    return NextResponse.json({ url: agreement.vippsConfirmationUrl });
  } catch (err) {
    // Clean up failed subscription
    await supabaseAdmin.from('subscriptions').delete().eq('id', subscription.id);
    console.error('Vipps agreement creation failed:', err);
    return NextResponse.json(
      { error: 'Kunne ikke opprette Vipps-avtale' },
      { status: 500 }
    );
  }
}

// Stripe Checkout Handler
async function handleStripeCheckout(
  data: z.infer<typeof checkoutSchema>,
  org: Organization
) {
  if (!org.stripe_charges_enabled || !org.stripe_account_id) {
    return NextResponse.json(
      { error: 'Kort-betaling er ikke aktivert for denne klubben' },
      { status: 400 }
    );
  }

  const metadata = {
    organization_id: data.recipient.organizationId,
    group_id: 'groupId' in data.recipient ? data.recipient.groupId ?? '' : '',
    individual_id:
      'individualId' in data.recipient ? data.recipient.individualId : '',
    sponsor_name: data.sponsorName ?? '',
    sponsor_email: data.sponsorEmail,
  };

  const session = await stripe.checkout.sessions.create({
    mode: data.interval === 'monthly' ? 'subscription' : 'payment',
    customer_email: data.sponsorEmail,
    line_items: [
      {
        price_data: {
          currency: 'nok',
          unit_amount: data.amount,
          product_data: { name: `Støtte til ${org.name}` },
          ...(data.interval === 'monthly' && {
            recurring: { interval: 'month' },
          }),
        },
        quantity: 1,
      },
    ],
    ...(data.interval === 'monthly'
      ? {
          subscription_data: {
            application_fee_percent: PLATFORM_FEE_PERCENT,
            transfer_data: { destination: org.stripe_account_id },
            metadata,
          },
        }
      : {
          payment_intent_data: {
            application_fee_amount: Math.round(
              data.amount * (PLATFORM_FEE_PERCENT / 100)
            ),
            transfer_data: { destination: org.stripe_account_id },
            metadata,
          },
        }),
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/bekreftelse?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stott/${org.slug}`,
    metadata,
  });

  return NextResponse.json({ url: session.url });
}
