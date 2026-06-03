'use client';

import React, { useEffect, useState } from 'react';
import {
  getAllCandidates,
  getTeams,
  getPositions,
  approveCandidate,
  rejectCandidate,
  createCandidate,
  batchApproveCandidates,
  addAuditLog,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { Candidate, Team, Position } from '@/lib/types';

export default function AdminCandidatesPage() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Omit<Candidate, 'id' | 'votesReceived' | 'createdAt'>>({
    uid: '', name: '', studentId: '', department: '', batch: '',
    team: '', position: '', manifesto: '', photoUrl: '', approved: false,
  });

  const reload = async () => {
    const [c, t, p] = await Promise.all([getAllCandidates(), getTeams(), getPositions()]);
    setCandidates(c);
    setTeams(t);
    setPositions(p);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleApprove = async (id: string, name: string) => {
    await approveCandidate(id);
    if (profile) await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Approved candidate: ${name}`, target: id, details: '', timestamp: Date.now() });
    await reload();
    showMsg(`✓ ${name} approved.`);
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Remove candidate "${name}"? This cannot be undone.`)) return;
    await rejectCandidate(id);
    if (profile) await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Rejected/removed candidate: ${name}`, target: id, details: '', timestamp: Date.now() });
    await reload();
    showMsg(`Candidate removed.`);
  };

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    await batchApproveCandidates(Array.from(selected));
    if (profile) await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Batch approved ${selected.size} candidates`, target: 'multiple', details: '', timestamp: Date.now() });
    setSelected(new Set());
    await reload();
    showMsg(`✓ ${selected.size} candidates approved.`);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.team || !form.position) { showMsg('Select team and position.'); return; }
    setSubmitting(true);
    await createCandidate({ ...form, votesReceived: 0, createdAt: Date.now() });
    if (profile) await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Added candidate: ${form.name}`, target: form.team, details: '', timestamp: Date.now() });
    setShowForm(false);
    setForm({ uid: '', name: '', studentId: '', department: '', batch: '', team: '', position: '', manifesto: '', photoUrl: '', approved: false });
    setSubmitting(false);
    await reload();
    showMsg(`✓ ${form.name} added successfully.`);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const filtered = candidates.filter(c =>
    filter === 'all' ? true : filter === 'pending' ? !c.approved : c.approved
  );

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? id;
  const posName  = (id: string) => positions.find(p => p.id === id)?.title ?? id;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Candidates</h1>
          <p className="section-sub">{candidates.filter(c => !c.approved).length} pending approval</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} id="btn-add-candidate">
          + Add Candidate
        </button>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      {/* Filters & Batch */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'approved'] as const).map(f => (
          <button key={f} className={`btn btn-sm${filter === f ? ' btn-primary' : ' btn-ghost'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
        {selected.size > 0 && (
          <button className="btn btn-green btn-sm" onClick={handleBatchApprove} id="btn-batch-approve">
            ✓ Approve {selected.size} Selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={e => {
                if (e.target.checked) setSelected(new Set(filtered.filter(c => !c.approved).map(c => c.id)));
                else setSelected(new Set());
              }} /></th>
              <th>Name</th>
              <th>Team</th>
              <th>Position</th>
              <th>Dept / Batch</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>No candidates found.</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id}>
                <td data-label="">
                  {!c.approved && (
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  )}
                </td>
                <td data-label="Name">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {c.photoUrl && (
                      <img src={c.photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.12)', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{c.studentId}</p>
                    </div>
                  </div>
                </td>
                <td data-label="Team">{teamName(c.team)}</td>
                <td data-label="Position">{posName(c.position)}</td>
                <td data-label="Dept/Batch">{c.department} / {c.batch}</td>
                <td data-label="Status">
                  <span className={`badge ${c.approved ? 'badge-green' : 'badge-yellow'}`}>
                    {c.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {!c.approved && (
                      <button className="btn btn-green btn-sm" onClick={() => handleApprove(c.id, c.name)} id={`btn-approve-${c.id}`}>
                        Approve
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(c.id, c.name)} id={`btn-reject-${c.id}`}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Candidate Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add New Candidate</h2>
            <form onSubmit={handleAddCandidate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="Candidate's full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))} placeholder="221-15-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="CSE" />
                </div>
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <input className="form-input" value={form.batch} onChange={e => setForm(f => ({...f, batch: e.target.value}))} placeholder="58th" />
                </div>
                <div className="form-group">
                  <label className="form-label">Team *</label>
                  <select className="form-select" value={form.team} onChange={e => setForm(f => ({...f, team: e.target.value}))} required>
                    <option value="">Select team…</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <select className="form-select" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} required>
                    <option value="">Select position…</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Photo URL</label>
                  <input className="form-input" type="url" value={form.photoUrl} onChange={e => setForm(f => ({...f, photoUrl: e.target.value}))} placeholder="https://i.imgur.com/example.jpg" />
                  <span className="form-help">Use Imgur, ImgBB, or any direct image URL</span>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Manifesto</label>
                  <textarea className="form-textarea" value={form.manifesto} onChange={e => setForm(f => ({...f, manifesto: e.target.value}))} placeholder="Candidate's goals and plans…" rows={3} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input type="checkbox" id="cand-approved" checked={form.approved} onChange={e => setForm(f => ({...f, approved: e.target.checked}))} />
                  <label htmlFor="cand-approved" className="form-label" style={{ margin: 0 }}>Approve immediately</label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-candidate">
                  {submitting ? 'Adding…' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
