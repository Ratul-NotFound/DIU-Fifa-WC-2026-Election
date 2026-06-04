import Link from 'next/link';
import type { Metadata } from 'next';
import { getElectionSettings, getTeams, getLiveTeamStandings } from '@/lib/firebase/firestore';
import { getTeamFlagUrl, getTeamGradient, getTeamAccentColor } from '@/lib/utils/helpers';
import Navbar from '@/components/layout/Navbar';
import FootballLogo from '@/components/layout/FootballLogo';

export const metadata: Metadata = {
  title: 'DIU FIFA World Cup Election Platform',
  description: 'Vote for your DIU university football committee. Official FIFA election system for Daffodil International University students.',
};

// Render at request time — election status is dynamic
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  let electionStatus = 'draft';
  let dbTeams: any[] = [];
  let standings: any[] = [];

  try {
    const [settings, fetchedTeams, fetchedStandings] = await Promise.all([
      getElectionSettings(),
      getTeams(),
      getLiveTeamStandings(),
    ]);
    if (settings) electionStatus = settings.status;
    dbTeams = fetchedTeams;
    standings = fetchedStandings;
  } catch (err) {
    console.error("Firestore read error:", err);
  }

  const features = [
    { icon: '🗳️', title: 'Secure Voting', desc: 'Firestore transaction-safe one vote per position. Tamper-proof.' },
    { icon: '📊', title: 'Live Results', desc: 'Pre-aggregated scores updated in real time with polling.' },
    { icon: '🔐', title: 'DIU Only', desc: 'Restricted to verified @diu.edu.bd university accounts.' },
    { icon: '⚡', title: 'Lightning Fast', desc: 'Static pages, minimal JS. Sub-second load time.' },
    { icon: '📱', title: 'Mobile First', desc: 'Designed for thumbs. Works flawlessly on any screen.' },
    { icon: '🏆', title: 'FIFA Inspired', desc: 'Professional scoreboard-style election dashboard.' },
  ];

  const totalVotersCount = standings.reduce((sum, s) => sum + s.votes, 0);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Global Navbar Wrapper ── */}
      <Navbar />

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
                  Elect student representatives for {dbTeams.length} FIFA World Cup national teams.
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

              {/* Right Column: FIFA Emblem Logo & Scoreboard Standings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', alignItems: 'center', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                
                {/* FIFA 2026 Colorful Trophy & Brand Emblem */}
                <div style={{
                  width: '100%',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-lg)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}>
                  <img 
                    src="/fifa_hero_graphic.png" 
                    alt="FIFA World Cup 2026 Logo" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      maxHeight: '220px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 20px rgba(6, 182, 212, 0.35))',
                      animation: 'float 6s ease-in-out infinite' 
                    }} 
                  />
                  {/* Neon tag overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 'var(--space-3)',
                    right: 'var(--space-3)',
                    background: 'var(--yellow-bg)',
                    border: '1px solid var(--yellow-dim)',
                    color: 'var(--yellow)',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    letterSpacing: '0.05em'
                  }}>
                    OFFICIAL BRANDING
                  </div>
                </div>

                {/* Scoreboard Monitor */}
                <div className="hero-scoreboard">
                  <div className="scoreboard-title">DIU Live Standings</div>
                  
                  {standings.length === 0 ? (
                    <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>No active standings yet</p>
                      <p>Votes cast on the platform will appear here in real-time.</p>
                    </div>
                  ) : (
                    standings.map((stand, index) => {
                      const rankLabel = index === 0 ? '1ST' : index === 1 ? '2ND' : index === 2 ? '3RD' : '4TH';
                      const accentColor = getTeamAccentColor(stand.teamName);
                      return (
                        <div 
                          key={stand.teamId} 
                          className="scoreboard-row" 
                          style={{ 
                            borderLeft: `3.5px solid ${accentColor}`, 
                            paddingLeft: 'var(--space-2)', 
                            background: index === 0 ? `${accentColor}0a` : undefined 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', fontWeight: 800, color: index === 0 ? accentColor : 'var(--text-muted)', width: '20px' }}>
                            {rankLabel}
                          </div>
                          <div className="scoreboard-team" style={{ flex: 1 }}>
                            <img 
                              src={getTeamFlagUrl(stand.flag)} 
                              alt={stand.teamName} 
                              className="scoreboard-flag-icon" 
                              style={{ borderColor: accentColor }} 
                            />
                            <span className="scoreboard-team-name">{stand.teamName}</span>
                          </div>
                          <span className="scoreboard-metric" style={{ color: index === 0 ? accentColor : 'var(--text-primary)' }}>
                            {stand.votes} {stand.votes === 1 ? 'Vote' : 'Votes'}
                          </span>
                        </div>
                      );
                    })
                  )}

                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} /> 
                      SYSTEM ONLINE
                    </span>
                    <span>TOTAL TURNOUT: {totalVotersCount}</span>
                  </div>
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
                <p className="section-sub">{dbTeams.length} national teams · Elect committee members</p>
              </div>
            </div>
            <div className="team-grid">
              {dbTeams.length === 0 ? (
                <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-8)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderColor: 'var(--border)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    No teams have been added to the election yet.
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    Please log in as an administrator to seed default election data.
                  </p>
                </div>
              ) : (
                dbTeams.map((team) => (
                  <div 
                    key={team.id} 
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
                        {team.description || 'Participating Division'}
                      </p>
                    </div>
                  </div>
                ))
              )}
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
            backgroundImage: "linear-gradient(rgba(16, 25, 53, 0.85), rgba(16, 25, 53, 0.95)), url('/fifa_stadium_bg.png')",
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
