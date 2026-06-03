'use client';

import React, { useEffect, useState } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, addAuditLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { Team } from '@/lib/types';
import { getTeamFlagUrl, getTeamAccentColor } from '@/lib/utils/helpers';

const defaultForm = { name: '', flag: '', logo: '', banner: '', description: '' };

export default function AdminTeamsPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = async () => {
    const t = await getTeams();
    setTeams(t);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (t: Team) => { setEditing(t); setForm({ name: t.name, flag: t.flag ?? '', logo: t.logo ?? '', banner: t.banner ?? '', description: t.description ?? '' }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    if (editing) {
      await updateTeam(editing.id, form);
      await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Updated team: ${form.name}`, target: editing.id, details: '', timestamp: Date.now() });
      showMsg(`✓ ${form.name} updated.`);
    } else {
      await createTeam({ ...form, createdAt: Date.now() });
      await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Created team: ${form.name}`, target: 'new', details: '', timestamp: Date.now() });
      showMsg(`✓ ${form.name} added.`);
    }
    setShowForm(false);
    setSubmitting(false);
    await reload();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    if (!profile) return;
    await deleteTeam(id);
    await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Deleted team: ${name}`, target: id, details: '', timestamp: Date.now() });
    await reload();
    showMsg(`Team removed.`);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div><h1>Teams</h1><p className="section-sub">{teams.length} participating teams</p></div>
        <button className="btn btn-primary btn-sm" onClick={openAdd} id="btn-add-team">+ Add Team</button>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Name</th>
              <th>Logo URL</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>No teams yet. Add one above.</td></tr>
            )}
            {teams.map(t => (
              <tr key={t.id}>
                <td data-label="Flag">
                  <img 
                    src={getTeamFlagUrl(t.flag)} 
                    alt={t.name}
                    className="flag-circular"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      display: 'block',
                      '--team-accent': getTeamAccentColor(t.name),
                      '--team-accent-glow': getTeamAccentColor(t.name) + '25',
                    } as React.CSSProperties}
                  />
                </td>
                <td data-label="Name"><strong>{t.name}</strong></td>
                <td data-label="Logo URL">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {t.logo ? t.logo.slice(0, 40) + '…' : '—'}
                  </span>
                </td>
                <td data-label="Description" style={{ maxWidth: 200, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {t.description?.slice(0, 60) || '—'}
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} id={`btn-edit-team-${t.id}`}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id, t.name)} id={`btn-del-team-${t.id}`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Edit Team' : 'Add Team'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="e.g. Brazil" />
              </div>
              <div className="form-group">
                <label className="form-label">Flag Emoji</label>
                <input className="form-input" value={form.flag} onChange={e => setForm(f => ({...f, flag: e.target.value}))} placeholder="🇧🇷" />
                <span className="form-help">Paste the flag emoji for this country</span>
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input className="form-input" type="url" value={form.logo} onChange={e => setForm(f => ({...f, logo: e.target.value}))} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Brief team description…" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-team">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
