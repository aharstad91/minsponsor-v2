import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            MinSponsor
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Moderne dugnad for norsk idrett
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La supportere støtte klubben med månedlige bidrag via Vipps eller
            kort. Enklere enn å selge vafler, mer forutsigbart enn lotteri.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/admin">Registrer din klubb</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#hvordan">Slik fungerer det</a>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hvordan" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Slik fungerer det
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏟️</div>
                <h3 className="font-semibold mb-2">1. Klubben registrerer seg</h3>
                <p className="text-gray-600 text-sm">
                  Koble til Vipps og/eller Stripe for å motta betalinger direkte
                  til klubbens konto.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="font-semibold mb-2">2. Del støttesiden</h3>
                <p className="text-gray-600 text-sm">
                  Hver klubb, lag og spiller får sin egen side som kan deles med
                  venner og familie.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="font-semibold mb-2">3. Motta støtte</h3>
                <p className="text-gray-600 text-sm">
                  Supportere velger beløp og betaler enkelt med Vipps eller kort.
                  Pengene går rett til klubben.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Hvorfor MinSponsor?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold mb-1">Vipps-betaling</h3>
                <p className="text-gray-600 text-sm">
                  Nordmenn stoler på Vipps. Høyere konvertering enn
                  tradisjonelle betalingsmetoder.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold mb-1">Forutsigbare inntekter</h3>
                <p className="text-gray-600 text-sm">
                  Månedlige bidrag gir stabil økonomi. Lettere å planlegge enn
                  engangsinnsats.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold mb-1">Støtt enkeltspillere</h3>
                <p className="text-gray-600 text-sm">
                  Familie og venner kan støtte sitt barnebarn eller venn
                  direkte.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold mb-1">Ingen oppsett</h3>
                <p className="text-gray-600 text-sm">
                  Vi setter opp alt. Dere trenger bare å dele lenken.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Enkelt prismodell</h2>
          <p className="text-gray-600 mb-8">
            Ingen månedskostnad. Vi tar 10% av hvert bidrag for å dekke drift og
            utvikling.
          </p>
          <Card className="max-w-sm mx-auto">
            <CardContent className="p-6">
              <div className="text-4xl font-bold mb-2">10%</div>
              <div className="text-gray-600">av hvert bidrag</div>
              <div className="text-sm text-gray-500 mt-4">
                + betalingsleverandørens gebyr (Vipps/Stripe)
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Klar til å komme i gang?</h2>
          <p className="text-gray-600 mb-8">
            Kontakt oss for å registrere din klubb. Vi hjelper deg med alt
            oppsettet.
          </p>
          <Button asChild size="lg">
            <a href="mailto:hei@minsponsor.no">Ta kontakt</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} MinSponsor. Alle rettigheter reservert.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/vilkar" className="text-gray-600 hover:text-gray-900">
              Vilkår
            </Link>
            <Link
              href="/personvern"
              className="text-gray-600 hover:text-gray-900"
            >
              Personvern
            </Link>
            <a
              href="mailto:hei@minsponsor.no"
              className="text-gray-600 hover:text-gray-900"
            >
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
