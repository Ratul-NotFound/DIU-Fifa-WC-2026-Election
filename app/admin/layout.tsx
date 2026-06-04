'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import FootballLogo from '@/components/layout/FootballLogo';

const adminNav = [
  { href: '/admin', label: '📊 Overview', exact: true },
  { href: '/admin/election', label: '🗳️ Election Control' },
  { href: '/admin/candidates', label: '👤 Candidates' },
  { href: '/admin/teams', label: '🌍 Teams' },
  { href: '/admin/positions', label: '📋 Positions' },
  { href: '/admin/users', label: '👥 Users' },
  { href: '/admin/logs', label: '📜 Audit Logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!profile || (profile.role !== 'admin' && profile.role !== 'superAdmin'))) {
      router.replace('/dashboard');
    }
  }, [profile, loading, router]);

  if (loading) {
    return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superAdmin')) return null;

  return (
    <div className="page-wrapper">
      {/* Top bar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--nav-height)',
        background: 'var(--bg-nav)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="navbar-inner">
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', textDecoration: 'none' }}>
            <span className="navbar-brand-icon" style={{ width: '24px', height: '24px' }}>
              <FootballLogo />
            </span>
            <span>DIU FIFA <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· Admin</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="badge badge-yellow">
              {profile.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
            </span>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">← Student View</Link>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <p className="admin-nav-section">Management</p>
          {adminNav.map(item => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="admin-content">
          {/* Mobile nav tabs */}
          <div className="tabs" style={{ display: 'none' }} id="admin-mobile-nav">
            {/* handled via hamburger in full impl */}
          </div>
          {/* Mobile pill links */}
          <div className="admin-mobile-nav lg-hidden">
            {adminNav.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-mobile-tab${active ? ' active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
