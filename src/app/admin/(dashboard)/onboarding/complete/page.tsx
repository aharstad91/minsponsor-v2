'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowRight, Users, UserPlus } from 'lucide-react';

export default function OnboardingCompletePage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      if (!orgId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/organizations/${orgId}`);
        const data = await response.json();
        if (response.ok) {
          setOrgName(data.organization.name);
        }
      } catch (err) {
        console.error('Error fetching org:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrg();
  }, [orgId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="flex flex-col items-center">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Stripe-oppsett fullfort!</h1>
        <p className="text-muted-foreground">
          {orgName ? `${orgName} kan nå motta betalinger.` : 'Organisasjonen kan nå motta betalinger.'}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Neste steg</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h3 className="font-medium">Opprett grupper</h3>
              <p className="text-sm text-muted-foreground">
                Organiser medlemmene i grupper (f.eks. lag, klasser, avdelinger)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h3 className="font-medium">Legg til individer</h3>
              <p className="text-sm text-muted-foreground">
                Registrer personene som skal kunne motta sponsorstotte
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h3 className="font-medium">Del support-siden</h3>
              <p className="text-sm text-muted-foreground">
                Del lenken til organisasjonens offentlige side med potensielle sponsorer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {orgId ? (
          <>
            <Button asChild>
              <Link href={`/admin/org/${orgId}/groups/new`}>
                <Users className="h-4 w-4 mr-2" />
                Opprett gruppe
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/org/${orgId}/individuals/new`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Legg til person
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/admin/org/${orgId}`}>
                Ga til organisasjon
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild>
            <Link href="/admin">
              Ga til dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
