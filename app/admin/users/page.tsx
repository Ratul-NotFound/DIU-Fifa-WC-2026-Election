'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, setUserRole, addAuditLog, promoteUserByEmail } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { UserProfile, UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);

  const handlePromoteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== 'superAdmin') return;
    const emailLower = promoteEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@diu.edu.bd')) {
      alert('Only @diu.edu.bd emails are allowed.');
      return;
    }
    setPromoting(true);
    try {
      const res = await promoteUserByEmail(emailLower, 'admin');
      showMsg(res.message);
      setPromoteEmail('');
      await reload();
    } catch (err: any) {
      alert(err.message || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const reload = async () => {
    const u = await getAllUsers();
    setUsers(u);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleRoleChange = async (uid: string, name: string, role: UserRole) => {
    if (!profile) return;
    await setUserRole(uid, role);
    await addAuditLog({ adminUid: profile.uid, adminName: profile.name, action: `Changed role of ${name} to ${role}`, target: uid, details: '', timestamp: Date.now() });
    await reload();
    showMsg(`✓ Role updated for ${name}.`);
  };

  const getDisplayStudentIdAndBatch = (u: UserProfile) => {
    let displayId = u.studentId || '';
    let displayBatch = u.batch || '';

    const emailPrefix = u.email ? u.email.split('@')[0] : '';

    // Case 1: email prefix is already a formatted student ID (e.g. 262-33-009)
    if (/^\d{2,3}-\d{2,3}-\d{3,6}$/.test(emailPrefix)) {
      if (displayId === '201-15-5678' || !displayId) {
        displayId = emailPrefix;
      }
      if (displayBatch === '55th' || displayBatch === '55' || !displayBatch) {
        const part1 = emailPrefix.split('-')[0];
        const year = parseInt(part1.slice(0, 2), 10);
        const sem = parseInt(part1.slice(2, 3), 10);
        if (!isNaN(year) && !isNaN(sem) && sem >= 0 && sem <= 3) {
          const batchNum = 55 + (year - 20) * 3 + (sem - 1);
          displayBatch = `${batchNum}`;
        }
      }
    } else {
      // Case 2: email prefix has continuous digits (e.g. junayed2305101105)
      const digitsOnly = emailPrefix.replace(/\D/g, '');
      if ((displayId === '201-15-5678' || !displayId) && digitsOnly.length >= 8 && digitsOnly.length <= 12) {
        const part1 = digitsOnly.slice(0, 3);
        const part2 = digitsOnly.slice(3, 5);
        const part3 = digitsOnly.slice(5);
        displayId = `${part1}-${part2}-${part3}`;

        if (displayBatch === '55th' || displayBatch === '55' || !displayBatch) {
          const year = parseInt(part1.slice(0, 2), 10);
          const sem = parseInt(part1.slice(2, 3), 10);
          if (!isNaN(year) && !isNaN(sem) && sem >= 0 && sem <= 3) {
            const batchNum = 55 + (year - 20) * 3 + (sem - 1);
            displayBatch = `${batchNum}`;
          }
        }
      }
    }

    if (displayBatch && !isNaN(Number(displayBatch))) {
      displayBatch = `${displayBatch}th`;
    }

    return {
      studentId: displayId || '—',
      batch: displayBatch || '—'
    };
  };

  const usersWithDisplayDetails = users.map(u => {
    const { studentId, batch } = getDisplayStudentIdAndBatch(u);
    return { ...u, displayStudentId: studentId, displayBatch: batch };
  });

  const filtered = usersWithDisplayDetails.filter(u =>
    !search || 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.displayStudentId.includes(search)
  );

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const roleBadge = (role: UserRole) => {
    const map: Record<UserRole, string> = { student: 'badge-muted', candidate: 'badge-blue', admin: 'badge-yellow', superAdmin: 'badge-red' };
    return map[role] ?? 'badge-muted';
  };

  return (
    <div>
      <div className="section-header">
        <div><h1>Users</h1><p className="section-sub">{users.length} registered voters</p></div>
      </div>

      {profile?.role === 'superAdmin' && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: 480 }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-base)' }}>Promote Admin by Email</h3>
          <form onSubmit={handlePromoteByEmail} style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. username@diu.edu.bd"
              value={promoteEmail}
              onChange={e => setPromoteEmail(e.target.value)}
              required
              id="promote-email-input"
              style={{ minHeight: 38 }}
            />
            <button type="submit" className="btn btn-primary" disabled={promoting} style={{ flexShrink: 0, minHeight: 38 }}>
              {promoting ? 'Promoting…' : 'Add Admin'}
            </button>
          </form>
        </div>
      )}

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          className="form-input"
          placeholder="Search by name, email, student ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
          id="user-search"
        />
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Student ID</th>
              <th>Dept / Batch</th>
              <th>Votes Cast</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>No users found.</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.uid}>
                <td data-label="Name"><strong style={{ fontSize: 'var(--text-sm)' }}>{u.name || '—'}</strong></td>
                <td data-label="Email"><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{u.email}</span></td>
                <td data-label="Student ID"><span style={{ fontSize: 'var(--text-sm)' }}>{u.displayStudentId}</span></td>
                <td data-label="Dept/Batch"><span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{u.department || '—'} / {u.displayBatch}</span></td>
                <td data-label="Votes Cast">
                  <span className="badge badge-muted">{u.votedPositions?.length ?? 0}</span>
                </td>
                <td data-label="Role">
                  <span className={`badge ${roleBadge(u.role)}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                </td>
                <td data-label="Actions">
                  {profile?.role === 'superAdmin' && u.uid !== profile?.uid ? (
                    <select
                      className="form-select"
                      style={{ minHeight: 32, padding: '0 var(--space-3)', fontSize: 'var(--text-xs)', width: 'auto' }}
                      value={u.role}
                      onChange={e => handleRoleChange(u.uid, u.name, e.target.value as UserRole)}
                      id={`role-select-${u.uid}`}
                    >
                      <option value="student">Student</option>
                      <option value="candidate">Candidate</option>
                      <option value="admin">Admin</option>
                      <option value="superAdmin">Super Admin</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
