'use client';

import React, { useEffect, useState } from 'react';
import { getPositions, createPosition, updatePosition, deletePosition, addAuditLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { Position } from '@/lib/types';

const defaultForm = { title: '', description: '', maxWinners: 1, order: 0 };

export default function AdminPositionsPage() {
  const { profile } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = async () => {
    const p = await getPositions();
    setPositions(p);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...defaultForm, order: positions.length + 1 });
    setShowForm(true);
  };
  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description ?? '', maxWinners: p.maxWinners, order: p.order });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    if (editing) {
      await updatePosition(editing.id, form);
      await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Updated position: ${form.title}`, target: editing.id, details: '', timestamp: Date.now() });
      showMsg(`✓ ${form.title} updated.`);
    } else {
      await createPosition(form);
      await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Created position: ${form.title}`, target: 'new', details: '', timestamp: Date.now() });
      showMsg(`✓ ${form.title} added.`);
    }
    setShowForm(false);
    setSubmitting(false);
    await reload();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete position "${title}"?`)) return;
    if (!profile) return;
    await deletePosition(id);
    await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Deleted position: ${title}`, target: id, details: '', timestamp: Date.now() });
    await reload();
    showMsg('Position removed.');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div><h1>Positions</h1><p className="section-sub">{positions.length} committee positions</p></div>
        <button className="btn btn-primary btn-sm" onClick={openAdd} id="btn-add-position">+ Add Position</button>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Description</th>
              <th>Max Winners</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>No positions yet.</td></tr>
            )}
            {positions.map(p => (
              <tr key={p.id}>
                <td data-label="Order"><span className="badge badge-muted">{p.order}</span></td>
                <td data-label="Title"><strong>{p.title}</strong></td>
                <td data-label="Description" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{p.description || '—'}</td>
                <td data-label="Max Winners">
                  <span className="badge badge-blue">{p.maxWinners}</span>
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} id={`btn-edit-pos-${p.id}`}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.title)} id={`btn-del-pos-${p.id}`}>Delete</button>
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
            <h2 className="modal-title">{editing ? 'Edit Position' : 'Add Position'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. President" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Role description…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Max Winners</label>
                  <input className="form-input" type="number" min={1} max={20} value={form.maxWinners} onChange={e => setForm(f => ({...f, maxWinners: parseInt(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" min={1} value={form.order} onChange={e => setForm(f => ({...f, order: parseInt(e.target.value)}))} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-position">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
