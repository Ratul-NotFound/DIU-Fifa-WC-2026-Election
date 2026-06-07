'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import FootballLogo from './FootballLogo';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vote', label: 'Vote' },
  { href: '/standings', label: 'Standings' },
];

export default function Navbar() {
  const { profile, user } = useAuth();
  const { lang, setLang, t } = useLanguage();
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
            <span className="navbar-brand-text">{t.appName}</span>
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`navbar-link${pathname.startsWith('/dashboard') ? ' active' : ''}`}
                >
                  {t.navDashboard}
                </Link>
                <Link
                  href="/vote"
                  className={`navbar-link${pathname.startsWith('/vote') ? ' active' : ''}`}
                >
                  {t.navVote}
                </Link>
                <Link
                  href="/standings"
                  className={`navbar-link${pathname.startsWith('/standings') ? ' active' : ''}`}
                >
                  {t.navStandings}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`navbar-link${pathname.startsWith('/admin') ? ' active' : ''}`}
                  >
                    {t.navAdmin}
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/standings"
                className={`navbar-link${pathname.startsWith('/standings') ? ' active' : ''}`}
              >
                {t.navStandings}
              </Link>
            )}
          </div>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Language Selector */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
              title={lang === 'en' ? 'বাংলা সংস্করণ' : 'English version'}
            >
              🌐 {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

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
                {t.navSignIn}
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
        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="navbar-brand" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="navbar-brand-icon">
              <FootballLogo />
            </span>
            <span className="navbar-brand-text">{t.appName}</span>
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="drawer-close-btn"
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
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t.appName} {lang === 'en' ? 'Portal' : 'পোর্টাল'}</p>
          </div>
        )}

        <nav className="drawer-nav">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`drawer-link${pathname.startsWith('/dashboard') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                📋 {t.navDashboard}
              </Link>
              <Link
                href="/vote"
                className={`drawer-link${pathname.startsWith('/vote') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                🗳️ {t.navVote}
              </Link>
              <Link
                href="/standings"
                className={`drawer-link${pathname.startsWith('/standings') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                📊 {t.navStandings}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`drawer-link${pathname.startsWith('/admin') ? ' active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  ⚙ {t.navAdmin}
                </Link>
              )}
              <button
                onClick={() => {
                  setLang(lang === 'en' ? 'bn' : 'en');
                  setDrawerOpen(false);
                }}
                className="drawer-link"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                🌐 {lang === 'en' ? 'বাংলা সংস্করণ (BN)' : 'English Version (EN)'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/standings"
                className={`drawer-link${pathname.startsWith('/standings') ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                📊 {t.navStandings}
              </Link>
              <button
                onClick={() => {
                  setLang(lang === 'en' ? 'bn' : 'en');
                  setDrawerOpen(false);
                }}
                className="drawer-link"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                🌐 {lang === 'en' ? 'বাংলা সংস্করণ (BN)' : 'English Version (EN)'}
              </button>
            </>
          )}
        </nav>

        <div className="drawer-footer">
          {user ? (
            <button onClick={handleLogout} className="btn btn-ghost btn-full" id="btn-drawer-logout">
              {t.navSignOut}
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary btn-full" onClick={() => setDrawerOpen(false)}>
              {t.navSignIn}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
