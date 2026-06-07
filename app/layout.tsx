import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { getLanguageServer } from '@/lib/utils/language';

export const metadata: Metadata = {
  title: 'DIU FIFA Community Portal',
  description: 'Official portal for Daffodil International University FIFA Community, gaming tournaments, and committee elections.',
  keywords: ['DIU', 'FIFA', 'election', 'vote', 'university', 'football', 'gaming', 'tournament'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLanguageServer();
  return (
    <html lang={lang}>
      {/*
        suppressHydrationWarning on <body> silences hydration mismatches
        caused by browser extensions injecting attributes (e.g. Browsec VPN,
        Grammarly, etc.) into the DOM before React hydrates. This is safe —
        it only suppresses warnings one level deep on the body element itself.
      */}
      <body suppressHydrationWarning>
        <LanguageProvider initialLang={lang}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
