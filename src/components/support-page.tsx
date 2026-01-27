'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link
            href={`/stott/${organization.slug}`}
            className="hover:text-gray-700"
          >
            {organization.name}
          </Link>
          {group && (
            <>
              <span>/</span>
              <Link
                href={`/stott/${organization.slug}/gruppe/${group.slug}`}
                className="hover:text-gray-700"
              >
                {group.name}
              </Link>
            </>
          )}
          {individual && (
            <>
              <span>/</span>
              <span className="text-gray-700">{individual.first_name}</span>
            </>
          )}
        </nav>

        {/* Main card */}
        <Card>
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
                className="h-24 w-24 rounded-full object-cover"
              />
            )}

            <h1 className="text-2xl font-bold">{recipientName}</h1>

            {/* Description based on type */}
            {type === 'organization' && organization.description && (
              <p className="text-gray-600">{organization.description}</p>
            )}
            {type === 'group' && group?.description && (
              <p className="text-gray-600">{group.description}</p>
            )}
            {type === 'individual' && individual?.bio && (
              <p className="text-gray-600">{individual.bio}</p>
            )}

            {/* CTA Button */}
            {acceptsPayments ? (
              <Button asChild size="lg" className="w-full">
                <Link href={checkoutUrl}>
                  Støtt{' '}
                  {type === 'individual' ? individual?.first_name : recipientName}
                </Link>
              </Button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800">
                  Denne klubben kan ikke motta støtte ennå. Kontakt klubben for
                  mer informasjon.
                </p>
              </div>
            )}

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-4 border-t">
              <span>Org.nr: {organization.org_number}</span>
              <span>Sikker betaling</span>
              {organization.vipps_enabled && (
                <span className="text-[#FF5B24] font-medium">Vipps</span>
              )}
              {organization.stripe_charges_enabled && (
                <span className="text-blue-600 font-medium">Kort</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* List groups */}
        {groups && groups.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Lag og grupper</h2>
            <div className="space-y-2">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/stott/${organization.slug}/gruppe/${g.slug}`}
                  className="block p-4 bg-white rounded-lg border hover:border-stone-400 transition-colors"
                >
                  <div className="font-medium">{g.name}</div>
                  {g.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {g.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* List individuals */}
        {individuals && individuals.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Støtt en person direkte</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {individuals.map((i) => (
                <Link
                  key={i.id}
                  href={
                    group
                      ? `/stott/${organization.slug}/gruppe/${group.slug}/${i.slug}`
                      : `/stott/${organization.slug}/person/${i.slug}`
                  }
                  className="flex flex-col items-center p-4 bg-white rounded-lg border hover:border-stone-400 transition-colors"
                >
                  {i.photo_url ? (
                    <img
                      src={i.photo_url}
                      alt={`${i.first_name} ${i.last_name}`}
                      className="h-16 w-16 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-stone-200 flex items-center justify-center mb-2">
                      <span className="text-2xl text-stone-500">
                        {i.first_name[0]}
                        {i.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="font-medium text-sm text-center">
                    {i.first_name} {i.last_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 pt-8 pb-4">
          <p>
            Driftet av{' '}
            <Link href="/" className="hover:underline">
              MinSponsor
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
