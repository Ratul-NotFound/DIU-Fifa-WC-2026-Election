'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams, getElectionSettings, getAllResultsForTeam } from '@/lib/firebase/firestore';
import type { Team, ElectionSettings, ResultsDoc } from '@/lib/types';
import { statusLabel, getTeamFlagUrl, getTeamAccentColor, getTeamGradient } from '@/lib/utils/helpers';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [greetingText, setGreetingText] = useState('Hello');

  useEffect(() => {
    async function load() {
      const [t, s] = await Promise.all([getTeams(), getElectionSettings()]);
      setTeams(t);
      setSettings(s);
      
      const h = new Date().getHours();
      if (h < 12) setGreetingText('Good morning');
      else if (h < 17) setGreetingText('Good afternoon');
      else setGreetingText('Good evening');
      
      setLoading(false);
    }
    load();
  }, []);

  const votedCount = profile?.votedPositions?.length ?? 0;
  const isLive = settings?.status === 'live';

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <h1>{greetingText}, {profile?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p className="section-sub">FIFA World Cup Election Dashboard</p>
        </div>
        {settings && (
          <span className={`badge ${
            settings.status === 'live' ? 'badge-green badge-dot' :
            settings.status === 'counting' ? 'badge-yellow' :
            settings.status === 'finished' ? 'badge-blue' : 'badge-muted'
          }`}>
            {statusLabel(settings.status)}
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Teams</p>
          <p className="stat-value">{teams.length}</p>
          <p className="stat-sub">Participating</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Votes Cast</p>
          <p className="stat-value">{votedCount}</p>
          <p className="stat-sub">By you</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Status</p>
          <p className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
            {settings ? statusLabel(settings.status) : 'Loading…'}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Role</p>
          <p className="stat-value" style={{ fontSize: 'var(--text-lg)', textTransform: 'capitalize' }}>
            {profile?.role ?? 'Student'}
          </p>
        </div>
      </div>

      {/* ── Election Status Banner ── */}
      {settings?.customBannerMessage ? (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
          📢 {settings.customBannerMessage}
        </div>
      ) : (
        settings?.showStatusBanner !== false && (
          <>
            {settings?.status === 'draft' && (
              <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
                🗓 Election has not started yet. Check back soon.
              </div>
            )}
            {settings?.status === 'counting' && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                🔢 Voting is closed. Results are being counted.
              </div>
            )}
            {settings?.status === 'finished' && (
              <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>
                🏆 Election finished! <Link href="/standings" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>View final standings →</Link>
              </div>
            )}
          </>
        )
      )}

      {/* ── Teams Grid ── */}
      <div className="section-header">
        <div>
          <h2 className="section-title">National Teams</h2>
          <p className="section-sub">
            {isLive ? 'Select a team to vote for their committee members' : 'Teams participating in the election'}
          </p>
        </div>
        <Link href="/standings" className="btn btn-ghost btn-sm">
          View Standings →
        </Link>
      </div>

      <div className="team-grid">
        {teams.map((team) => {
          const hasVoted = profile?.votedPositions?.some(vp => vp.startsWith(team.id + '_'));
          return (
            <Link
              key={team.id}
              href={`/vote?team=${team.id}`}
              className="team-card"
              style={{ 
                '--team-accent': getTeamAccentColor(team.name),
                '--team-accent-glow': getTeamAccentColor(team.name) + '25',
              } as React.CSSProperties}
            >
              {/* Colored top brand strip */}
              <div className="team-card-strip" style={{ height: '4px', width: '100%', background: getTeamGradient(team.name) }} />

              <div className="team-card-flag">
                <img 
                  src={getTeamFlagUrl(team.flag)} 
                  alt={team.name}
                />
              </div>
              <div className="team-card-body">
                <p className="team-card-name">{team.name}</p>
                {hasVoted && (
                  <span className="badge badge-green" style={{ marginTop: 'var(--space-2)', fontSize: '10px' }}>
                    ✓ Voted
                  </span>
                )}
                {isLive && !hasVoted && (
                  <span className="badge badge-blue" style={{ marginTop: 'var(--space-2)', fontSize: '10px' }}>
                    Vote Now
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">⚽</span>
          <p className="empty-title">No Teams Yet</p>
          <p className="empty-desc">Teams will appear here once the admin adds them.</p>
        </div>
      )}

    </div>
  );
}
