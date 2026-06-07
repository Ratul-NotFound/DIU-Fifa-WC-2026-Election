'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase/auth';
import FootballLogo from '@/components/layout/FootballLogo';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';

function LoginPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(''); };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [user, authLoading, router, redirect]);

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || (lang === 'en' ? 'Sign-in failed.' : 'লগইন ব্যর্থ হয়েছে।'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="auth-logo-icon" style={{ background: 'transparent', border: 'none', height: '64px', width: '64px', marginBottom: 'var(--space-2)' }}>
            <FootballLogo />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            {t.appName}
          </p>
        </div>

        <h1 className="auth-title">{lang === 'en' ? 'Sign In' : 'লগইন করুন'}</h1>
        <p className="auth-sub">{lang === 'en' ? 'Use your' : 'আপনার'} <strong>@diu.edu.bd</strong> {lang === 'en' ? 'account' : 'অ্যাকাউন্ট ব্যবহার করুন'}</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        {/* Google */}
        <button onClick={handleGoogle} className="google-btn" disabled={loading} id="btn-google-signin">
          <svg className="google-logo" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {lang === 'en' ? 'Continue with Google (@diu.edu.bd)' : 'গুগল দিয়ে চালিয়ে যান (@diu.edu.bd)'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <Link href="/" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {lang === 'en' ? '← Back to home' : '← হোমে ফিরে যান'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
