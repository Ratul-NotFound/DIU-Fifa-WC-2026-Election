import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchElectionSettings } from '@/lib/server/firestore';
import { getTeamFlagUrl, getTeamGradient, getTeamAccentColor } from '@/lib/utils/helpers';
import NavbarServer from '@/components/layout/NavbarServer';
import FootballLogo from '@/components/layout/FootballLogo';

export const metadata: Metadata = {
  title: 'DIU FIFA World Cup Election Platform',
  description: 'Vote for your DIU university football committee. Official FIFA election system for Daffodil International University students.',
};

// SSG with light revalidation for election status
export const revalidate = 60;

export default async function LandingPage() {
  let electionStatus = 'draft';
  try {
    const settings = await fetchElectionSettings();
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
      <NavbarServer />

      <div className="page-wrapper">
        {/* ── Hero ── */}
        <section className="hero" style={{ marginTop: 0 }}>
          <div className="container">
            <div className="hero-grid">
              
              {/* Left Column: Info & CTAs */}
              <div className="hero-content">
                {electionStatus === 'live' && (
                  <div className="live-dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '6px 14px', borderRadius: '99px' }}>
                    <span className="live-dot-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', marginRight: '8px', animation: 'pulse 1.5s infinite' }} />
                    Voting is Live Now
                  </div>
                )}
                <div className="hero-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: '22px', height: '22px', display: 'inline-block' }}>
                    <FootballLogo />
                  </span>
                  <span>DIU FIFA WORLD CUP ELECTION 2026</span>
                </div>
                <h1 className="hero-title" style={{ maxWidth: '680px' }}>
                  Vote for Your University&apos;s Football Committee
                </h1>
                <p className="hero-sub" style={{ maxWidth: '600px', marginBottom: 'var(--space-6)' }}>
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

              {/* Right Column: Live Ballot scoreboard monitor */}
              <div className="hero-scoreboard">
                <div className="scoreboard-title">DIU Live Standings</div>
                
                <div className="scoreboard-row" style={{ borderLeft: '3.5px solid #75aadb', paddingLeft: 'var(--space-2)', background: 'rgba(117, 170, 219, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', fontWeight: 800, color: '#75aadb', width: '20px' }}>1ST</div>
                  <div className="scoreboard-team" style={{ flex: 1 }}>
                    <img src="https://flagcdn.com/w80/ar.png" alt="Argentina" className="scoreboard-flag-icon" style={{ borderColor: '#75aadb' }} />
                    <span className="scoreboard-team-name">Argentina (SWE)</span>
                  </div>
                  <span className="scoreboard-metric" style={{ color: '#75aadb' }}>29 Votes</span>
                </div>

                <div className="scoreboard-row" style={{ borderLeft: '3.5px solid #009739', paddingLeft: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', width: '20px' }}>2ND</div>
                  <div className="scoreboard-team" style={{ flex: 1 }}>
                    <img src="https://flagcdn.com/w80/br.png" alt="Brazil" className="scoreboard-flag-icon" style={{ borderColor: '#009739' }} />
                    <span className="scoreboard-team-name">Brazil (CSE)</span>
                  </div>
                  <span className="scoreboard-metric" style={{ color: 'var(--text-primary)' }}>20 Votes</span>
                </div>

                <div className="scoreboard-row" style={{ borderLeft: '3.5px solid #dd0000', paddingLeft: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', width: '20px' }}>3RD</div>
                  <div className="scoreboard-team" style={{ flex: 1 }}>
                    <img src="https://flagcdn.com/w80/de.png" alt="Germany" className="scoreboard-flag-icon" style={{ borderColor: '#dd0000' }} />
                    <span className="scoreboard-team-name">Germany (EEE)</span>
                  </div>
                  <span className="scoreboard-metric" style={{ color: 'var(--text-primary)' }}>12 Votes</span>
                </div>

                <div className="scoreboard-row" style={{ borderLeft: '3.5px solid #002395', paddingLeft: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', width: '20px' }}>4TH</div>
                  <div className="scoreboard-team" style={{ flex: 1 }}>
                    <img src="https://flagcdn.com/w80/fr.png" alt="France" className="scoreboard-flag-icon" style={{ borderColor: '#002395' }} />
                    <span className="scoreboard-team-name">France (BBA)</span>
                  </div>
                  <span className="scoreboard-metric" style={{ color: 'var(--text-primary)' }}>8 Votes</span>
                </div>

                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} /> 
                    SYSTEM ONLINE
                  </span>
                  <span>TOTAL TURNOUT: 69</span>
                </div>
              </div>

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
                    '--team-accent': getTeamAccentColor(team.name),
                    '--team-accent-glow': getTeamAccentColor(team.name) + '25',
                  } as React.CSSProperties}
                >
                  {/* Colored top brand strip */}
                  <div style={{ height: '4px', width: '100%', background: getTeamGradient(team.name) }} />
                  
                  <div className="team-card-flag">
                    <img 
                      src={getTeamFlagUrl(team.flag)} 
                      alt={team.name}
                    />
                  </div>
                  <div className="team-card-body">
                    <p className="team-card-name">
                      {team.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.8 }}>
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
            backgroundImage: "linear-gradient(rgba(16, 25, 53, 0.85), rgba(16, 25, 53, 0.95)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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
