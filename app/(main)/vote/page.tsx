'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getTeams,
  getPositions,
  getCandidatesByTeam,
  getElectionSettings,
  castVote,
  getUserVoteForPosition,
} from '@/lib/firebase/firestore';
import type { Team, Position, Candidate, ElectionSettings } from '@/lib/types';
import { truncate, getTeamFlagUrl, getTeamAccentColor, statusLabel } from '@/lib/utils/helpers';

function ChevronDownIcon({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ width: '12px', height: '12px', ...style }}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function VoteBoothContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTeamId = searchParams.get('team') || '';
  const { user, profile, refreshProfile } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activePos, setActivePos] = useState<string>('');
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // positionId -> candidateId
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ posId: string; candId: string } | null>(null);

  // Custom Dropdowns Toggle States
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!teamDropdownOpen) return;
    const handleOutsideClick = () => setTeamDropdownOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [teamDropdownOpen]);

  useEffect(() => {
    if (!posDropdownOpen) return;
    const handleOutsideClick = () => setPosDropdownOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [posDropdownOpen]);

  // Load initial static datasets: Teams, Positions, and settings
  useEffect(() => {
    async function loadInitial() {
      const [t, pos, s] = await Promise.all([
        getTeams(),
        getPositions(),
        getElectionSettings(),
      ]);
      setTeams(t);
      setPositions(pos);
      setSettings(s);

      // Determine initial team selection
      let defaultTeam = '';
      if (initialTeamId && t.some(team => team.id === initialTeamId)) {
        defaultTeam = initialTeamId;
      } else if (t.length > 0) {
        defaultTeam = t[0].id;
      }
      
      setSelectedTeamId(defaultTeam);
      if (pos.length > 0) setActivePos(pos[0].id);

      setLoading(false);
    }
    loadInitial();
  }, [initialTeamId]);

  // Handle loading candidates and user votes when selectedTeamId changes
  useEffect(() => {
    if (!selectedTeamId) return;

    async function loadCandidatesAndVotes() {
      setLoading(true);
      const cands = await getCandidatesByTeam(selectedTeamId);
      setCandidates(cands);

      if (user) {
        const votesMap: Record<string, string> = {};
        await Promise.all(
          positions.map(async (p) => {
            const v = await getUserVoteForPosition(user.uid, selectedTeamId, p.id);
            if (v) votesMap[p.id] = v;
          })
        );
        setSelectedVotes(votesMap);
      }
      setLoading(false);
    }
    
    loadCandidatesAndVotes();
  }, [selectedTeamId, user, positions]);

  const hasVotedFor = useCallback(
    (posId: string) => !!selectedVotes[posId],
    [selectedVotes]
  );

  const currentCandidates = candidates.filter(c => c.position === activePos);
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const accentColor = selectedTeam ? getTeamAccentColor(selectedTeam.name) : 'var(--blue)';

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  const handleSelect = (posId: string, candId: string) => {
    if (hasVotedFor(posId) || submitting) return;
    setPendingVote({ posId, candId });
    setShowModal(true);
  };

  const confirmVote = async () => {
    if (!pendingVote || !user || !selectedTeamId) return;
    setShowModal(false);
    setSubmitting(true);
    setError('');

    const res = await castVote(user.uid, selectedTeamId, pendingVote.posId, pendingVote.candId);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('✓ Vote cast successfully!');
      setSelectedVotes(prev => ({ ...prev, [pendingVote.posId]: pendingVote.candId }));
      await refreshProfile();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError(res.error || 'Vote failed. Please try again.');
    }
    setPendingVote(null);
  };

  if (loading && teams.length === 0) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  const isLive = settings?.status === 'live';

  return (
    <div className="page-content" style={{ paddingBottom: '100px', maxWidth: '800px' }}>
      
      {/* ── Election Status Banners ── */}
      {settings && !isLive && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
          🗳️ <strong>Voting is Closed:</strong>
          {settings.status === 'draft' && ' The election has not started yet. Previewing positions and candidates.'}
          {settings.status === 'counting' && ' Votes are currently being counted.'}
          {settings.status === 'finished' && ' The election has ended. View final results on the standings page.'}
        </div>
      )}

      {/* ── Header ── */}
      <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>DIU Committee Ballots</h1>
          <p className="section-sub">Select your team, review positions, and cast your vote</p>
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

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{successMsg}</div>}
      {submitting && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="spinner" style={{ width: 16, height: 16 }} /> Submitting vote…
        </div>
      )}

      {/* ── Dropdown Team Selection ── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'rgba(12, 19, 36, 0.45)', position: 'relative', zIndex: 20 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Select Team
          </label>
          
          <div className="custom-select-wrapper" style={{
            '--theme-accent': accentColor,
            '--theme-accent-glow': `${accentColor}33`
          } as React.CSSProperties}>
            <button
              type="button"
              className={`custom-select-trigger${teamDropdownOpen ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTeamDropdownOpen(!teamDropdownOpen);
                setTeamSearchQuery('');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {selectedTeam ? (
                  <>
                    <img 
                      src={getTeamFlagUrl(selectedTeam.flag)} 
                      alt={selectedTeam.name} 
                      className="flag-circular" 
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        border: `2px solid ${accentColor}`,
                        boxShadow: `0 0 8px ${accentColor}22`
                      }} 
                    />
                    <span style={{ fontWeight: 600 }}>{selectedTeam.name}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Select a team…</span>
                )}
              </div>
              <span className="custom-select-arrow">
                <ChevronDownIcon />
              </span>
            </button>

            <div className={`custom-select-menu${teamDropdownOpen ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="custom-select-search-wrapper">
                <span className="custom-select-search-icon">🔍</span>
                <input
                  type="text"
                  className="custom-select-search-input"
                  placeholder="Search team..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  autoFocus={teamDropdownOpen}
                />
                {teamSearchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setTeamSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', padding: '0 4px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="custom-select-options">
                {filteredTeams.length === 0 ? (
                  <div className="custom-select-empty">No teams found</div>
                ) : (
                  filteredTeams.map(t => {
                    const isCurrent = t.id === selectedTeamId;
                    const tAccent = getTeamAccentColor(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`custom-select-option${isCurrent ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedTeamId(t.id);
                          setTeamDropdownOpen(false);
                          setTeamSearchQuery('');
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('team', t.id);
                          router.replace(`/vote?${params.toString()}`);
                        }}
                        style={{
                          '--theme-accent': tAccent
                        } as React.CSSProperties}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img 
                            src={getTeamFlagUrl(t.flag)} 
                            alt={t.name} 
                            className="flag-circular" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              border: `1.5px solid ${tAccent}`
                            }} 
                          />
                          <span style={{ fontWeight: isCurrent ? 600 : 500 }}>{t.name}</span>
                        </div>
                        {isCurrent && <span style={{ color: tAccent, fontSize: 'var(--text-sm)' }}>✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state for switching teams */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : selectedTeamId ? (
        <>
          {/* ── Position Selection Dropdown (Mobile) ── */}
          <div className="position-dropdown-mobile" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="custom-select-wrapper" style={{
              '--theme-accent': accentColor,
              '--theme-accent-glow': `${accentColor}33`
            } as React.CSSProperties}>
              <button
                type="button"
                className={`custom-select-trigger${posDropdownOpen ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPosDropdownOpen(!posDropdownOpen);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600 }}>
                    {positions.find(p => p.id === activePos)?.title || 'Select Position'}
                  </span>
                  {hasVotedFor(activePos) && (
                    <span className="badge badge-green" style={{ fontSize: '9px', padding: '2px 6px' }}>✓ Voted</span>
                  )}
                </div>
                <span className="custom-select-arrow">
                  <ChevronDownIcon />
                </span>
              </button>

              <div className={`custom-select-menu${posDropdownOpen ? ' open' : ''}`}>
                <div className="custom-select-options">
                  {positions.map(pos => {
                    const voted = hasVotedFor(pos.id);
                    const isCurrent = pos.id === activePos;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        className={`custom-select-option${isCurrent ? ' selected' : ''}`}
                        onClick={() => {
                          setActivePos(pos.id);
                          setPosDropdownOpen(false);
                        }}
                      >
                        <span style={{ fontWeight: isCurrent ? 600 : 500 }}>{pos.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {voted && <span className="badge badge-green" style={{ fontSize: '9px' }}>✓ Voted</span>}
                          {isCurrent && <span style={{ color: accentColor }}>✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Position Selection Tabs (Desktop/Tablet) ── */}
          <div className="position-tabs-desktop" style={{ marginBottom: 'var(--space-6)' }}>
            {positions.map(pos => {
              const voted = hasVotedFor(pos.id);
              const isActive = activePos === pos.id;
              return (
                <button
                  key={pos.id}
                  className={`position-tab${isActive ? ' active' : ''}${voted ? ' voted' : ''}`}
                  onClick={() => setActivePos(pos.id)}
                  id={`pos-tab-${pos.id}-desktop`}
                  style={{
                    borderBottomColor: isActive ? accentColor : undefined,
                    color: isActive ? 'var(--text-primary)' : undefined,
                  }}
                >
                  <span className="position-tab-title">{pos.title}</span>
                  <span className="position-tab-status">
                    {voted ? '✓ Voted' : 'Vote'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Position Info Banner ── */}
          {activePos && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {hasVotedFor(activePos) ? (
                <div className="alert alert-success" style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', width: '100%' }}>
                  ✓ You have already voted for {positions.find(p => p.id === activePos)?.title} for {selectedTeam?.name}. Your choice is locked.
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Cast one ballot for this position. Choices are final and cannot be modified.
                </p>
              )}
            </div>
          )}

          {/* ── Candidates List View ── */}
          {currentCandidates.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px var(--space-4)' }}>
              <span className="empty-icon">👤</span>
              <p className="empty-title">No Candidates Available</p>
              <p className="empty-desc">There are no approved candidates running for this position in {selectedTeam?.name}.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {currentCandidates.map(cand => {
                const alreadyVoted = hasVotedFor(activePos);
                const isMyVote = selectedVotes[activePos] === cand.id;

                let cardClass = 'candidate-card';
                if (alreadyVoted) {
                  if (isMyVote) {
                    cardClass += ' voted';
                  } else {
                    cardClass += ' disabled';
                  }
                }

                return (
                  <div
                    key={cand.id}
                    className={cardClass}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 'var(--space-5)',
                      padding: 'var(--space-4)',
                      alignItems: 'center',
                      borderLeft: isMyVote ? `4px solid ${accentColor}` : undefined,
                      background: 'rgba(12, 19, 36, 0.35)',
                      flexWrap: 'wrap'
                    }}
                    id={`cand-${cand.id}`}
                  >
                    {/* Left: Avatar */}
                    <div style={{ flexShrink: 0 }}>
                      {cand.photoUrl ? (
                        <img 
                          src={cand.photoUrl} 
                          alt={cand.name} 
                          className="candidate-photo" 
                          style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                        />
                      ) : (
                        <div className="candidate-photo-placeholder" style={{ width: '60px', height: '60px', borderRadius: '8px', fontSize: '24px' }}>👤</div>
                      )}
                    </div>

                    {/* Middle: Details & Manifesto */}
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{cand.name}</h4>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          ({cand.department} · {cand.batch})
                        </span>
                      </div>
                      {cand.studentId && (
                        <p style={{ margin: '2px 0 6px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Student ID: {cand.studentId}</p>
                      )}
                      {cand.manifesto && (
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {truncate(cand.manifesto, 180)}
                        </p>
                      )}
                    </div>

                    {/* Right: Vote Action button */}
                    <div style={{ flexShrink: 0, marginLeft: 'auto', width: '100%', maxWidth: '160px', marginTop: 'var(--space-2)' }}>
                      {!isLive ? (
                        <button disabled className="btn btn-ghost btn-full btn-sm" style={{ opacity: 0.5, fontSize: 'var(--text-xs)' }}>
                          {settings?.status === 'draft' ? 'Voting Not Open' : 'Voting Closed'}
                        </button>
                      ) : alreadyVoted ? (
                        isMyVote ? (
                          <div className="badge badge-green" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '6px 0', fontSize: 'var(--text-xs)', background: `${accentColor}22`, border: `1px solid ${accentColor}` }}>
                            ✓ Voted Choice
                          </div>
                        ) : (
                          <button disabled className="btn btn-ghost btn-full btn-sm" style={{ fontSize: 'var(--text-xs)' }}>
                            Selection Locked
                          </button>
                        )
                      ) : (
                        <button
                          className="btn btn-primary btn-full btn-sm"
                          onClick={() => handleSelect(activePos, cand.id)}
                          disabled={submitting}
                          id={`btn-vote-${cand.id}`}
                          style={{ background: accentColor, borderColor: accentColor }}
                        >
                          Vote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* ── Confirm Vote Modal ── */}
      {showModal && pendingVote && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Confirm Your Vote</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              You are about to lock your vote for:
            </p>
            <div className="card" style={{ marginBottom: 'var(--space-4)', borderLeft: `4px solid ${accentColor}` }}>
              <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', margin: 0 }}>
                {candidates.find(c => c.id === pendingVote.candId)?.name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {positions.find(p => p.id === pendingVote.posId)?.title} · {selectedTeam?.name}
              </p>
            </div>
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              ⚠ This ballot is permanent and cannot be modified or re-cast.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} id="btn-cancel-vote">
                Cancel
              </button>
              <button className="btn btn-green" onClick={confirmVote} id="btn-confirm-vote" style={{ background: accentColor, borderColor: accentColor }}>
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={<div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>}>
      <VoteBoothContent />
    </Suspense>
  );
}
