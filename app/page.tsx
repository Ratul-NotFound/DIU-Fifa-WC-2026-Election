import Link from 'next/link';
import type { Metadata } from 'next';
import { getElectionSettings, getTeams, getLiveTeamStandings } from '@/lib/firebase/firestore';
import { getTeamFlagUrl, getTeamGradient, getTeamAccentColor } from '@/lib/utils/helpers';
import Navbar from '@/components/layout/Navbar';
import FootballLogo from '@/components/layout/FootballLogo';

export const metadata: Metadata = {
  title: 'DIU FIFA Community Portal',
  description: 'The official portal for Daffodil International University FIFA Community, gaming tournaments, and committee elections.',
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

  const totalVotersCount = standings.reduce((sum, s) => sum + s.votes, 0);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Global Navbar Wrapper ── */}
      <Navbar />

      <div className="page-wrapper">
        {/* ── Hero ── */}
        <section className="hero" style={{ marginTop: 0 }}>
          <div className="container">
            <div className="hero-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'center' }}>
              
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
                  <span>DIU FIFA COMMUNITY PORTAL</span>
                </div>
                <h1 className="hero-title" style={{ maxWidth: '680px' }}>
                  The Hub for Daffodil International University Football
                </h1>
                <p className="hero-sub" style={{ maxWidth: '600px', marginBottom: 'var(--space-6)' }}>
                  Connect with football enthusiasts, compete in local campus tournaments, and participate in the 2026 Committee Elections.
                </p>
                <div className="hero-actions">
                  <a href="#portal-hub" className="btn btn-primary btn-lg">
                    Explore Community
                  </a>
                  <a href="#election-hub" className="btn btn-ghost btn-lg" style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    Go to Election
                  </a>
                </div>
              </div>

              {/* Right Column: FIFA Community Logo */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '340px', margin: '0 auto' }}>
                <img 
                  src="/fifa_hero_graphic.png" 
                  alt="DIU FIFA Community Logo" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '260px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 12px 24px rgba(6, 182, 212, 0.4))'
                  }} 
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── Community Hub Modules Grid ── */}
        <section id="portal-hub" style={{ padding: 'var(--space-16) var(--space-4) var(--space-8)' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <div>
                <h2 className="section-title" style={{ display: 'inline-block' }}>DIU FIFA Community Hub</h2>
                <p className="section-sub" style={{ margin: 'var(--space-2) auto 0', maxWidth: '600px' }}>
                  Explore active segments and upcoming features of our campus football association.
                </p>
              </div>
            </div>

            <div className="portal-grid" style={{ justifyContent: 'center' }}>
              
              {/* Card 1: 2026 Committee Election */}
              <div className="portal-card" style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
                <div>
                  <div className="portal-card-header">
                    <span style={{ fontSize: '1.75rem' }}>🗳️</span>
                    <span className="badge-active">Active</span>
                  </div>
                  <h3 className="portal-card-title">2026 Committee Election</h3>
                  <p className="portal-card-desc">
                    Vote for your national division committee representatives. Cast your ballot and view live scores in real-time.
                  </p>
                </div>
                <a href="#election-hub" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
                  Open Election Hub →
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ── 2026 Committee Election Hub ── */}
        <section id="election-hub" style={{
          padding: 'var(--space-16) var(--space-4)',
          background: 'rgba(10, 15, 28, 0.25)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="container">
            
            <div className="section-header" style={{ marginBottom: 'var(--space-10)' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: 'var(--space-3)' }}>Module: Election Hub</span>
                <h2 className="section-title">2026 Committee Election Center</h2>
                <p className="section-sub" style={{ marginTop: 'var(--space-2)' }}>
                  Elect student representatives for the FIFA World Cup national teams. Only verified DIU students can vote.
                </p>
              </div>
            </div>

            <div className="hero-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-10)', alignItems: 'start' }}>
              
              {/* Standings SCOREBOARD */}
              <div className="hero-scoreboard" style={{ width: '100%', margin: '0 auto', background: 'rgba(12, 19, 36, 0.55)' }}>
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

              {/* Quick Info & Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div className="card" style={{ background: 'rgba(12, 19, 36, 0.45)' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Cast Your Ballot</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                    Each student can vote once per committee position for each national division. Authenticate using your university Google account to gain access to the voting booth.
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <Link href="/login" className="btn btn-primary btn-sm">
                      Vote Now
                    </Link>
                    <Link href="/results" className="btn btn-ghost btn-sm">
                      Full Standings
                    </Link>
                  </div>
                </div>
              </div>

            </div>

            {/* Teams Grid */}
            <div style={{ marginTop: 'var(--space-12)' }}>
              <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Participating Divisions</h3>
                  <p className="section-sub">Preview the {dbTeams.length} national teams competing in the current election cycle.</p>
                </div>
              </div>

              <div className="team-grid">
                {dbTeams.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-8)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderColor: 'var(--border)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      No teams have been added to the election yet.
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
                      <div style={{ height: '4px', width: '100%', background: getTeamGradient(team.name) }} />
                      <div className="team-card-flag">
                        <img src={getTeamFlagUrl(team.flag)} alt={team.name} />
                      </div>
                      <div className="team-card-body">
                        <p className="team-card-name">{team.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.8 }}>
                          {team.description || 'Participating Division'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
              Join the DIU FIFA Community
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              Stay updated, vote in elections, and join varsity gaming tournaments with your <strong style={{ color: 'var(--text-primary)' }}>@diu.edu.bd</strong> Google account.
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
          <p>© 2026 DIU FIFA Community Portal · Daffodil International University</p>
          <p style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
            <Link href="/admin" style={{ color: 'var(--text-muted)' }}>Admin Panel</Link>
            <Link href="/results" style={{ color: 'var(--text-muted)' }}>Public Results</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
