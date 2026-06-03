import Link from 'next/link';
import FootballLogo from './FootballLogo';
import type { UserProfile } from '@/lib/types';

interface NavbarServerProps {
  profile?: UserProfile | null;
}

export default function NavbarServer({ profile }: NavbarServerProps) {
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin';
  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <input type="checkbox" id="nav-toggle" className="nav-toggle" />
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href={profile ? '/dashboard' : '/'} className="navbar-brand">
            <span className="navbar-brand-icon">
              <FootballLogo />
            </span>
            <span>DIU FIFA</span>
          </Link>

          <div className="navbar-links">
            {profile ? (
              <>
                <Link href="/dashboard" className="navbar-link">Dashboard</Link>
                <Link href="/vote" className="navbar-link">Vote</Link>
                <Link href="/results" className="navbar-link">Results</Link>
                {isAdmin && (
                  <Link href="/admin" className="navbar-link">Admin</Link>
                )}
              </>
            ) : (
              <Link href="/results" className="navbar-link">Results</Link>
            )}
          </div>

          <div className="navbar-actions">
            {profile ? (
              <Link href="/profile" className="avatar" title={profile.name || profile.email || ''} style={{ textDecoration: 'none' }}>
                {initials}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
            )}

            <label htmlFor="nav-toggle" className="hamburger" aria-label="Open menu">
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </label>
          </div>
        </div>
      </nav>

      <label htmlFor="nav-toggle" className="drawer-overlay" aria-hidden="true" />
      <div className="drawer">
        <div className="drawer-header">
          <span className="navbar-brand" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="navbar-brand-icon">
              <FootballLogo />
            </span>
            DIU FIFA
          </span>
          <label
            htmlFor="nav-toggle"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: 'var(--space-2)' }}
            aria-label="Close menu"
          >
            ✕
          </label>
        </div>

        {profile ? (
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="avatar">{initials}</div>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile.name || 'Student'}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{profile.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>DIU FIFA World Cup Election</p>
          </div>
        )}

        <nav className="drawer-nav">
          {profile ? (
            <>
              <Link href="/dashboard" className="drawer-link">Dashboard</Link>
              <Link href="/vote" className="drawer-link">Vote</Link>
              <Link href="/results" className="drawer-link">Results</Link>
              {isAdmin && (
                <Link href="/admin" className="drawer-link">⚙ Admin Panel</Link>
              )}
            </>
          ) : (
            <Link href="/results" className="drawer-link">📊 Results</Link>
          )}
        </nav>

        <div className="drawer-footer">
          {profile ? (
            <Link href="/profile" className="btn btn-ghost btn-full">Profile</Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-full">Sign In</Link>
          )}
        </div>
      </div>
    </>
  );
}
