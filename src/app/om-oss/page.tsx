import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Om oss | MinSponsor',
  description: 'Les om MinSponsor og hvordan vi gjør det enklere å støtte lokalidretten.',
};

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Om MinSponsor</h1>

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-xl leading-relaxed">
              MinSponsor gjør det enkelt å støtte lokalidretten. Vi tror på at
              barn og unge fortjener mer tid til trening og lek – og mindre tid
              til dugnad og produktsalg.
            </p>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Vår misjon
              </h2>
              <p>
                Vi vil forenkle måten idrettslag får støtte på. Med MinSponsor
                kan foreldre, besteforeldre og andre støttespillere gi direkte
                til laget – uten at barna trenger å selge vafler eller lodd.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Hvorfor vi gjør dette
              </h2>
              <p>
                Idrettslag over hele Norge bruker utallige timer på dugnad og
                innsamling. Vi tror det finnes en bedre vei. En digital løsning
                som gjør det enkelt å bidra, og som lar pengene gå rett til
                formålet.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Hvem står bak
              </h2>
              <p>
                MinSponsor er utviklet i Trondheim av folk som selv har erfaring
                fra barne- og ungdomsidretten. Vi vet hvor mye arbeid som ligger
                bak hver eneste kamp og treningsøkt.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
