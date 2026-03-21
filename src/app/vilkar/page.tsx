import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';

export const metadata = {
  title: 'Salgsvilkår | MinSponsor',
  description: 'Salgsvilkår og betingelser for bruk av MinSponsor.',
};

export default function VilkarPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Salgsvilkår
          </h1>
          <p className="text-muted-foreground mb-12">
            Sist oppdatert: 21. mars 2026
          </p>

          <div className="prose prose-lg max-w-none space-y-10 text-muted-foreground">
            {/* 1. Parter */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Parter
              </h2>
              <p>
                Disse salgsvilkårene gjelder for kjøp av tjenester via
                MinSponsor, en tjeneste levert av:
              </p>
              <div className="bg-card rounded-2xl border border-border p-6 mt-4">
                <p className="text-foreground font-medium">Samhold AS</p>
                <p>Org.nr: 933 649 115</p>
                <p>Trondheim, Norge</p>
                <p>
                  E-post:{' '}
                  <a
                    href="mailto:hei@minsponsor.no"
                    className="text-primary hover:underline"
                  >
                    hei@minsponsor.no
                  </a>
                </p>
              </div>
              <p className="mt-4">
                Kjøper er den person som gjennomfører en betaling eller
                oppretter et abonnement via MinSponsor.
              </p>
            </section>

            {/* 2. Tjenesten */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Tjenesten
              </h2>
              <p>
                MinSponsor er en digital plattform som formidler økonomisk støtte
                (sponsing) fra privatpersoner til idrettslag, grupper og
                enkeltutøvere. Tjenesten tilbyr:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">
                    Månedlig støtteabonnement:
                  </strong>{' '}
                  Fast månedlig betaling til valgt mottaker.
                </li>
                <li>
                  <strong className="text-foreground">
                    Engangsstøtte:
                  </strong>{' '}
                  Enkeltbetaling til valgt mottaker.
                </li>
              </ul>
            </section>

            {/* 3. Betaling */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Betaling
              </h2>
              <p>MinSponsor tilbyr følgende betalingsmetoder:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Kortbetaling</strong>{' '}
                  (Visa, Mastercard, Apple Pay, Google Pay) via Stripe.
                </li>
                <li>
                  <strong className="text-foreground">Vipps</strong> for
                  månedlige abonnementer.
                </li>
              </ul>
              <p className="mt-4">
                All betaling håndteres av tredjepartsleverandører (Stripe og
                Vipps MobilePay) og er sikret med bransjestandard kryptering. Vi
                lagrer aldri kort- eller betalingsinformasjon.
              </p>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                Plattformavgift
              </h3>
              <p>
                MinSponsor legger på en plattformavgift på 10 % av
                støttebeløpet. Avgiften dekker drift av plattformen og
                betalingsgebyrer. Totalbeløpet (støtte + avgift) vises tydelig
                før betaling gjennomføres.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Eksempel:</strong> Hvis du
                velger å støtte med 100 kr, blir totalbeløpet 110 kr (100 kr til
                mottaker + 10 kr i plattformavgift).
              </p>
            </section>

            {/* 4. Levering */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Levering
              </h2>
              <p>
                MinSponsor er en digital tjeneste. Det leveres ingen fysiske
                varer. Tjenesten leveres umiddelbart etter gjennomført betaling:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  Støttebeløpet overføres til mottakerens konto via
                  betalingsplattformen.
                </li>
                <li>
                  Du mottar en bekreftelse på e-post etter gjennomført betaling.
                </li>
                <li>
                  For månedlige abonnementer trekkes beløpet automatisk hver
                  måned.
                </li>
              </ul>
            </section>

            {/* 5. Abonnement og oppsigelse */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Abonnement og oppsigelse
              </h2>
              <p>
                Månedlige støtteabonnementer har <strong className="text-foreground">ingen bindingstid</strong>.
                Du kan når som helst si opp abonnementet ditt.
              </p>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                Slik sier du opp
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Stripe (kort):</strong>{' '}
                  Bruk lenken i bekreftelsesmailen for å administrere
                  abonnementet, eller kontakt oss på{' '}
                  <a
                    href="mailto:hei@minsponsor.no"
                    className="text-primary hover:underline"
                  >
                    hei@minsponsor.no
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-foreground">Vipps:</strong> Administrer
                  avtalen direkte i Vipps-appen under «Faste betalinger», eller
                  kontakt oss.
                </li>
              </ul>
              <p className="mt-4">
                Oppsigelse trer i kraft umiddelbart. Allerede betalte beløp
                refunderes ikke, men det trekkes ingen flere beløp etter
                oppsigelse.
              </p>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                Endring av abonnement
              </h3>
              <p>
                Ønsker du å endre beløp eller mottaker, kan du si opp
                eksisterende abonnement og opprette et nytt. Kontakt oss dersom
                du trenger hjelp.
              </p>
            </section>

            {/* 6. Angrerett */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Angrerett
              </h2>
              <p>
                Støttebetalinger via MinSponsor er frivillige bidrag til
                idrettslag og foreninger. Siden tjenesten leveres umiddelbart
                etter betaling (pengene overføres til mottaker), gjelder
                følgende:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Engangsstøtte:</strong>{' '}
                  Angrerett gjelder i henhold til angrerettloven. Vær
                  oppmerksom på at beløpet kan allerede være overført til
                  mottaker.
                </li>
                <li>
                  <strong className="text-foreground">
                    Månedlig abonnement:
                  </strong>{' '}
                  Du kan når som helst avslutte abonnementet (se punkt 5).
                  Allerede gjennomførte trekk refunderes ikke.
                </li>
              </ul>
              <p className="mt-4">
                Ønsker du å benytte angreretten, kontakt oss på{' '}
                <a
                  href="mailto:hei@minsponsor.no"
                  className="text-primary hover:underline"
                >
                  hei@minsponsor.no
                </a>{' '}
                innen 14 dager etter kjøpet.
              </p>
            </section>

            {/* 7. Retur */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Retur og refusjon
              </h2>
              <p>
                MinSponsor er en digital tjeneste uten fysiske varer. Det er
                derfor ingen returordning. For spørsmål om refusjon, se punkt 6
                om angrerett eller kontakt oss.
              </p>
            </section>

            {/* 8. Reklamasjon */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Reklamasjonshåndtering
              </h2>
              <p>
                Dersom du opplever feil med betalingen, doble trekk, eller andre
                problemer med tjenesten, kontakt oss så raskt som mulig:
              </p>
              <div className="bg-card rounded-2xl border border-border p-6 mt-4">
                <p>
                  E-post:{' '}
                  <a
                    href="mailto:hei@minsponsor.no"
                    className="text-primary hover:underline"
                  >
                    hei@minsponsor.no
                  </a>
                </p>
              </div>
              <p className="mt-4">
                Vi behandler alle henvendelser innen 3 virkedager. Ved
                feilbelastning vil vi sørge for refusjon så raskt som mulig.
              </p>
            </section>

            {/* 9. Konfliktløsning */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Konfliktløsning
              </h2>
              <p>
                Klager rettes først til Samhold AS. Partene skal forsøke å løse
                tvister i minnelighet.
              </p>
              <p className="mt-4">
                Dersom det ikke oppnås enighet, kan saken bringes inn for{' '}
                <a
                  href="https://www.forbrukerradet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Forbrukerrådet
                </a>{' '}
                for mekling. Forbrukere kan også benytte{' '}
                <a
                  href="https://www.forbrukertilsynet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Forbrukertilsynet
                </a>{' '}
                for veiledning.
              </p>
              <p className="mt-4">
                Tvister som ikke løses ved mekling, avgjøres ved de alminnelige
                domstolene med Trøndelag tingrett som verneting.
              </p>
            </section>

            {/* 10. Endringer */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Endringer i vilkårene
              </h2>
              <p>
                Samhold AS forbeholder seg retten til å oppdatere disse
                vilkårene. Vesentlige endringer vil bli varslet via e-post til
                aktive abonnenter. Fortsatt bruk av tjenesten etter endringer
                innebærer aksept av de oppdaterte vilkårene.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
