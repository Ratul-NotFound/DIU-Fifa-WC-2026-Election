'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, setUserRole, addAuditLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { UserProfile, UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

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

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.studentId?.includes(search)
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
                <td data-label="Student ID"><span style={{ fontSize: 'var(--text-sm)' }}>{u.studentId || '—'}</span></td>
                <td data-label="Dept/Batch"><span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{u.department || '—'} / {u.batch || '—'}</span></td>
                <td data-label="Votes Cast">
                  <span className="badge badge-muted">{u.votedPositions?.length ?? 0}</span>
                </td>
                <td data-label="Role">
                  <span className={`badge ${roleBadge(u.role)}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                </td>
                <td data-label="Actions">
                  {u.uid !== profile?.uid && (
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
