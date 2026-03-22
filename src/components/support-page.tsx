'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Users, AlertTriangle } from 'lucide-react';
import type { Organization, Group, Individual } from '@/lib/database.types';
import { canAcceptPayments } from '@/lib/database.types';

type Props = {
  type: 'organization' | 'group' | 'individual';
  organization: Organization;
  group?: Group;
  individual?: Individual;
  groups?: Group[];
  individuals?: Individual[];
};

export function SupportPage({
  type,
  organization,
  group,
  individual,
  groups,
  individuals,
}: Props) {
  const recipientName = individual
    ? `${individual.first_name} ${individual.last_name}`
    : group
      ? group.name
      : organization.name;

  const acceptsPayments = canAcceptPayments(organization);

  // Build checkout URL with recipient info
  const checkoutParams = new URLSearchParams({
    org: organization.id,
  });
  if (group) {
    checkoutParams.set('group', group.id);
  }
  if (individual) {
    checkoutParams.set('individual', individual.id);
  }
  const checkoutUrl = `/checkout?${checkoutParams.toString()}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/stott">MinSponsor</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {type === 'organization' ? (
                  <BreadcrumbPage>{organization.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={`/stott/${organization.slug}`}>
                      {organization.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {group && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {type === 'group' ? (
                      <BreadcrumbPage>{group.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={`/stott/${organization.slug}/gruppe/${group.slug}`}
                        >
                          {group.name}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {individual && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{individual.first_name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Main card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-4">
              {/* Logo */}
              {organization.logo_url && type === 'organization' && (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-16 w-auto object-contain"
                />
              )}

              {/* Individual photo */}
              {individual?.photo_url && (
                <img
                  src={individual.photo_url}
                  alt={`${individual.first_name} ${individual.last_name}`}
                  className="h-24 w-24 rounded-full object-cover border-4 border-accent/30"
                />
              )}

              <h1 className="text-2xl font-bold text-foreground">{recipientName}</h1>

              {/* Category badge */}
              {type === 'organization' && organization.category && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                  {organization.category}
                </Badge>
              )}

              {/* Description based on type */}
              {type === 'organization' && organization.description && (
                <p className="text-muted-foreground">{organization.description}</p>
              )}
              {type === 'group' && group?.description && (
                <p className="text-muted-foreground">{group.description}</p>
              )}
              {type === 'individual' && individual?.bio && (
                <p className="text-muted-foreground">{individual.bio}</p>
              )}

              {/* CTA Button */}
              {acceptsPayments ? (
                <Button asChild size="lg" pill className="w-full">
                  <Link href={checkoutUrl}>
                    Støtt{' '}
                    {type === 'individual' ? individual?.first_name : recipientName}
                  </Link>
                </Button>
              ) : (
                <Alert className="bg-warning/10 border-warning/30">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning/90">
                    Denne klubben kan ikke motta støtte ennå. Kontakt klubben for
                    mer informasjon.
                  </AlertDescription>
                </Alert>
              )}

              {/* Trust indicators */}
              <Separator />
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>Org.nr: {organization.org_number}</span>
                <span>Sikker betaling</span>
                {organization.vipps_enabled && (
                  <Badge variant="outline" className="text-[#FF5B24] border-[#FF5B24]/30">Vipps</Badge>
                )}
                {organization.stripe_charges_enabled && (
                  <Badge variant="outline" className="text-primary border-primary/30">Kort</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List groups */}
          {groups && groups.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-foreground">Lag og grupper</h2>
              <div className="space-y-2">
                {groups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/stott/${organization.slug}/gruppe/${g.slug}`}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{g.name}</div>
                      {g.description && (
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {g.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* List individuals */}
          {individuals && individuals.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-foreground">Støtt en person direkte</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {individuals.map((i) => (
                  <Link
                    key={i.id}
                    href={
                      group
                        ? `/stott/${organization.slug}/gruppe/${group.slug}/${i.slug}`
                        : `/stott/${organization.slug}/person/${i.slug}`
                    }
                    className="flex flex-col items-center p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <Avatar className="h-16 w-16 mb-2 border-2 border-accent/30">
                      {i.photo_url ? (
                        <AvatarImage
                          src={i.photo_url}
                          alt={`${i.first_name} ${i.last_name}`}
                        />
                      ) : null}
                      <AvatarFallback className="text-xl text-primary font-medium bg-accent/30">
                        {i.first_name[0]}
                        {i.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-sm text-center text-foreground">
                      {i.first_name} {i.last_name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
