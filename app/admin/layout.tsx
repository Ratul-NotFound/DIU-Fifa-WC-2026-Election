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
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!profile || (profile.role !== 'admin' && profile.role !== 'superAdmin'))) {
      router.replace('/dashboard');
    }
  }, [profile, loading, router]);

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  if (loading) {
    return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superAdmin')) return null;

  return (
    <div className="page-wrapper">
      {/* Top bar */}
      <header className="admin-header">
        <div className="navbar-inner">
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', textDecoration: 'none' }}>
            <span className="navbar-brand-icon" style={{ width: '24px', height: '24px' }}>
              <FootballLogo />
            </span>
            <span>DIU FIFA <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· Admin</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span className="badge" style={{
              background: profile.role === 'superAdmin' 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              color: profile.role === 'superAdmin' ? '#f59e0b' : '#3b82f6',
              border: profile.role === 'superAdmin' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: profile.role === 'superAdmin' ? '0 0 10px rgba(245, 158, 11, 0.1)' : '0 0 10px rgba(59, 130, 246, 0.1)',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              {profile.role === 'superAdmin' ? '★ SUPER ADMIN' : '◆ ADMIN'}
            </span>
            
            <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ 
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 14px',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition)'
            }}>
              <span>← Student View</span>
            </Link>

            {user && (
              <Link href="/profile" className="avatar" title={profile?.name || user.email || ''} style={{ textDecoration: 'none', width: '32px', height: '32px', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{initials}</span>
                )}
              </Link>
            )}
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
