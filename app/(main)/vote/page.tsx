'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams, getElectionSettings } from '@/lib/firebase/firestore';
import type { Team, ElectionSettings } from '@/lib/types';
import { statusLabel, getTeamFlagUrl, getTeamAccentColor, getTeamGradient } from '@/lib/utils/helpers';

export default function VoteHubPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [t, s] = await Promise.all([getTeams(), getElectionSettings()]);
      setTeams(t);
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  const isLive = settings?.status === 'live';

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <h1>DIU Committee Ballots</h1>
          <p className="section-sub">
            {isLive 
              ? 'Select a national team to cast your vote for their committee representatives' 
              : 'Voting is currently closed. View results to check standings.'}
          </p>
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

      {/* ── Election Status Banner ── */}
      {!isLive && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
          🗳️ Voting is not open. 
          {settings?.status === 'draft' && ' The election has not started yet.'}
          {settings?.status === 'counting' && ' Votes are currently being counted.'}
          {settings?.status === 'finished' && ' The election has ended.'}
          {' '}
          <Link href="/results" style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit' }}>
            Go to Results page →
          </Link>
        </div>
      )}

      {/* ── Teams Grid ── */}
      <div className="team-grid">
        {teams.map((team) => {
          const hasVoted = profile?.votedPositions?.some(vp => vp.startsWith(team.id + '_'));
          return (
            <Link
              key={team.id}
              href={`/vote/${team.id}`}
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
          <p className="empty-desc">Teams will appear here once the admin adds them to the election.</p>
        </div>
      )}
    </div>
  );
}
