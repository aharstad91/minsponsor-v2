import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SearchBox } from '@/components/search-box';
import { Heart, Star, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Støtt lokalidretten – enkelt og trygt
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gi barna mer tid til det de elsker. Ingen produktsalg, bare ren støtte direkte til laget.
          </p>

          {/* Hero Illustration */}
          <div className="mb-8">
            <Image
              src="/images/minsponsor-characters.png"
              alt="To vennlige figurer som holder et hjerte sammen"
              width={350}
              height={280}
              className="mx-auto"
              priority
            />
          </div>

          {/* Search Box */}
          <div className="mb-8">
            <SearchBox />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" pill>
              <Link href="/stott">Finn din klubb</Link>
            </Button>
            <Button asChild variant="outline" size="xl" pill>
              <Link href="/kontakt">Registrer klubb</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Er du klubbleder?{' '}
            <Link href="/kontakt" className="text-primary hover:underline">
              Kom i gang gratis →
            </Link>
          </p>
        </div>
      </section>

      {/* Why MinSponsor Section */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Hvorfor MinSponsor?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Enklere for alle – fra deg til laget
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link
              href="#hvordan"
              className="group block p-6 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                For deg som støtter
              </h3>
              <p className="text-muted-foreground text-sm">
                Slipp kakelotteri og dørsalg. Gi direkte til laget – enkelt, trygt og uten mas.
              </p>
            </Link>

            {/* Card 2 */}
            <Link
              href="#hvordan"
              className="group block p-6 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                For barna
              </h3>
              <p className="text-muted-foreground text-sm">
                Mer tid til trening og lek. Mindre fokus på penger betyr mer glede på banen.
              </p>
            </Link>

            {/* Card 3 */}
            <Link
              href="#hvordan"
              className="group block p-6 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                For klubben
              </h3>
              <p className="text-muted-foreground text-sm">
                Forutsigbare inntekter uten ekstra arbeid. Vi tar oss av det praktiske.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="hvordan" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Slik fungerer det
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Fire enkle steg – så tikker støtten inn
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-foreground">
                1
              </div>
              <h3 className="font-semibold mb-2">Finn laget</h3>
              <p className="text-sm text-muted-foreground">
                Søk opp klubben eller laget du vil støtte.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-foreground">
                2
              </div>
              <h3 className="font-semibold mb-2">Velg beløp</h3>
              <p className="text-sm text-muted-foreground">
                Bestem hvor mye du vil gi – engang eller månedlig.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-foreground">
                3
              </div>
              <h3 className="font-semibold mb-2">Betal trygt</h3>
              <p className="text-sm text-muted-foreground">
                Sikker betaling med kort.
              </p>
            </div>

            {/* Step 4 - Filled */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary-foreground">
                4
              </div>
              <h3 className="font-semibold mb-2">Pengene tikker inn</h3>
              <p className="text-sm text-muted-foreground">
                Laget mottar hele støttebeløpet automatisk.
              </p>
            </div>
          </div>

          <p className="text-center text-muted-foreground mt-12 mb-8">
            50 kr i måneden = én ekstra treningsøkt for hele laget
          </p>

          <div className="text-center">
            <Button asChild size="xl" pill>
              <Link href="/stott">Finn din klubb</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-12 px-4 bg-[#3d3228]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/80 mb-4">
            Vil du se hvordan det fungerer i praksis?
          </p>
          <Button asChild variant="secondary" size="lg" pill className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Link href="/stott/heimdal-handball/gruppe/gutter-2009">
              Se demo: Støtt Gutter 2009 →
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
