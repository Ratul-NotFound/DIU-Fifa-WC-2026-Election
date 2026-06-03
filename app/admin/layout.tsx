import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server/auth';
import { fetchUserProfile } from '@/lib/server/firestore';
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const profile = await fetchUserProfile(sessionUser.uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'superAdmin')) {
    redirect('/dashboard');
  }

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
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-link"
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
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }} className="md-hidden">
            {adminNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="tab"
                style={{ whiteSpace: 'nowrap', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
