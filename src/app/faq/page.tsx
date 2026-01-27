import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Ofte stilte spørsmål | MinSponsor',
  description: 'Finn svar på vanlige spørsmål om MinSponsor.',
};

const faqs = [
  {
    question: 'Hva er MinSponsor?',
    answer:
      'MinSponsor er en plattform som gjør det enkelt å støtte lokale idrettslag. Foreldre, besteforeldre og andre kan gi direkte bidrag til klubben eller laget – uten produktsalg eller kompliserte dugnader.',
  },
  {
    question: 'Hvordan fungerer det?',
    answer:
      'Finn laget du vil støtte, velg et beløp (engang eller månedlig), og betal trygt med kort. Pengene går direkte til laget.',
  },
  {
    question: 'Hvor mye går til laget?',
    answer:
      'Hele støttebeløpet ditt går til laget. MinSponsor legger på en liten plattformavgift på 10% som dekker driftskostnader og betalingsgebyrer.',
  },
  {
    question: 'Er betalingen sikker?',
    answer:
      'Ja! All betaling håndteres av Stripe, en av verdens mest brukte betalingsløsninger. Vi lagrer aldri kortinformasjon.',
  },
  {
    question: 'Kan jeg avslutte et månedlig bidrag?',
    answer:
      'Ja, du kan når som helst avslutte et månedlig bidrag. Du vil få en e-post med lenke til å administrere abonnementet ditt.',
  },
  {
    question: 'Hvordan registrerer jeg klubben min?',
    answer:
      'Ta kontakt med oss på hei@minsponsor.no, så hjelper vi deg i gang. Det er gratis å registrere klubben.',
  },
  {
    question: 'Får jeg skattefradrag?',
    answer:
      'Skattefradrag for gaver til idrettslag krever at organisasjonen er registrert i Frivillighetsregisteret og har godkjenning fra Skatteetaten. Ta kontakt med klubben for å høre om de har dette på plass.',
  },
  {
    question: 'Støtter dere Vipps?',
    answer:
      'Vi jobber med å få på plass Vipps-betaling. Foreløpig støtter vi kortbetaling via Stripe, inkludert Apple Pay og Google Pay.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Ofte stilte spørsmål
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Finn svar på de vanligste spørsmålene om MinSponsor.
          </p>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {faq.question}
                </h2>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-accent/20 rounded-2xl text-center">
            <p className="text-foreground mb-2">
              Finner du ikke svar på spørsmålet ditt?
            </p>
            <p className="text-muted-foreground">
              Ta kontakt med oss på{' '}
              <a
                href="mailto:hei@minsponsor.no"
                className="text-primary hover:underline"
              >
                hei@minsponsor.no
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
