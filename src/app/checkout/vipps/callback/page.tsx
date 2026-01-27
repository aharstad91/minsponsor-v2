import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getVippsAgreement, createVippsCharge } from '@/lib/vipps';

type Props = {
  searchParams: Promise<{ sub?: string }>;
};

export default async function VippsCallbackPage({ searchParams }: Props) {
  const params = await searchParams;

  if (!params.sub) {
    redirect('/?error=missing_subscription');
  }

  // Get subscription with organization
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*, organizations(*)')
    .eq('id', params.sub)
    .single();

  if (!subscription || !subscription.vipps_agreement_id) {
    redirect('/?error=subscription_not_found');
  }

  const org = subscription.organizations as {
    vipps_msn: string;
    slug: string;
  };

  // Poll Vipps for agreement status
  try {
    const agreement = await getVippsAgreement(
      org.vipps_msn,
      subscription.vipps_agreement_id
    );

    if (agreement.status === 'ACTIVE') {
      // Update subscription to active
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      // Create first charge (due in 3 days to meet Vipps' 2-day minimum)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      try {
        const charge = await createVippsCharge(
          org.vipps_msn,
          subscription.vipps_agreement_id,
          {
            amount: subscription.amount,
            description: `Første betaling - ${new Date().toLocaleString('nb-NO', { month: 'long', year: 'numeric' })}`,
            dueDate: dueDateStr,
            retryDays: 5,
          }
        );

        // Record pending transaction
        await supabaseAdmin.from('transactions').insert({
          subscription_id: subscription.id,
          payment_provider: 'vipps',
          vipps_charge_id: charge.chargeId,
          organization_id: subscription.organization_id,
          group_id: subscription.group_id,
          individual_id: subscription.individual_id,
          amount: subscription.amount,
          status: 'pending',
        });
      } catch (chargeError) {
        // Log but don't fail - the cron job will create charges
        console.error('Failed to create first Vipps charge:', chargeError);
      }

      redirect(`/bekreftelse?sub=${subscription.id}&provider=vipps`);
    } else if (
      agreement.status === 'EXPIRED' ||
      agreement.status === 'STOPPED'
    ) {
      // User rejected or agreement expired
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      redirect(`/stott/${org.slug}?error=vipps_rejected`);
    } else {
      // Still pending - tell user to complete in Vipps app
      redirect(`/checkout/vipps/pending?sub=${subscription.id}`);
    }
  } catch (error) {
    console.error('Error checking Vipps agreement status:', error);
    redirect(`/checkout/vipps/pending?sub=${subscription.id}`);
  }
}
