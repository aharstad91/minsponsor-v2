import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fullfør i Vipps | MinSponsor',
  description: 'Åpne Vipps-appen for å fullføre betalingen',
};

type Props = {
  searchParams: Promise<{ sub?: string }>;
};

export default async function VippsPendingPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl">📱</div>
          <h1 className="text-2xl font-bold">Fullfør i Vipps</h1>
          <p className="text-gray-600">
            Åpne Vipps-appen på mobilen din for å godkjenne avtalen. Du vil
            motta en melding i appen.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              Når du har godkjent avtalen i Vipps, kan du lukke denne siden.
              Du vil motta en bekreftelse på e-post.
            </p>
          </div>

          {params.sub && (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/checkout/vipps/callback?sub=${params.sub}`}>
                Sjekk status
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Tilbake til forsiden</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
