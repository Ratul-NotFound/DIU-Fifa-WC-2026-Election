import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'DIU FIFA Community Portal',
  description: 'Official portal for Daffodil International University FIFA Community, gaming tournaments, and committee elections.',
  keywords: ['DIU', 'FIFA', 'election', 'vote', 'university', 'football', 'gaming', 'tournament'],
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
