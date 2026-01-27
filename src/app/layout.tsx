import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'MinSponsor - Moderne dugnad for norsk idrett',
    template: '%s | MinSponsor',
  },
  description:
    'Støtt lokale idrettslag med månedlige bidrag via Vipps eller kort. En enklere måte å drive dugnad på.',
  keywords: [
    'dugnad',
    'idrett',
    'sponsing',
    'støtte',
    'vipps',
    'idrettslag',
    'fundraising',
  ],
  authors: [{ name: 'MinSponsor' }],
  openGraph: {
    title: 'MinSponsor - Moderne dugnad for norsk idrett',
    description:
      'Støtt lokale idrettslag med månedlige bidrag via Vipps eller kort.',
    url: 'https://minsponsor.no',
    siteName: 'MinSponsor',
    locale: 'nb_NO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
