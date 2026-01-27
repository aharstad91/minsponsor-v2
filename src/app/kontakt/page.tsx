import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Mail, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Kontakt oss | MinSponsor',
  description: 'Ta kontakt med MinSponsor. Vi hjelper deg gjerne!',
};

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Kontakt oss
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Har du spørsmål eller ønsker å registrere klubben din? Vi hører
            gjerne fra deg!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                E-post
              </h2>
              <a
                href="mailto:hei@minsponsor.no"
                className="text-primary hover:underline text-lg"
              >
                hei@minsponsor.no
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Vi svarer vanligvis innen 1-2 virkedager.
              </p>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Lokasjon
              </h2>
              <p className="text-foreground text-lg">Trondheim, Norge</p>
              <p className="text-sm text-muted-foreground mt-2">
                Vi holder til i Norges teknologihovedstad.
              </p>
            </div>
          </div>

          {/* For clubs */}
          <div className="mt-12 bg-primary/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Er du klubbleder?
            </h2>
            <p className="text-muted-foreground mb-6">
              Vil du at klubben din skal kunne motta støtte via MinSponsor? Det
              er helt gratis å komme i gang, og vi hjelper deg med oppsettet.
            </p>
            <a
              href="mailto:hei@minsponsor.no?subject=Registrering av klubb"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Send oss en e-post
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
