'use client';

import React, { useEffect, useState } from 'react';
import { getAllCandidates, getTeams, getPositions, getElectionSettings, getAllUsers, getRecentAuditLogs, seedDefaultElectionData } from '@/lib/firebase/firestore';
import { statusLabel } from '@/lib/utils/helpers';
import Link from 'next/link';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    candidates: 0,
    pendingCandidates: 0,
    teams: 0,
    positions: 0,
    users: 0,
    totalVotes: 0,
  });
  const [settings, setSettings] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<{ id: string; action: string; adminName: string; timestamp: number }[]>([]);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('This will seed the 15 standard FIFA World Cup teams and 4 default positions if none exist. Continue?')) return;
    setSeeding(true);
    try {
      const res = await seedDefaultElectionData();
      alert(`Seeding completed! Seeded ${res.teamsSeeded} teams and ${res.positionsSeeded} positions.`);
      window.location.reload();
    } catch (err) {
      alert('Seeding failed: ' + (err as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    async function load() {
      const [cands, teams, positions, s, users, logs] = await Promise.all([
        getAllCandidates(),
        getTeams(),
        getPositions(),
        getElectionSettings(),
        getAllUsers(),
        getRecentAuditLogs(5),
      ]);
      setStats({
        candidates: cands.filter(c => c.approved).length,
        pendingCandidates: cands.filter(c => !c.approved).length,
        teams: teams.length,
        positions: positions.length,
        users: users.length,
        totalVotes: users.reduce((sum, u) => sum + (u.votedPositions?.length ?? 0), 0),
      });
      setSettings(s);
      setRecentLogs(logs);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const quickActions = [
    { label: 'Add Candidate', href: '/admin/candidates', icon: '👤' },
    { label: 'Manage Teams', href: '/admin/teams', icon: '🌍' },
    { label: 'Election Control', href: '/admin/election', icon: '🗳️' },
    { label: 'View Results', href: '/results', icon: '📊' },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Admin Overview</h1>
          <p className="section-sub">DIU FIFA Election Dashboard</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSeed}
            disabled={seeding}
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)', fontWeight: 600 }}
          >
            {seeding ? 'Seeding…' : '✨ Seed Default Data'}
          </button>
          {settings && (
            <span className={`badge${
              settings.status === 'live' ? ' badge-green badge-dot' :
              settings.status === 'counting' ? ' badge-yellow' :
              settings.status === 'finished' ? ' badge-blue' : ' badge-muted'
            }`}>
              {statusLabel(settings.status)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Teams</p>
          <p className="stat-value">{stats.teams}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Positions</p>
          <p className="stat-value">{stats.positions}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Approved Candidates</p>
          <p className="stat-value">{stats.candidates}</p>
          {stats.pendingCandidates > 0 && (
            <p className="stat-sub" style={{ color: 'var(--yellow)' }}>
              {stats.pendingCandidates} pending
            </p>
          )}
        </div>
        <div className="stat-card">
          <p className="stat-label">Registered Voters</p>
          <p className="stat-value">{stats.users}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Votes Cast</p>
          <p className="stat-value">{stats.totalVotes}</p>
        </div>
      </div>

      {/* Pending Alert */}
      {stats.pendingCandidates > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
          ⚠ <strong>{stats.pendingCandidates}</strong> candidate(s) awaiting approval.{' '}
          <Link href="/admin/candidates" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
            Review now →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        {quickActions.map(a => (
          <Link key={a.href} href={a.href} className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{a.icon}</div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{a.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <Link href="/admin/logs" className="btn btn-ghost btn-sm">All Logs →</Link>
          </div>
          <div className="card">
            {recentLogs.map(log => (
              <div key={log.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{log.action}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>by {log.adminName}</p>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
