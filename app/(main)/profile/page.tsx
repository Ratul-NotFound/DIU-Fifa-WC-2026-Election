'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { updateUserProfile, getTeams } from '@/lib/firebase/firestore';
import { useLanguage } from '@/lib/context/LanguageContext';
import type { Team } from '@/lib/types';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({ name: '', studentId: '', department: '', batch: '', favoriteTeam: '' });
  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function loadTeams() {
      try {
        const list = await getTeams();
        setTeams(list);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    }
    loadTeams();
  }, []);

  useEffect(() => {
    if (profile) {
      let initialId = profile.studentId ?? '';
      let initialBatch = profile.batch ?? '';
      
      const emailPrefix = profile.email ? profile.email.split('@')[0] : '';
      
      if (initialId === '201-15-5678' || !initialId) {
        const hyphenMatch = emailPrefix.match(/\d{2,3}-\d{2,3}-\d{3,6}/);
        if (hyphenMatch) {
          initialId = hyphenMatch[0];
          if (initialBatch === '55th' || initialBatch === '55' || !initialBatch) {
            const part1 = initialId.split('-')[0];
            const year = parseInt(part1.slice(0, 2), 10);
            const sem = parseInt(part1.slice(2, 3), 10);
            if (!isNaN(year) && !isNaN(sem) && sem >= 0 && sem <= 3) {
              initialBatch = `${55 + (year - 20) * 3 + (sem - 1)}`;
            }
          }
        } else {
          const digitsMatch = emailPrefix.match(/\d{8,12}/);
          if (digitsMatch) {
            const digits = digitsMatch[0];
            const part1 = digits.slice(0, 3);
            const part2 = digits.slice(3, 5);
            const part3 = digits.slice(5);
            initialId = `${part1}-${part2}-${part3}`;
            
            if (initialBatch === '55th' || initialBatch === '55' || !initialBatch) {
              const year = parseInt(part1.slice(0, 2), 10);
              const sem = parseInt(part1.slice(2, 3), 10);
              if (!isNaN(year) && !isNaN(sem) && sem >= 0 && sem <= 3) {
                initialBatch = `${55 + (year - 20) * 3 + (sem - 1)}`;
              }
            }
          }
        }
      }

      setForm({
        name: profile.name ?? '',
        studentId: initialId,
        department: profile.department ?? '',
        batch: initialBatch,
        favoriteTeam: profile.favoriteTeam ?? '',
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
    setMsg(lang === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
    setTimeout(() => setMsg(''), 3000);
  };

  if (!profile) return <div className="loading-center"><div className="spinner" /></div>;

  const getLocalizedRole = (role: string) => {
    if (lang === 'bn') {
      const map: Record<string, string> = {
        student: 'শিক্ষার্থী ভোটার',
        admin: 'অ্যাডমিনিস্ট্রেটর',
        superAdmin: 'সুপার অ্যাডমিন',
      };
      return map[role] ?? role;
    }
    return role;
  };

  return (
    <div className="page-content" style={{ maxWidth: 560 }}>
      <div className="section-header">
        <div>
          <h1>{t.profileHeading}</h1>
          <p className="section-sub">{t.profileSub}</p>
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
              {getLocalizedRole(profile.role)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-name">{t.profileFormName}</label>
            <input id="pf-name" type="text" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-sid">{t.profileFormId}</label>
            <input id="pf-sid" type="text" className="form-input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-dept">{t.profileFormDept}</label>
            <input id="pf-dept" type="text" className="form-input" placeholder="e.g. CSE" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-batch">{t.profileFormBatch}</label>
            <input id="pf-batch" type="text" className="form-input" placeholder="e.g. 58th" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-team">{lang === 'en' ? 'Supported Team Badge' : 'সমর্থিত টিম ব্যাজ'}</label>
            <select
              id="pf-team"
              className="form-input"
              value={form.favoriteTeam}
              onChange={e => setForm(f => ({ ...f, favoriteTeam: e.target.value }))}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: 'var(--space-2) var(--space-3)',
                width: '100%',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">{lang === 'en' ? 'Select Team Badge' : 'টিম ব্যাজ নির্বাচন করুন'}</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-profile">
            {saving ? t.profileBtnSaving : t.profileBtnSave}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
          {lang === 'en' ? 'Voting Summary' : 'ভোটদানের সারসংক্ষেপ'}
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {lang === 'en' ? (
            <>You have voted for <strong style={{ color: 'var(--text-primary)' }}>{profile.votedPositions?.length ?? 0}</strong> position(s).</>
          ) : (
            <>আপনি <strong style={{ color: 'var(--text-primary)' }}>{profile.votedPositions?.length ?? 0}</strong> টি পদে ভোট দিয়েছেন।</>
          )}
        </p>
      </div>
    </div>
  );
}

