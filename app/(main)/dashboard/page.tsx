'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams, getElectionSettings, getAllResultsForTeam } from '@/lib/firebase/firestore';
import type { Team, ElectionSettings, ResultsDoc } from '@/lib/types';
import { statusLabel, getTeamFlagUrl, getTeamAccentColor, getTeamGradient } from '@/lib/utils/helpers';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { lang, t } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [greetingText, setGreetingText] = useState('Hello');

  useEffect(() => {
    async function load() {
      const [t, s] = await Promise.all([getTeams(), getElectionSettings()]);
      setTeams(t);
      setSettings(s);
      
      const h = new Date().getHours();
      if (h < 12) setGreetingText(lang === 'en' ? 'Good morning' : 'শুভ সকাল');
      else if (h < 17) setGreetingText(lang === 'en' ? 'Good afternoon' : 'শুভ দুপুর');
      else setGreetingText(lang === 'en' ? 'Good evening' : 'শুভ সন্ধ্যা');
      
      setLoading(false);
    }
    load();
  }, [lang]);

  const votedCount = profile?.votedPositions?.length ?? 0;
  const isLive = settings?.status === 'live';

  const getLocalizedStatusLabel = (status: string) => {
    if (lang === 'bn') {
      const map: Record<string, string> = {
        draft: 'ড্রাফট (অকার্যকর)',
        live: 'লাইভ — ভোটদান চলছে',
        counting: 'ভোট গণনা করা হচ্ছে',
        finished: 'ফলাফল প্রকাশিত হয়েছে',
      };
      return map[status] ?? status;
    }
    return statusLabel(status);
  };

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

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <h1>{greetingText}, {profile?.name?.split(' ')[0] || (lang === 'en' ? 'Student' : 'শিক্ষার্থী')} 👋</h1>
          <p className="section-sub">{t.dashSub}</p>
        </div>
        {settings && (
          <span className={`badge ${
            settings.status === 'live' ? 'badge-green badge-dot' :
            settings.status === 'counting' ? 'badge-yellow' :
            settings.status === 'finished' ? 'badge-blue' : 'badge-muted'
          }`}>
            {getLocalizedStatusLabel(settings.status)}
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">{lang === 'en' ? 'Teams' : 'দলসমূহ'}</p>
          <p className="stat-value">{teams.length}</p>
          <p className="stat-sub">{lang === 'en' ? 'Participating' : 'অংশগ্রহণকারী'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{lang === 'en' ? 'Votes Cast' : 'প্রদত্ত ভোট'}</p>
          <p className="stat-value">{votedCount}</p>
          <p className="stat-sub">{lang === 'en' ? 'By you' : 'আপনার দেওয়া'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{lang === 'en' ? 'Status' : 'অবস্থা'}</p>
          <p className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
            {settings ? getLocalizedStatusLabel(settings.status) : (lang === 'en' ? 'Loading…' : 'লোড হচ্ছে…')}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{lang === 'en' ? 'Role' : 'ভূমিকা'}</p>
          <p className="stat-value" style={{ fontSize: 'var(--text-lg)', textTransform: 'capitalize' }}>
            {profile?.role ? getLocalizedRole(profile.role) : (lang === 'en' ? 'Student' : 'শিক্ষার্থী')}
          </p>
        </div>
      </div>

      {/* ── Election Status Banner ── */}
      {settings?.customBannerMessage ? (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
          📢 {settings.customBannerMessage}
        </div>
      ) : (
        settings?.showStatusBanner !== false && (
          <>
            {settings?.status === 'draft' && (
              <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
                🗓 {lang === 'en' ? 'Election has not started yet. Check back soon.' : 'নির্বাচন এখনও শুরু হয়নি। কিছু সময় পর চেক করুন।'}
              </div>
            )}
            {settings?.status === 'counting' && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                🔢 {lang === 'en' ? 'Voting is closed. Results are being counted.' : 'ভোটদান বন্ধ রয়েছে। ভোট গণনা করা হচ্ছে।'}
              </div>
            )}
            {settings?.status === 'finished' && (
              <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>
                🏆 {lang === 'en' ? 'Election finished!' : 'নির্বাচন সম্পন্ন হয়েছে!'} <Link href="/standings" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>{lang === 'en' ? 'View final standings →' : 'চূড়ান্ত ফলাফল দেখুন →'}</Link>
              </div>
            )}
          </>
        )
      )}

      {/* ── Teams Grid ── */}
      <div className="section-header">
        <div>
          <h2 className="section-title">{lang === 'en' ? 'National Teams' : 'জাতীয় দলসমূহ'}</h2>
          <p className="section-sub">
            {isLive 
              ? (lang === 'en' ? 'Select a team to vote for their committee members' : 'কমিটি সদস্যদের ভোট দিতে একটি দল নির্বাচন করুন') 
              : (lang === 'en' ? 'Teams participating in the election' : 'নির্বাচনে অংশগ্রহণকারী দলসমূহ')}
          </p>
        </div>
        <Link href="/standings" className="btn btn-ghost btn-sm">
          {lang === 'en' ? 'View Standings →' : 'ফলাফল দেখুন →'}
        </Link>
      </div>

      <div className="team-grid">
        {teams.map((team) => {
          const hasVoted = profile?.votedPositions?.some(vp => vp.startsWith(team.id + '_'));
          return (
            <Link
              key={team.id}
              href={`/vote?team=${team.id}`}
              className="team-card"
              style={{ 
                '--team-accent': getTeamAccentColor(team.name),
                '--team-accent-glow': getTeamAccentColor(team.name) + '25',
              } as React.CSSProperties}
            >
              {/* Colored top brand strip */}
              <div className="team-card-strip" style={{ height: '4px', width: '100%', background: getTeamGradient(team.name) }} />

              <div className="team-card-flag">
                <img 
                  src={getTeamFlagUrl(team.flag)} 
                  alt={team.name}
                />
              </div>
              <div className="team-card-body">
                <p className="team-card-name">{team.name}</p>
                {hasVoted && (
                  <span className="badge badge-green" style={{ marginTop: 'var(--space-2)', fontSize: '10px' }}>
                    ✓ {lang === 'en' ? 'Voted' : 'ভোট দিয়েছেন'}
                  </span>
                )}
                {isLive && !hasVoted && (
                  <span className="badge badge-blue" style={{ marginTop: 'var(--space-2)', fontSize: '10px' }}>
                    {t.dashVoteNowBtn}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">⚽</span>
          <p className="empty-title">{lang === 'en' ? 'No Teams Yet' : 'কোন দল নেই'}</p>
          <p className="empty-desc">
            {lang === 'en' ? 'Teams will appear here once the admin adds them.' : 'অ্যাডমিন দল যুক্ত করার পর এখানে প্রদর্শিত হবে।'}
          </p>
        </div>
      )}

    </div>
  );
}
