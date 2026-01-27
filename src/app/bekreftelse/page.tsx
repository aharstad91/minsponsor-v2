import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { stripe, createPortalSession } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Takk for støtten! | MinSponsor',
  description: 'Din betaling er bekreftet',
};

type Props = {
  searchParams: Promise<{
    session_id?: string;
    sub?: string;
    provider?: 'stripe' | 'vipps';
  }>;
};

export default async function BekreftelsePage({ searchParams }: Props) {
  const params = await searchParams;
  const provider = params.provider || 'stripe';

  let isSubscription = false;
  let portalUrl: string | null = null;
  let amount: number | null = null;
  let orgName: string | null = null;

  if (provider === 'stripe' && params.session_id) {
    // Retrieve Stripe session details
    try {
      const session = await stripe.checkout.sessions.retrieve(params.session_id);
      isSubscription = session.mode === 'subscription';
      amount = session.amount_total;

      // For subscriptions, create a portal link
      if (isSubscription && session.customer) {
        portalUrl = await createPortalSession(
          session.customer as string,
          process.env.NEXT_PUBLIC_BASE_URL!
        );
      }
    } catch (error) {
      console.error('Error retrieving Stripe session:', error);
    }
  } else if (provider === 'vipps' && params.sub) {
    // Retrieve Vipps subscription details
    try {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*, organizations(name)')
        .eq('id', params.sub)
        .single();

      if (subscription) {
        isSubscription = subscription.interval === 'monthly';
        amount = subscription.amount;
        orgName =
          (subscription.organizations as { name: string } | null)?.name || null;
      }
    } catch (error) {
      console.error('Error retrieving Vipps subscription:', error);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">Takk for støtten!</h1>

          {amount && (
            <p className="text-3xl font-bold text-green-600">
              {(amount / 100).toLocaleString('nb-NO')} kr
              {isSubscription && '/måned'}
            </p>
          )}

          <p className="text-gray-600">
            {isSubscription
              ? 'Du støtter nå månedlig. Du vil motta en kvittering på e-post etter hver betaling.'
              : 'Din støtte er registrert. Du vil motta en kvittering på e-post.'}
          </p>

          {provider === 'vipps' && isSubscription && (
            <div className="bg-stone-100 rounded-lg p-4 text-sm text-gray-600">
              <p>
                Du kan administrere eller avslutte abonnementet ditt i
                Vipps-appen under &quot;Faste betalinger&quot;.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {portalUrl && (
              <Button asChild variant="outline" className="w-full">
                <a href={portalUrl}>Administrer abonnement</a>
              </Button>
            )}

            <Button asChild className="w-full">
              <Link href="/">Tilbake til forsiden</Link>
            </Button>
          </div>

          {orgName && (
            <p className="text-sm text-gray-500">Støtte til {orgName}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
