'use client';

import React, { useEffect, useState } from 'react';
import { getJerseys, createJersey, updateJersey, deleteJersey, getTeams, addAuditLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { Jersey, Team } from '@/lib/types';

const defaultForm = { teamName: '', edition: 'Fan' as 'Fan' | 'Player', colorVariant: 'Home', price: 1000, pictureUrl: '' };

export default function AdminJerseysPage() {
  const { profile } = useAuth();
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Jersey | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selected file is not an image.');
      return;
    }

    setCompressing(true);

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 300; // 4:3 aspect ratio is beautiful for jerseys
          
          canvas.width = MAX_WIDTH;
          canvas.height = MAX_HEIGHT;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            let srcX = 0;
            let srcY = 0;
            let srcW = img.width;
            let srcH = img.height;

            const targetRatio = MAX_WIDTH / MAX_HEIGHT;
            const srcRatio = srcW / srcH;

            if (srcRatio > targetRatio) {
              srcW = srcH * targetRatio;
              srcX = (img.width - srcW) / 2;
            } else {
              srcH = srcW / targetRatio;
              srcY = (img.height - srcH) / 2;
            }

            ctx.drawImage(
              img,
              srcX,
              srcY,
              srcW,
              srcH,
              0,
              0,
              MAX_WIDTH,
              MAX_HEIGHT
            );

            // Compress to JPEG at 75% quality to save Firestore bytes
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            setForm((f) => ({ ...f, pictureUrl: compressedDataUrl }));
          }
        } catch (err) {
          console.error(err);
          alert('Error compressing image.');
        } finally {
          setCompressing(false);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const reload = async () => {
    const [j, t] = await Promise.all([getJerseys(), getTeams()]);
    setJerseys(j);
    setTeams(t);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const showMsg = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (j: Jersey) => {
    setForm({
      teamName: j.teamName,
      edition: j.edition,
      colorVariant: j.colorVariant,
      price: j.price,
      pictureUrl: j.pictureUrl,
    });
    setEditing(j);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateJersey(editing.id, form);
        await addAuditLog({
          adminUid: profile.uid,
          adminName: profile.name,
          action: `Updated jersey: ${form.teamName} (${form.edition} Edition)`,
          target: editing.id,
          details: `Price: ${form.price} BDT, Color: ${form.colorVariant}`,
          timestamp: Date.now(),
        });
        showMsg(`✓ Jersey for ${form.teamName} updated.`);
      } else {
        await createJersey({
          ...form,
          createdAt: Date.now(),
        });
        await addAuditLog({
          adminUid: profile.uid,
          adminName: profile.name,
          action: `Created jersey: ${form.teamName} (${form.edition} Edition)`,
          target: 'new',
          details: `Price: ${form.price} BDT, Color: ${form.colorVariant}`,
          timestamp: Date.now(),
        });
        showMsg(`✓ Jersey for ${form.teamName} added.`);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      console.error(err);
      alert('Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, teamName: string, edition: string) => {
    if (!confirm(`Delete jersey for "${teamName} (${edition} Edition)"? This cannot be undone.`)) return;
    if (!profile) return;
    try {
      await deleteJersey(id);
      await addAuditLog({
        adminUid: profile.uid,
        adminName: profile.name,
        action: `Deleted jersey: ${teamName} (${edition} Edition)`,
        target: id,
        details: '',
        timestamp: Date.now(),
      });
      await reload();
      showMsg('Jersey removed.');
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Official Jerseys</h1>
          <p className="section-sub">{jerseys.length} jerseys listed for sale/display</p>
        </div>
        <div>
          <button className="btn btn-primary btn-sm" onClick={openAdd} id="btn-add-jersey">
            + Add Jersey
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Picture</th>
              <th>Team Name</th>
              <th>Edition</th>
              <th>Color Variant</th>
              <th>Price (BDT)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jerseys.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
                  No jerseys yet. Add one above.
                </td>
              </tr>
            )}
            {jerseys.map((j) => (
              <tr key={j.id}>
                <td data-label="Picture">
                  {j.pictureUrl ? (
                    <img
                      src={j.pictureUrl}
                      alt={j.teamName}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No Image</span>
                  )}
                </td>
                <td data-label="Team Name">
                  <strong>{j.teamName}</strong>
                </td>
                <td data-label="Edition">
                  <span className={`badge ${j.edition === 'Player' ? 'badge-blue' : 'badge-muted'}`}>
                    {j.edition}
                  </span>
                </td>
                <td data-label="Color Variant">
                  {j.colorVariant}
                </td>
                <td data-label="Price (BDT)">
                  <strong>{j.price} ৳</strong>
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(j)} id={`btn-edit-jersey-${j.id}`}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(j.id, j.teamName, j.edition)} id={`btn-del-jersey-${j.id}`}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Edit Jersey' : 'Add Jersey'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                {teams.length > 0 ? (
                  <select
                    className="form-input"
                    value={form.teamName}
                    onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                    <option value="DIU FIFA">DIU FIFA Community</option>
                  </select>
                ) : (
                  <input
                    className="form-input"
                    value={form.teamName}
                    onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))}
                    required
                    placeholder="e.g. Argentina"
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Edition *</label>
                <select
                  className="form-input"
                  value={form.edition}
                  onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value as 'Fan' | 'Player' }))}
                  required
                >
                  <option value="Fan">Fan Edition</option>
                  <option value="Player">Player Edition</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Color Variant *</label>
                <input
                  className="form-input"
                  value={form.colorVariant}
                  onChange={(e) => setForm((f) => ({ ...f, colorVariant: e.target.value }))}
                  required
                  placeholder="e.g. Home, Away, Third, Black Special"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (BDT) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  required
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Picture *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  
                  {/* File input (hidden) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Thumbnail Preview */}
                  {form.pictureUrl && (
                    <div style={{ position: 'relative', width: '120px', height: '90px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={form.pictureUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, pictureUrl: '' }))}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      className="btn btn-ghost btn-sm"
                      disabled={compressing}
                    >
                      {compressing ? 'Compressing…' : '📁 Upload File'}
                    </button>
                    
                    <span style={{ alignSelf: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      or paste direct URL below:
                    </span>
                  </div>

                  <input
                    className="form-input"
                    type="text"
                    value={form.pictureUrl}
                    onChange={(e) => setForm((f) => ({ ...f, pictureUrl: e.target.value }))}
                    required
                    placeholder="https://images.unsplash.com/... or upload a file"
                  />
                  <span className="form-help">Optimized and compressed automatically upon selection.</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-submit-jersey">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Jersey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
