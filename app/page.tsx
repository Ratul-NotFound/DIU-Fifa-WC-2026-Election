import Link from 'next/link';
import type { Metadata } from 'next';
import { getElectionSettings } from '@/lib/firebase/firestore';
import { getTeamFlagUrl } from '@/lib/utils/helpers';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'DIU FIFA World Cup Election Platform',
  description: 'Vote for your DIU university football committee. Official FIFA election system for Daffodil International University students.',
};

// Render at request time — election status is dynamic
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  let electionStatus = 'draft';
  try {
    const settings = await getElectionSettings();
    if (settings) electionStatus = settings.status;
  } catch {
    // Firestore not configured yet — show default
  }

  const features = [
    { icon: '🗳️', title: 'Secure Voting', desc: 'Firestore transaction-safe one vote per position. Tamper-proof.' },
    { icon: '📊', title: 'Live Results', desc: 'Pre-aggregated scores updated in real time with polling.' },
    { icon: '🔐', title: 'DIU Only', desc: 'Restricted to verified @diu.edu.bd university accounts.' },
    { icon: '⚡', title: 'Lightning Fast', desc: 'Static pages, minimal JS. Sub-second load time.' },
    { icon: '📱', title: 'Mobile First', desc: 'Designed for thumbs. Works flawlessly on any screen.' },
    { icon: '🏆', title: 'FIFA Inspired', desc: 'Professional scoreboard-style election dashboard.' },
  ];

  const teams = [
    { name: 'Mexico (Co-host)', flag: '🇲🇽', bgColor: '#1b4332', textColor: '#ffffff', region: 'CONCACAF · Co-host' },
    { name: 'Canada (Co-host)', flag: '🇨🇦', bgColor: '#c8102e', textColor: '#ffffff', region: 'CONCACAF · Co-host' },
    { name: 'South Africa', flag: '🇿🇦', bgColor: '#007a4d', textColor: '#ffffff', region: 'CAF · Former Host' },
    { name: 'South Korea', flag: '🇰🇷', bgColor: '#0f2042', textColor: '#ffffff', region: 'AFC · Tigers of Asia' },
    { name: 'Paraguay', flag: '🇵🇾', bgColor: '#0038a8', textColor: '#ffffff', region: 'CONMEBOL · La Albirroja' },
    { name: 'Germany', flag: '🇩🇪', bgColor: '#111111', textColor: '#ffffff', region: 'UEFA · 4-Time Champ' },
    { name: 'Netherlands', flag: '🇳🇱', bgColor: '#ff4f00', textColor: '#ffffff', region: 'UEFA · Oranje' },
    { name: 'Belgium', flag: '🇧🇪', bgColor: '#2d2d2d', textColor: '#ffffff', region: 'UEFA · Red Devils' },
    { name: 'Spain', flag: '🇪🇸', bgColor: '#ad1519', textColor: '#ffffff', region: 'UEFA · 2010 Champ' },
    { name: 'Portugal', flag: '🇵🇹', bgColor: '#7f0e1c', textColor: '#ffffff', region: 'UEFA · A Seleção' },
    { name: 'Brazil', flag: '🇧🇷', bgColor: '#009739', textColor: '#ffffff', region: 'CONMEBOL · 5-Time Champ' },
    { name: 'Argentina', flag: '🇦🇷', bgColor: '#75aadb', textColor: '#ffffff', region: 'CONMEBOL · Defending Champ' },
    { name: 'France', flag: '🇫🇷', bgColor: '#002395', textColor: '#ffffff', region: 'UEFA · 2-Time Champ' },
    { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bgColor: '#ffffff', textColor: '#ffffff', region: 'UEFA · Three Lions' },
    { name: 'Morocco', flag: '🇲🇦', bgColor: '#c1272d', textColor: '#ffffff', region: 'CAF · Atlas Lions' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ── Global Navbar Wrapper ── */}
      <Navbar />

      <div className="page-wrapper" style={{ paddingTop: 'var(--nav-height)' }}>
        {/* ── Hero ── */}
        <section className="hero" style={{ 
          marginTop: 0,
        }}>
          <div className="hero-content">
            {electionStatus === 'live' && (
              <div className="live-dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '6px 14px', borderRadius: '99px' }}>
                <span className="live-dot-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', marginRight: '8px', animation: 'pulse 1.5s infinite' }} />
                Voting is Live Now
              </div>
            )}
            <div className="hero-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/2026_FIFA_World_Cup_emblem.svg" alt="FIFA 2026" style={{ height: '22px', width: 'auto' }} />
              <span>DIU FIFA WORLD CUP ELECTION 2026</span>
            </div>
            <h1 className="hero-title" style={{ maxWidth: '680px' }}>
              Vote for Your University&apos;s Football Committee
            </h1>
            <p className="hero-sub" style={{ maxWidth: '600px' }}>
              Elect student representatives for {teams.length} FIFA World Cup national teams.
              Only verified Daffodil International University students can vote.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary btn-lg">
                Sign In to Vote
              </Link>
              <Link href="/results" className="btn btn-ghost btn-lg" style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                View Results
              </Link>
            </div>
          </div>
        </section>

        {/* ── Teams Preview ── */}
        <section style={{ padding: 'var(--space-16) var(--space-4) var(--space-12)' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
              <div>
                <h2 className="section-title">Participating Teams</h2>
                <p className="section-sub">{teams.length} national teams · Elect committee members</p>
              </div>
            </div>
            <div className="team-grid">
              {teams.map((team) => (
                <div 
                  key={team.name} 
                  className="team-card"
                  style={{ 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Colored top brand strip */}
                  <div style={{ height: '4px', width: '100%', background: team.bgColor }} />
                  
                  <div 
                    className="team-card-flag" 
                    style={{ 
                      background: 'rgba(8, 16, 36, 0.35)', 
                      height: '110px',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <img 
                      src={getTeamFlagUrl(team.flag)} 
                      alt={team.name}
                      style={{ width: '64px', height: 'auto', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)' }}
                    />
                  </div>
                  <div className="team-card-body" style={{ background: 'rgba(11, 17, 36, 0.4)', padding: 'var(--space-4) var(--space-3)' }}>
                    <p className="team-card-name" style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      {team.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.8 }}>
                      {team.region}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{
          padding: 'var(--space-16) var(--space-4)',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="container">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              Built for Performance & Security
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}>
              {features.map((f) => (
                <div key={f.title} className="card">
                  <div style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: 'var(--space-4)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>{f.icon}</div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: 'var(--space-20) var(--space-4)', textAlign: 'center' }}>
          <div style={{ 
            maxWidth: 600, 
            margin: '0 auto',
            background: 'var(--bg-card)',
            padding: 'var(--space-10) var(--space-8)',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--fifa-purple)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-4)', color: '#ffffff' }}>
              Ready to Vote?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              Sign in with your <strong style={{ color: 'var(--text-primary)' }}>@diu.edu.bd</strong> Google account
              to cast your vote.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Get Started →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-8) var(--space-4)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          background: 'var(--bg-nav)'
        }}>
          <p>© 2026 DIU FIFA Election Platform · Daffodil International University</p>
          <p style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
            <Link href="/admin" style={{ color: 'var(--text-muted)' }}>Admin Panel</Link>
            <Link href="/results" style={{ color: 'var(--text-muted)' }}>Public Results</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
