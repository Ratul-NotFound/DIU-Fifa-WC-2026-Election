'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: '', studentId: '', department: '', batch: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        studentId: profile.studentId ?? '',
        department: profile.department ?? '',
        batch: profile.batch ?? '',
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await updateUserProfile(profile.uid, form);
    await refreshProfile();
    setSaving(false);
    setMsg('Profile updated successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  if (!profile) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-content" style={{ maxWidth: 560 }}>
      <div className="section-header">
        <div>
          <h1>My Profile</h1>
          <p className="section-sub">Update your student information</p>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 'var(--text-xl)' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              profile.name?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{profile.name || 'Student'}</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{profile.email}</p>
            <span className="badge badge-blue" style={{ marginTop: 'var(--space-1)', textTransform: 'capitalize' }}>
              {profile.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-name">Full Name</label>
            <input id="pf-name" type="text" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-sid">Student ID (Locked)</label>
            <input id="pf-sid" type="text" className="form-input" value={form.studentId} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-dept">Department</label>
            <input id="pf-dept" type="text" className="form-input" placeholder="e.g. CSE" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-batch">Batch</label>
            <input id="pf-batch" type="text" className="form-input" placeholder="e.g. 58th" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-profile">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Voting Summary</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          You have voted for <strong style={{ color: 'var(--text-primary)' }}>{profile.votedPositions?.length ?? 0}</strong> position(s).
        </p>
      </div>
    </div>
  );
}
