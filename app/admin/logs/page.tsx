'use client';

import React, { useEffect, useState } from 'react';
import { getRecentAuditLogs } from '@/lib/firebase/firestore';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/helpers';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentAuditLogs(100).then(l => { setLogs(l); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div><h1>Audit Logs</h1><p className="section-sub">Last {logs.length} admin actions</p></div>
        <button className="btn btn-ghost btn-sm" onClick={() => getRecentAuditLogs(100).then(setLogs)}>Refresh</button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>No audit logs yet.</td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td data-label="Time"><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</span></td>
                <td data-label="Admin"><span style={{ fontSize: 'var(--text-sm)' }}>{log.adminName}</span></td>
                <td data-label="Action"><span style={{ fontSize: 'var(--text-sm)' }}>{log.action}</span></td>
                <td data-label="Target"><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{log.target}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
