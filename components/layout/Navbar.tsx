'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import FootballLogo from './FootballLogo';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vote', label: 'Vote' },
  { href: '/results', label: 'Results' },
];

export default function Navbar() {
  const { profile, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isAtTop, setIsAtTop] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin';

  return (
    <>
      <nav className={`navbar${isAtTop ? ' navbar-top' : ''}`}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <span className="navbar-brand-icon">
              <FootballLogo />
            </span>
            <span>DIU FIFA Community</span>
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            <Link
              href="/#portal-hub"
              className={`navbar-link${pathname === '/' ? ' active' : ''}`}
            >
              Community Hub
            </Link>
            <Link
              href="/#election-hub"
              className="navbar-link"
            >
              Election Hub
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`navbar-link${pathname.startsWith('/dashboard') ? ' active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/vote"
                  className={`navbar-link${pathname.startsWith('/vote') ? ' active' : ''}`}
                >
                  Vote
                </Link>
                <Link
                  href="/results"
                  className={`navbar-link${pathname.startsWith('/results') ? ' active' : ''}`}
                >
                  Results
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`navbar-link${pathname.startsWith('/admin') ? ' active' : ''}`}
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/results"
                className={`navbar-link${pathname.startsWith('/results') ? ' active' : ''}`}
              >
                Results
              </Link>
            )}
          </div>

          <div className="navbar-actions">
            {user ? (
              <Link href="/profile" className="avatar" title={profile?.name || user.email || ''} style={{ textDecoration: 'none' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  initials
                )}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}
            <button
              className="hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              id="btn-open-drawer"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`drawer${drawerOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="navbar-brand" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="navbar-brand-icon">
              <FootballLogo />
            </span>
            DIU FIFA Community
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: 'var(--space-2)' }}
            id="btn-close-drawer"
          >
            ✕
          </button>
        </div>

        {profile ? (
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Link href="/profile" className="avatar" onClick={() => setDrawerOpen(false)}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  initials
                )}
              </Link>
              <div>
                <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setDrawerOpen(false)}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile.name || 'Student'}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{profile.email}</p>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>DIU FIFA Community Portal</p>
          </div>
        )}

        <nav className="drawer-nav">
          <Link
            href="/#portal-hub"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            🌐 Community Hub
          </Link>
          <Link
            href="/#election-hub"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            🗳️ Election Hub
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`drawer-link${pathname.startsWith('/dashboard') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                📋 Dashboard
              </Link>
              <Link
                href="/vote"
                className={`drawer-link${pathname.startsWith('/vote') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                🗳️ Vote Booth
              </Link>
              <Link
                href="/results"
                className={`drawer-link${pathname.startsWith('/results') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                📊 Results
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`drawer-link${pathname.startsWith('/admin') ? ' active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  ⚙ Admin Panel
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/results"
              className={`drawer-link${pathname.startsWith('/results') ? ' active' : ''}`}
              onClick={() => setDrawerOpen(false)}
            >
              📊 Results
            </Link>
          )}
        </nav>

        <div className="drawer-footer">
          {user ? (
            <button onClick={handleLogout} className="btn btn-ghost btn-full" id="btn-drawer-logout">
              Sign Out
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary btn-full" onClick={() => setDrawerOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
