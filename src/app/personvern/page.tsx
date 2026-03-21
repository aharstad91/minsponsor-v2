import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Personvernerklæring | MinSponsor',
  description: 'Les om hvordan MinSponsor behandler personopplysninger.',
};

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Personvernerklæring
          </h1>
          <p className="text-muted-foreground mb-12">
            Sist oppdatert: 21. mars 2026
          </p>

          <div className="prose prose-lg max-w-none space-y-10 text-muted-foreground">
            {/* 1. Behandlingsansvarlig */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Behandlingsansvarlig
              </h2>
              <p>
                Samhold AS (org.nr 933 649 115) er behandlingsansvarlig for
                personopplysninger som samles inn via MinSponsor.
              </p>
              <p className="mt-2">
                Kontakt:{' '}
                <a
                  href="mailto:hei@minsponsor.no"
                  className="text-primary hover:underline"
                >
                  hei@minsponsor.no
                </a>
              </p>
            </section>

            {/* 2. Hvilke opplysninger */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Hvilke opplysninger vi samler inn
              </h2>
              <p>Vi samler inn følgende opplysninger når du bruker MinSponsor:</p>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                Ved betaling / opprettelse av abonnement
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Navn</li>
                <li>E-postadresse</li>
                <li>Telefonnummer (ved Vipps-betaling)</li>
                <li>Betalingsinformasjon (håndteres av Stripe/Vipps, lagres ikke hos oss)</li>
              </ul>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                Teknisk informasjon
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP-adresse og nettleserinformasjon (via server-logger)</li>
                <li>Informasjonskapsler for funksjonalitet</li>
              </ul>
            </section>

            {/* 3. Formål */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Formål med behandlingen
              </h2>
              <p>Vi bruker personopplysningene dine til å:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Gjennomføre og administrere betalinger og abonnementer</li>
                <li>Sende bekreftelser og kvitteringer på e-post</li>
                <li>Håndtere kundehenvendelser og support</li>
                <li>Overholde lovpålagte krav (regnskap, skatt)</li>
              </ul>
              <p className="mt-4">
                Behandlingsgrunnlaget er GDPR artikkel 6 (1) bokstav b (oppfyllelse av avtale)
                og bokstav f (berettiget interesse for drift og forbedring av tjenesten).
              </p>
            </section>

            {/* 4. Deling */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Deling av opplysninger
              </h2>
              <p>Vi deler personopplysninger med følgende tredjeparter:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Stripe</strong> – for
                  kortbetalinger (USA, EU/EØS-godkjent via Standard Contractual Clauses)
                </li>
                <li>
                  <strong className="text-foreground">Vipps MobilePay</strong> –
                  for Vipps-betalinger (Norge)
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> –
                  database og autentisering (EU-basert)
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> –
                  e-postutsending
                </li>
                <li>
                  <strong className="text-foreground">Mottaker-organisasjon</strong> –
                  navn og e-post deles med idrettslaget du støtter, slik at de
                  kan se hvem som støtter dem
                </li>
              </ul>
              <p className="mt-4">
                Vi selger aldri personopplysningene dine til tredjeparter.
              </p>
            </section>

            {/* 5. Lagring */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Lagring og sletting
              </h2>
              <p>
                Personopplysninger lagres så lenge det er nødvendig for formålet
                de ble samlet inn for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Aktive abonnementer:</strong>{' '}
                  Opplysninger lagres så lenge abonnementet er aktivt.
                </li>
                <li>
                  <strong className="text-foreground">Etter oppsigelse:</strong>{' '}
                  Transaksjonsdata oppbevares i 5 år i henhold til
                  bokføringsloven.
                </li>
                <li>
                  <strong className="text-foreground">Inaktive kontoer:</strong>{' '}
                  Opplysninger slettes etter rimelig tid dersom det ikke finnes
                  aktive abonnementer eller lovpålagt lagringsplikt.
                </li>
              </ul>
            </section>

            {/* 6. Dine rettigheter */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Dine rettigheter
              </h2>
              <p>I henhold til GDPR har du rett til å:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Innsyn:</strong> Be om
                  kopi av opplysningene vi har om deg.
                </li>
                <li>
                  <strong className="text-foreground">Retting:</strong> Be om at
                  uriktige opplysninger korrigeres.
                </li>
                <li>
                  <strong className="text-foreground">Sletting:</strong> Be om
                  at opplysningene dine slettes (med forbehold om lovpålagt
                  lagring).
                </li>
                <li>
                  <strong className="text-foreground">Dataportabilitet:</strong>{' '}
                  Be om å få utlevert opplysningene i et maskinlesbart format.
                </li>
                <li>
                  <strong className="text-foreground">Protest:</strong> Protestere
                  mot behandling basert på berettiget interesse.
                </li>
              </ul>
              <p className="mt-4">
                For å utøve dine rettigheter, kontakt oss på{' '}
                <a
                  href="mailto:hei@minsponsor.no"
                  className="text-primary hover:underline"
                >
                  hei@minsponsor.no
                </a>
                . Vi svarer innen 30 dager.
              </p>
            </section>

            {/* 7. Informasjonskapsler */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Informasjonskapsler (cookies)
              </h2>
              <p>
                MinSponsor bruker kun nødvendige informasjonskapsler for
                funksjonalitet og innlogging. Vi bruker ikke
                informasjonskapsler til markedsføring eller sporing.
              </p>
            </section>

            {/* 8. Klage */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Klage til Datatilsynet
              </h2>
              <p>
                Dersom du mener at vi behandler personopplysninger i strid med
                regelverket, kan du klage til{' '}
                <a
                  href="https://www.datatilsynet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Datatilsynet
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
