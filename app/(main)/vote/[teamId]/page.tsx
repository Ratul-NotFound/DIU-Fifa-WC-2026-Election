'use client';
 
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getTeam,
  getPositions,
  getCandidatesByTeam,
  getElectionSettings,
  castVote,
  getUserVoteForPosition,
} from '@/lib/firebase/firestore';
import type { Team, Position, Candidate, ElectionSettings } from '@/lib/types';
import { voteKey, truncate, getTeamFlagUrl } from '@/lib/utils/helpers';

export default function VotePage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [activePos, setActivePos] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, string>>({}); // positionId -> candidateId
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ posId: string; candId: string } | null>(null);

  useEffect(() => {
    if (!teamId) return;
    async function load() {
      const [t, pos, cands, s] = await Promise.all([
        getTeam(teamId),
        getPositions(),
        getCandidatesByTeam(teamId),
        getElectionSettings(),
      ]);
      setTeam(t);
      setPositions(pos);
      setCandidates(cands);
      setSettings(s);
      if (pos.length > 0) setActivePos(pos[0].id);

      if (user) {
        const votesMap: Record<string, string> = {};
        await Promise.all(
          pos.map(async (p) => {
            const v = await getUserVoteForPosition(user.uid, teamId, p.id);
            if (v) votesMap[p.id] = v;
          })
        );
        setSelected(votesMap);
      }

      setLoading(false);
    }
    load();
  }, [teamId, user]);

  const hasVotedFor = useCallback(
    (posId: string) => profile?.votedPositions?.includes(voteKey(teamId, posId)) ?? false,
    [profile, teamId]
  );

  const currentCandidates = candidates.filter(c => c.position === activePos);

  const handleSelect = (posId: string, candId: string) => {
    if (hasVotedFor(posId) || submitting) return;
    setPendingVote({ posId, candId });
    setShowModal(true);
  };

  const confirmVote = async () => {
    if (!pendingVote || !user) return;
    setShowModal(false);
    setSubmitting(true);
    setError('');

    const res = await castVote(user.uid, teamId, pendingVote.posId, pendingVote.candId);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('✓ Vote cast successfully!');
      setSelected(prev => ({ ...prev, [pendingVote.posId]: pendingVote.candId }));
      await refreshProfile();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError(res.error || 'Vote failed. Please try again.');
    }
    setPendingVote(null);
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  if (!settings || settings.status !== 'live') {
    return (
      <div className="page-content">
        <div className="empty-state">
          <span className="empty-icon">🗳️</span>
          <p className="empty-title">Voting is Not Open</p>
          <p className="empty-desc">
            {settings?.status === 'draft' && 'The election has not started yet.'}
            {settings?.status === 'counting' && 'Voting is closed. Results are being counted.'}
            {settings?.status === 'finished' && 'The election has ended. View the results!'}
          </p>
          {settings?.status === 'finished' && (
            <a href="/results" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>View Results</a>
          )}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <span className="empty-icon">🏳️</span>
          <p className="empty-title">Team Not Found</p>
          <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>← Back</button>
        </div>
      </div>
    );
  }

  const pendingCandidate = pendingVote
    ? candidates.find(c => c.id === pendingVote.candId)
    : null;

  return (
    <div className="page-content" style={{ paddingBottom: '100px' }}>
      {/* ── Team Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="Back"
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={getTeamFlagUrl(team.flag)} 
            alt={team.name}
            style={{ width: '48px', height: 'auto', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)' }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{team.name}</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Select a position and vote</p>
        </div>
        <div className="live-dot" style={{ marginLeft: 'auto' }}>Live</div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{successMsg}</div>}
      {submitting && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="spinner" style={{ width: 16, height: 16 }} /> Submitting vote…
        </div>
      )}

      {/* ── Position Tabs ── */}
      <div className="position-selector" style={{ marginBottom: 'var(--space-6)' }}>
        {positions.map(pos => {
          const voted = hasVotedFor(pos.id);
          const isActive = activePos === pos.id;
          return (
            <button
              key={pos.id}
              className={`position-tab${isActive ? ' active' : ''}${voted ? ' voted' : ''}`}
              onClick={() => setActivePos(pos.id)}
              id={`pos-tab-${pos.id}`}
            >
              <span className="position-tab-title">{pos.title}</span>
              <span className="position-tab-status">
                {voted ? '✓ Voted' : 'Vote'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active Position Info ── */}
      {activePos && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {hasVotedFor(activePos) ? (
            <div className="alert alert-success">
              ✓ You have already voted for this position. Your vote is locked.
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Select one candidate to cast your vote. <strong>This cannot be undone.</strong>
            </p>
          )}
        </div>
      )}

      {/* ── Candidates Grid ── */}
      {currentCandidates.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👤</span>
          <p className="empty-title">No Candidates</p>
          <p className="empty-desc">No approved candidates for this position yet.</p>
        </div>
      ) : (
        <div className="candidates-grid">
          {currentCandidates.map(cand => {
            const alreadyVoted = hasVotedFor(activePos);
            const isMyVote = selected[activePos] === cand.id;

            let cardClass = 'candidate-card';
            if (alreadyVoted) {
              if (isMyVote) {
                cardClass += ' voted';
              } else {
                cardClass += ' disabled';
              }
            }

            return (
              <button
                key={cand.id}
                className={cardClass}
                onClick={() => !alreadyVoted && handleSelect(activePos, cand.id)}
                style={{ textAlign: 'left', width: '100%' }}
                disabled={alreadyVoted || submitting}
                id={`cand-${cand.id}`}
              >
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  {cand.photoUrl ? (
                    <img src={cand.photoUrl} alt={cand.name} className="candidate-photo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="candidate-photo-placeholder">👤</div>
                  )}
                  <div className="candidate-info">
                    <p className="candidate-name">{cand.name}</p>
                    <p className="candidate-meta">{cand.department} · {cand.batch}</p>
                    {cand.studentId && (
                      <p className="candidate-meta" style={{ marginTop: 2 }}>ID: {cand.studentId}</p>
                    )}
                  </div>
                </div>
                {cand.manifesto && (
                  <p className="candidate-manifesto">{truncate(cand.manifesto, 120)}</p>
                )}
                {alreadyVoted && isMyVote && (
                  <span className="badge badge-green" style={{ marginTop: 'var(--space-2)' }}>✓ Voted by You</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Confirm Vote Modal ── */}
      {showModal && pendingCandidate && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Confirm Your Vote</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              You are about to vote for:
            </p>
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{pendingCandidate.name}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {positions.find(p => p.id === pendingVote?.posId)?.title} · {team.name}
              </p>
            </div>
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
              ⚠ This vote is permanent and cannot be changed.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} id="btn-cancel-vote">
                Cancel
              </button>
              <button className="btn btn-green" onClick={confirmVote} id="btn-confirm-vote">
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
