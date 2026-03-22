import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SearchBox } from '@/components/search-box';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, User } from 'lucide-react';
import { canAcceptPayments } from '@/lib/database.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finn din klubb | MinSponsor',
  description:
    'Se alle klubber og lag du kan støtte via MinSponsor. Finn din klubb og gi direkte støtte.',
};

export default async function StottPage() {
  const supabase = await createClient();

  const { data: organizations } = await supabase
    .from('organizations')
    .select(`
      *,
      groups (id),
      individuals (id)
    `)
    .eq('status', 'active')
    .order('name');

  const orgs = organizations ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Finn din klubb
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Velg klubben eller laget du vil støtte. Pengene går direkte til
              mottaker.
            </p>
            <SearchBox />
          </div>

          {orgs.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ingen klubber er registrert ennå.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {orgs.length} {orgs.length === 1 ? 'klubb' : 'klubber'}{' '}
                tilgjengelig
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {orgs.map((org) => {
                  const groupCount = org.groups?.length ?? 0;
                  const individualCount = org.individuals?.length ?? 0;
                  const accepts = canAcceptPayments(org);

                  return (
                    <Link
                      key={org.id}
                      href={`/stott/${org.slug}`}
                      className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-14 h-14 rounded-xl object-contain flex-shrink-0 bg-accent/20 p-1"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-accent/30 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-7 w-7 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-lg">
                          {org.name}
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 mt-1">
                          {org.category}
                        </Badge>
                        {org.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {org.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {groupCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {groupCount}{' '}
                              {groupCount === 1 ? 'gruppe' : 'grupper'}
                            </span>
                          )}
                          {individualCount > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {individualCount}{' '}
                              {individualCount === 1 ? 'person' : 'personer'}
                            </span>
                          )}
                          {!accepts && (
                            <Badge variant="warning">
                              Ikke klar for betaling
                            </Badge>
                          )}
                          {org.vipps_enabled && (
                            <Badge variant="outline" className="text-[#FF5B24] border-[#FF5B24]/30">Vipps</Badge>
                          )}
                          {org.stripe_charges_enabled && (
                            <Badge variant="outline" className="text-primary border-primary/30">Kort</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
