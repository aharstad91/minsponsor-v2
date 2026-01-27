import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#3d3228] text-white/90">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-bold text-white">
              MinSponsor
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              Gjør dugnaden digital og enkel. Vi hjelper norske lag og foreninger med å realisere drømmene sine.
            </p>
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Samhold AS
            </p>
          </div>

          {/* For supportere */}
          <div>
            <h4 className="font-semibold text-white mb-4">For supportere</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/stott" className="text-white/70 hover:text-white transition-colors">
                  Finn lag
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/70 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* For klubber */}
          <div>
            <h4 className="font-semibold text-white mb-4">For klubber</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/kontakt" className="text-white/70 hover:text-white transition-colors">
                  Registrer klubb
                </Link>
              </li>
              <li>
                <Link href="/faq#for-klubber" className="text-white/70 hover:text-white transition-colors">
                  Slik fungerer det
                </Link>
              </li>
            </ul>
          </div>

          {/* Om MinSponsor */}
          <div>
            <h4 className="font-semibold text-white mb-4">Om MinSponsor</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/om-oss" className="text-white/70 hover:text-white transition-colors">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-white/70 hover:text-white transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} MinSponsor</p>
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Sikker betaling via Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
