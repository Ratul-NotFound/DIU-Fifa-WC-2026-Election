'use client';

import React, { useEffect, useState } from 'react';
import { getElectionSettings, updateElectionSettings, addAuditLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';
import type { ElectionSettings, ElectionStatus } from '@/lib/types';
import { statusLabel, formatLocalDatetime } from '@/lib/utils/helpers';

export default function ElectionControlPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [votingStart, setVotingStart] = useState('');
  const [votingEnd, setVotingEnd] = useState('');
  const [customBanner, setCustomBanner] = useState('');

  useEffect(() => {
    getElectionSettings().then(s => {
      setSettings(s);
      if (s?.votingStart) setVotingStart(formatLocalDatetime(s.votingStart));
      if (s?.votingEnd)   setVotingEnd(formatLocalDatetime(s.votingEnd));
      if (s?.customBannerMessage) setCustomBanner(s.customBannerMessage);
      setLoading(false);
    });
  }, []);

  const changeStatus = async (status: ElectionStatus) => {
    if (!profile) return;
    setSaving(true);
    await updateElectionSettings({
      status,
      votingStart: votingStart ? new Date(votingStart).getTime() : null,
      votingEnd: votingEnd ? new Date(votingEnd).getTime() : null,
    }, profile.uid);
    await addAuditLog({
      adminUid: profile.uid,
      adminName: profile.name,
      action: `Election status changed to: ${statusLabel(status)}`,
      target: 'electionSettings',
      details: '',
      timestamp: Date.now(),
    });
    const updated = await getElectionSettings();
    setSettings(updated);
    setSaving(false);
    setMsg(`Status updated to "${statusLabel(status)}"`);
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleApplications = async (open: boolean) => {
    if (!profile) return;
    setSaving(true);
    await updateElectionSettings({
      applicationsOpen: open
    }, profile.uid);
    await addAuditLog({
      adminUid: profile.uid,
      adminName: profile.name,
      action: open ? 'Candidate applications opened' : 'Candidate applications closed',
      target: 'electionSettings',
      details: '',
      timestamp: Date.now(),
    });
    const updated = await getElectionSettings();
    setSettings(updated);
    setSaving(false);
    setMsg(open ? 'Candidate applications are now OPEN' : 'Candidate applications are now CLOSED');
    setTimeout(() => setMsg(''), 3000);
  };

  const saveDates = async () => {
    if (!profile) return;
    setSaving(true);
    await updateElectionSettings({
      votingStart: votingStart ? new Date(votingStart).getTime() : null,
      votingEnd: votingEnd ? new Date(votingEnd).getTime() : null,
    }, profile.uid);
    setSaving(false);
    setMsg('Dates saved.');
    setTimeout(() => setMsg(''), 2000);
  };

  const toggleStatusBanner = async () => {
    if (!profile || !settings) return;
    const nextVal = settings.showStatusBanner === false ? true : false;
    setSaving(true);
    await updateElectionSettings({
      showStatusBanner: nextVal
    }, profile.uid);
    await addAuditLog({
      adminUid: profile.uid,
      adminName: profile.name,
      action: nextVal ? 'Enabled dashboard status banner' : 'Disabled dashboard status banner',
      target: 'electionSettings',
      details: '',
      timestamp: Date.now(),
    });
    const updated = await getElectionSettings();
    setSettings(updated);
    setSaving(false);
    setMsg(nextVal ? 'Status banner enabled.' : 'Status banner disabled.');
    setTimeout(() => setMsg(''), 2500);
  };

  const saveAnnouncement = async () => {
    if (!profile) return;
    setSaving(true);
    await updateElectionSettings({
      customBannerMessage: customBanner.trim()
    }, profile.uid);
    await addAuditLog({
      adminUid: profile.uid,
      adminName: profile.name,
      action: `Updated custom dashboard notice: "${customBanner.trim()}"`,
      target: 'electionSettings',
      details: '',
      timestamp: Date.now(),
    });
    const updated = await getElectionSettings();
    setSettings(updated);
    setSaving(false);
    setMsg('Announcement settings saved.');
    setTimeout(() => setMsg(''), 2500);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const controls: { status: ElectionStatus; label: string; cls: string; desc: string }[] = [
    { status: 'draft',    label: 'Set to Draft',          cls: 'btn-ghost',   desc: 'Hidden from voters. Setup phase.' },
    { status: 'live',     label: '▶ Start Voting',        cls: 'btn-green',   desc: 'Opens voting for all students.' },
    { status: 'counting', label: '⏸ Close Voting',        cls: 'btn-primary', desc: 'Voting closed. Counting phase.' },
    { status: 'finished', label: '🏆 Publish Results',    cls: 'btn-danger',  desc: 'Final results visible to all.' },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Election Control</h1>
          <p className="section-sub">Manage the election lifecycle</p>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{msg}</div>}

      {/* Current Status */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <p className="stat-label">Current Status</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <span className={`badge${
            settings?.status === 'live' ? ' badge-green badge-dot' :
            settings?.status === 'counting' ? ' badge-yellow' :
            settings?.status === 'finished' ? ' badge-blue' : ' badge-muted'
          }`} style={{ fontSize: 'var(--text-sm)' }}>
            {statusLabel(settings?.status ?? 'draft')}
          </span>
          {settings?.updatedAt && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Candidate Applications Status */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Candidate Applications</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Control whether new students can apply to run as candidates.
            </p>
          </div>
          <span className={`badge ${settings?.applicationsOpen ? 'badge-green badge-dot' : 'badge-muted'}`}>
            {settings?.applicationsOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button
            className="btn btn-green btn-sm"
            onClick={() => toggleApplications(true)}
            disabled={saving || settings?.applicationsOpen === true}
            id="btn-apps-open"
          >
            Start Applications
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => toggleApplications(false)}
            disabled={saving || settings?.applicationsOpen === false}
            id="btn-apps-close"
          >
            Stop Applications
          </button>
        </div>
      </div>

      {/* Announcement & Banner Controls */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Dashboard Banner & Announcements</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Toggle default banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Show Election Status Banner</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                Display automatic status banners (e.g. "Voting is closed", "Election finished") on student dashboard.
              </p>
            </div>
            <button
              className={`btn btn-sm ${settings?.showStatusBanner !== false ? 'btn-primary' : 'btn-ghost'}`}
              onClick={toggleStatusBanner}
              disabled={saving}
              id="btn-toggle-status-banner"
            >
              {settings?.showStatusBanner !== false ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Custom Banner message */}
          <div className="form-group">
            <label className="form-label" htmlFor="custom-banner-msg">Custom Dashboard Announcement Notice</label>
            <input 
              id="custom-banner-msg" 
              type="text" 
              className="form-input" 
              placeholder="e.g. Voting will resume tomorrow morning at 9:00 AM..." 
              value={customBanner} 
              onChange={e => setCustomBanner(e.target.value)} 
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              If set, this announcement overrides the automatic status banner. Clear this field to restore status banners.
            </p>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={saveAnnouncement} disabled={saving} id="btn-save-announcement">
            Save Announcement Settings
          </button>
        </div>
      </div>

      {/* Voting Window */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Voting Window</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="vote-start">Start Date &amp; Time</label>
            <input id="vote-start" type="datetime-local" className="form-input" value={votingStart} onChange={e => setVotingStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vote-end">End Date &amp; Time</label>
            <input id="vote-end" type="datetime-local" className="form-input" value={votingEnd} onChange={e => setVotingEnd(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={saveDates} disabled={saving} id="btn-save-dates">
          Save Dates
        </button>
      </div>

      {/* Status Controls */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Change Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {controls.map(c => (
            <div key={c.status} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              background: settings?.status === c.status ? 'var(--blue-bg)' : 'var(--bg-secondary)',
              border: `1px solid ${settings?.status === c.status ? 'var(--blue-dim)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.label}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{c.desc}</p>
              </div>
              <button
                className={`btn ${c.cls} btn-sm`}
                onClick={() => changeStatus(c.status)}
                disabled={saving || settings?.status === c.status}
                id={`btn-status-${c.status}`}
              >
                {settings?.status === c.status ? 'Current' : 'Set'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
