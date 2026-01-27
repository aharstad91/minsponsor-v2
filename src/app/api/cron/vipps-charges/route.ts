import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createVippsCharge } from '@/lib/vipps';

// This endpoint should be called daily by Vercel Cron
// It creates charges for all active Vipps subscriptions

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Calculate due date (3 days from now to meet Vipps' 2-day minimum)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  // Get the current month key for checking existing charges
  const monthKey = dueDateStr.substring(0, 7); // YYYY-MM

  // Find all active Vipps subscriptions that need a charge
  const { data: subscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, organizations(vipps_msn, name)')
    .eq('payment_provider', 'vipps')
    .eq('status', 'active')
    .eq('interval', 'monthly')
    .not('vipps_agreement_id', 'is', null);

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'No charges to create', results: [] });
  }

  const results: Array<{
    subscriptionId: string;
    chargeId?: string;
    status: string;
    error?: string;
  }> = [];

  for (const sub of subscriptions) {
    const org = sub.organizations as { vipps_msn: string; name: string } | null;

    if (!org?.vipps_msn || !sub.vipps_agreement_id) {
      results.push({
        subscriptionId: sub.id,
        status: 'skipped',
        error: 'Missing MSN or agreement ID',
      });
      continue;
    }

    // Check if we already created a charge for this period
    const { data: existingCharge } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('subscription_id', sub.id)
      .gte('created_at', `${monthKey}-01T00:00:00Z`)
      .lt('created_at', `${monthKey}-32T00:00:00Z`)
      .single();

    if (existingCharge) {
      results.push({
        subscriptionId: sub.id,
        status: 'skipped',
        error: 'Charge already exists for this month',
      });
      continue;
    }

    // Calculate when this subscription started to determine if it's time for a charge
    // Only charge if at least ~30 days have passed since the last charge
    const { data: lastTransaction } = await supabaseAdmin
      .from('transactions')
      .select('created_at')
      .eq('subscription_id', sub.id)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastTransaction) {
      const lastChargeDate = new Date(lastTransaction.created_at);
      const daysSinceLastCharge = Math.floor(
        (Date.now() - lastChargeDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastCharge < 25) {
        // Not yet time for the next charge
        results.push({
          subscriptionId: sub.id,
          status: 'skipped',
          error: `Only ${daysSinceLastCharge} days since last charge`,
        });
        continue;
      }
    }

    try {
      const monthName = dueDate.toLocaleString('nb-NO', { month: 'long' });
      const charge = await createVippsCharge(org.vipps_msn, sub.vipps_agreement_id, {
        amount: sub.amount,
        description: `Støtte ${monthName}`,
        dueDate: dueDateStr,
        retryDays: 5,
      });

      // Record pending transaction
      await supabaseAdmin.from('transactions').insert({
        subscription_id: sub.id,
        payment_provider: 'vipps',
        vipps_charge_id: charge.chargeId,
        organization_id: sub.organization_id,
        group_id: sub.group_id,
        individual_id: sub.individual_id,
        amount: sub.amount,
        status: 'pending',
      });

      results.push({
        subscriptionId: sub.id,
        chargeId: charge.chargeId,
        status: 'created',
      });
    } catch (error) {
      console.error(`Failed to create charge for subscription ${sub.id}:`, error);
      results.push({
        subscriptionId: sub.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  console.log(`Vipps charges cron: ${created} created, ${failed} failed, ${skipped} skipped`);

  return NextResponse.json({
    summary: { created, failed, skipped },
    results,
  });
}
