'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getTeams, getPositions, getApprovedCandidates, getElectionSettings, getAllResultsForTeam } from '@/lib/firebase/firestore';
import type { Team, Position, Candidate, ElectionSettings, ResultsDoc, CandidateWithScore } from '@/lib/types';
import { calcPercentage, statusLabel, getTeamFlagUrl, getTeamAccentColor } from '@/lib/utils/helpers';
import Link from 'next/link';

const POLL_INTERVAL = 5000; // 5 seconds

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [results, setResults] = useState<ResultsDoc[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPos, setSelectedPos] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async (teamId: string) => {
    if (!teamId) return;
    const res = await getAllResultsForTeam(teamId);
    setResults(res);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    async function loadStatic() {
      const [t, pos, cands, s] = await Promise.all([
        getTeams(),
        getPositions(),
        getApprovedCandidates(),
        getElectionSettings(),
      ]);
      setTeams(t);
      setPositions(pos);
      setCandidates(cands);
      setSettings(s);
      if (t.length > 0) {
        setSelectedTeam(t[0].id);
        setSelectedPos(pos[0]?.id ?? '');
        const res = await getAllResultsForTeam(t[0].id);
        setResults(res);
        setLastUpdated(new Date());
      }
      setLoading(false);
    }
    loadStatic();
  }, []);

  // Poll results every 5s
  useEffect(() => {
    if (!selectedTeam) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchResults(selectedTeam), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedTeam, fetchResults]);

  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId);
    const pos = positions[0]?.id ?? '';
    setSelectedPos(pos);
    await fetchResults(teamId);
  };

  const getRankedCandidates = (posId: string): CandidateWithScore[] => {
    const posResult = results.find(r => r.positionId === posId);
    const scores = posResult?.candidateScores ?? {};
    const total = posResult?.totalVotes ?? 0;
    const positionCandidates = candidates.filter(c => c.team === selectedTeam && c.position === posId);
    const maxWinners = positions.find(p => p.id === posId)?.maxWinners ?? 1;

    const ranked: CandidateWithScore[] = positionCandidates
      .map(c => ({
        ...c,
        score: scores[c.id] ?? 0,
        percentage: calcPercentage(scores[c.id] ?? 0, total),
        rank: 0,
        isWinner: false,
        isCloseRace: false,
      }))
      .sort((a, b) => b.score - a.score);

    ranked.forEach((c, i) => {
      c.rank = i + 1;
      c.isWinner = i < maxWinners;
    });

    // Detect close races (within 5% of leader)
    const topScore = ranked[0]?.score ?? 0;
    ranked.forEach(c => {
      if (!c.isWinner && topScore > 0 && (topScore - c.score) / topScore < 0.05) {
        c.isCloseRace = true;
      }
    });

    return ranked;
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  const currentRanked = selectedPos ? getRankedCandidates(selectedPos) : [];
  const totalVotesForPos = results.find(r => r.positionId === selectedPos)?.totalVotes ?? 0;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1>Election Results</h1>
          <p className="section-sub">
            {settings ? statusLabel(settings.status) : '—'}
            {lastUpdated && (
              <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {(settings?.status === 'live' || settings?.status === 'counting') && (
          <span className="live-dot">Auto-refreshing</span>
        )}
      </div>

      {settings?.status === 'draft' && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
          Results will be visible once voting begins.
        </div>
      )}

      {/* Team Tabs */}
      <div className="team-tabs">
        {teams.map(t => {
          const isActive = selectedTeam === t.id;
          const accentColor = getTeamAccentColor(t.name);
          return (
            <button
              key={t.id}
              className={`team-tab-pill${isActive ? ' active' : ''}`}
              onClick={() => handleTeamChange(t.id)}
              id={`results-team-${t.id}`}
              style={{
                '--team-accent': accentColor,
                '--team-accent-glow': accentColor + '25',
              } as React.CSSProperties}
            >
              <img
                src={getTeamFlagUrl(t.flag)}
                alt={t.name}
                className="flag-circular"
                style={{ width: '18px', height: '18px' }}
              />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Position Tabs */}
      {positions.length > 0 && (
        <div className="position-selector" style={{ marginBottom: 'var(--space-6)' }}>
          {positions.map(pos => (
            <button
              key={pos.id}
              className={`position-tab${selectedPos === pos.id ? ' active' : ''}`}
              onClick={() => setSelectedPos(pos.id)}
              id={`results-pos-${pos.id}`}
            >
              <span className="position-tab-title">{pos.title}</span>
              <span className="position-tab-status">
                {results.find(r => r.positionId === pos.id)?.totalVotes ?? 0} votes
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
          {positions.find(p => p.id === selectedPos)?.title ?? 'Results'}
        </h2>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {totalVotesForPos} total votes
        </span>
      </div>

      {currentRanked.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p className="empty-title">No Results Yet</p>
          <p className="empty-desc">No votes have been cast for this position.</p>
        </div>
      ) : (
        <div className="results-list">
          {currentRanked.map(cand => {
            const rankClass = cand.rank === 1 ? 'gold' : cand.rank === 2 ? 'silver' : cand.rank === 3 ? 'bronze' : '';
            return (
              <div
                key={cand.id}
                className={`result-item${cand.isWinner ? ' winner' : cand.isCloseRace ? ' close-race' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div className={`result-rank${rankClass ? ` ${rankClass}` : ''}`}>
                    {cand.rank}
                  </div>
                  {cand.photoUrl && (
                    <img src={cand.photoUrl} alt={cand.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{cand.name}</p>
                      {cand.isWinner && (
                        <span className="badge badge-green" style={{ fontSize: '10px' }}>
                          {cand.rank === 1 ? '🏆 Winner' : '✓ Elected'}
                        </span>
                      )}
                      {cand.isCloseRace && !cand.isWinner && (
                        <span className="badge badge-yellow" style={{ fontSize: '10px' }}>⚡ Close Race</span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {cand.department} · {cand.batch}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{cand.score}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{cand.percentage}%</p>
                  </div>
                </div>
                <div className="vote-bar-wrap">
                  <div className="vote-bar-track">
                    <div
                      className={`vote-bar-fill${cand.isWinner ? ' winner' : cand.isCloseRace ? ' close' : ''}`}
                      style={{ width: `${cand.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {settings?.status === 'live' && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
          Results auto-refresh every 5 seconds
        </p>
      )}
    </div>
  );
}
