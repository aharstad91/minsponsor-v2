'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function OnboardingRefreshPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get('org');
  const [status, setStatus] = useState<'loading' | 'error' | 'redirecting'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function generateNewLink() {
      if (!orgId) {
        setError('Mangler organisasjons-ID');
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(`/api/admin/organizations/${orgId}/stripe-link`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Kunne ikke generere ny lenke');
        }

        // Redirect to the new onboarding URL
        setStatus('redirecting');
        window.location.href = data.onboardingUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Noe gikk galt');
        setStatus('error');
      }
    }

    generateNewLink();
  }, [orgId]);

  if (status === 'loading' || status === 'redirecting') {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-medium mb-2">
              {status === 'loading' ? 'Genererer ny lenke...' : 'Videresender til Stripe...'}
            </h2>
            <p className="text-sm text-gray-500">
              Vennligst vent mens vi forbereder Stripe-oppsettet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle>Kunne ikke fornye lenke</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {error || 'Det oppsto en feil under generering av ny Stripe-lenke.'}
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Prov igjen
            </Button>
            {orgId && (
              <Button asChild variant="outline">
                <Link href={`/admin/org/${orgId}`}>
                  Tilbake til organisasjon
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/admin">
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
