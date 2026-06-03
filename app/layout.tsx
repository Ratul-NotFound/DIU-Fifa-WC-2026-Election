import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'DIU FIFA Election Platform',
  description: 'Official voting platform for DIU FIFA World Cup committee elections. Vote for your national team representatives.',
  keywords: ['DIU', 'FIFA', 'election', 'vote', 'university', 'football'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        suppressHydrationWarning on <body> silences hydration mismatches
        caused by browser extensions injecting attributes (e.g. Browsec VPN,
        Grammarly, etc.) into the DOM before React hydrates. This is safe —
        it only suppresses warnings one level deep on the body element itself.
      */}
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
