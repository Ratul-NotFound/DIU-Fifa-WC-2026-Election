'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname === '/results';

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace('/login');
    }
  }, [user, loading, router, isPublicRoute]);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user && !isPublicRoute) return null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
