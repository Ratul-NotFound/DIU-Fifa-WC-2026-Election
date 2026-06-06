import Link from 'next/link';
import type { Metadata } from 'next';
import { getElectionSettings, getTeams, getLiveTeamStandings } from '@/lib/firebase/firestore';
import { getTeamFlagUrl, getTeamGradient, getTeamAccentColor } from '@/lib/utils/helpers';
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
    <>
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
                <span>DIU FIFA COMMUNITY PORTAL</span>
              </div>
              <h1 className="hero-title" style={{ maxWidth: '680px' }}>
                DIU FIFA Committee Elections 2026
              </h1>
              <p className="hero-sub" style={{ maxWidth: '600px', marginBottom: 'var(--space-6)' }}>
                Cast your vote for your national division committee representatives in real-time. Ensure you are signed in with your verified student account to enter the voting booth.
              </p>
              <div className="hero-actions" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Link href="/vote" className="btn btn-primary btn-lg" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                  🗳️ Enter Voting Booth
                </Link>
                <Link href="/participate" className="btn btn-ghost btn-lg" style={{ 
                  border: '1.5px solid var(--fifa-purple)', 
                  color: '#ffffff', 
                  background: 'rgba(139, 92, 246, 0.08)',
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)'
                }}>
                  📢 Apply for Candidate
                </Link>
              </div>
            </div>

            {/* Right Column: FIFA Community Logo */}
            <div className="hero-logo-wrapper">
              <img 
                src="/fif.png" 
                alt="DIU FIFA Community Logo" 
                className="hero-logo-img" 
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── 2026 Committee Election Hub ── */}
      <section id="election-hub" className="section-padding" style={{
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

          <div className="election-dashboard-grid">
            
            {/* Standings SCOREBOARD */}
            <div className="hero-scoreboard" style={{ width: '100%', maxWidth: '100%', margin: '0', background: 'rgba(12, 19, 36, 0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="scoreboard-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-dot-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      DIU Live Standings
                    </span>
                  </div>
                  <span className="badge badge-muted" style={{ fontSize: '9px', padding: '2px 8px', textTransform: 'none' }}>Live Tracker</span>
                </div>
                
                {standings.length === 0 ? (
                  <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>No active standings yet</p>
                    <p>Votes cast will appear here in real-time.</p>
                  </div>
                ) : (
                  standings.map((stand, index) => {
                    const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : 'rank-slate';
                    const accentColor = getTeamAccentColor(stand.teamName);
                    const votePercentage = totalVotersCount > 0 ? (stand.votes / totalVotersCount) * 100 : 0;
                    return (
                      <div 
                        key={stand.teamId} 
                        className="scoreboard-row-enhanced"
                      >
                        <div className="scoreboard-team-header">
                          <div className="scoreboard-team-info">
                            <span className={`rank-badge ${rankClass}`}>
                              {index + 1}
                            </span>
                            <img 
                              src={getTeamFlagUrl(stand.flag)} 
                              alt={stand.teamName} 
                              className="scoreboard-team-flag-circular" 
                              style={{ '--team-border-color': accentColor } as React.CSSProperties}
                            />
                            <span className="scoreboard-team-name">{stand.teamName}</span>
                          </div>
                          <span className="scoreboard-metric" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>{stand.votes}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              ({votePercentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        
                        <div className="scoreboard-percentage-bar-container">
                          <div 
                            className="scoreboard-percentage-bar-fill" 
                            style={{ 
                              width: `${votePercentage}%`,
                              '--bar-color': accentColor
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} /> 
                  SECURE BOOTH ONLINE
                </span>
                <span>TOTAL TURNOUT: {totalVotersCount} VOTES</span>
              </div>
            </div>

            {/* Quick Info & Actions (Sub-sections Stack) */}
            <div className="actions-stack">
              
              {/* Card 1: Cast Your Ballot */}
              <div className="glow-card glow-card-blue">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flex: 1 }}>
                  <div className="icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
                      <path d="M12 11v4" />
                      <path d="M10 13h4" />
                      <path d="M8 2h8" />
                    </svg>
                  </div>
                  <div className="glow-card-content">
                    <div className="glow-card-title-row">
                      <h3 className="glow-card-title">Cast Your Ballot</h3>
                      <span className="badge badge-green badge-dot" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: 'var(--green)', textTransform: 'none', padding: '2px 8px', fontSize: '10px' }}>Active</span>
                    </div>
                    <p className="glow-card-desc">
                      Access the secure voting booth with your student account to vote for divisional representatives.
                    </p>
                  </div>
                </div>
                <div className="glow-card-action">
                  <Link href="/login" className="btn btn-primary btn-sm btn-full">
                    Vote Now →
                  </Link>
                </div>
              </div>

              {/* Card 2: View Candidates */}
              <div className="glow-card glow-card-purple">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flex: 1 }}>
                  <div className="icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="glow-card-content">
                    <div className="glow-card-title-row">
                      <h3 className="glow-card-title">View Candidates</h3>
                      <span className="badge badge-dot" style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'var(--fifa-purple)', textTransform: 'none', padding: '2px 8px', fontSize: '10px' }}>Nominees</span>
                    </div>
                    <p className="glow-card-desc">
                      Examine candidate details, student manifests, and platforms for all contested division roles.
                    </p>
                  </div>
                </div>
                <div className="glow-card-action">
                  <Link href="/vote" className="btn btn-ghost btn-sm btn-full">
                    Browse Nominees →
                  </Link>
                </div>
              </div>

              {/* Card 3: Full Standings */}
              <div className="glow-card glow-card-cyan">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flex: 1 }}>
                  <div className="icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                      <path d="M3 20h18" />
                    </svg>
                  </div>
                  <div className="glow-card-content">
                    <div className="glow-card-title-row">
                      <h3 className="glow-card-title">Full Standings</h3>
                      <span className="badge badge-dot" style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--fifa-cyan)', textTransform: 'none', padding: '2px 8px', fontSize: '10px' }}>Real-time</span>
                    </div>
                    <p className="glow-card-desc">
                      Analyze real-time voter turnout rates, vote percentages, audit logs, and complete stats.
                    </p>
                  </div>
                </div>
                <div className="glow-card-action">
                  <Link href="/standings" className="btn btn-ghost btn-sm btn-full">
                    Standings Board →
                  </Link>
                </div>
              </div>

            </div>

          </div>

          {/* Scrolling Ticker of Participating Teams */}
          {dbTeams.length > 0 && (
            <div className="marquee-wrapper">
              <div className="marquee-container-flow">
                {dbTeams.map((team) => {
                  const teamColor = getTeamAccentColor(team.name);
                  return (
                    <div 
                      key={`mq-1-${team.id}`} 
                      className="marquee-pill"
                      style={{
                        '--pill-color': teamColor
                      } as React.CSSProperties}
                    >
                      <img 
                        src={getTeamFlagUrl(team.flag)} 
                        alt={team.name} 
                        className="marquee-pill-flag" 
                      />
                      <span>{team.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="marquee-container-flow" aria-hidden="true">
                {dbTeams.map((team) => {
                  const teamColor = getTeamAccentColor(team.name);
                  return (
                    <div 
                      key={`mq-2-${team.id}`} 
                      className="marquee-pill"
                      style={{
                        '--pill-color': teamColor
                      } as React.CSSProperties}
                    >
                      <img 
                        src={getTeamFlagUrl(team.flag)} 
                        alt={team.name} 
                        className="marquee-pill-flag" 
                      />
                      <span>{team.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding" style={{ textAlign: 'center', paddingTop: 0 }}>
        <div className="cta-card">
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
    </>
  );
}
