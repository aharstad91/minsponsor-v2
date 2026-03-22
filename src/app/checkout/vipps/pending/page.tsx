import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl">📱</div>
          <h1 className="text-2xl font-bold text-foreground">Fullfør i Vipps</h1>
          <p className="text-muted-foreground">
            Åpne Vipps-appen på mobilen din for å godkjenne avtalen. Du vil
            motta en melding i appen.
          </p>

          <Alert className="text-left">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Når du har godkjent avtalen i Vipps, kan du lukke denne siden.
              Du vil motta en bekreftelse på e-post.
            </AlertDescription>
          </Alert>

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
