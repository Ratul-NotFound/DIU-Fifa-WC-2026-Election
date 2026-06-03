'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, loginWithEmail, registerWithEmail, resendVerification } from '@/lib/firebase/auth';

type Mode = 'login' | 'register' | 'verify';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Sign-in failed.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await loginWithEmail(email, password);
    setLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    const res = await registerWithEmail(email, password, name);
    setLoading(false);
    if (res.success) {
      setMode('verify');
      setSuccess('Account created! Check your @diu.edu.bd inbox for a verification email.');
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  const handleResend = async () => {
    clearMessages();
    const res = await resendVerification();
    if (res.success) setSuccess('Verification email resent. Check your inbox.');
    else setError(res.error || 'Failed to resend.');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'transparent', border: 'none', height: '64px', width: 'auto', marginBottom: 'var(--space-2)' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/2026_FIFA_World_Cup_emblem.svg" alt="FIFA 2026 Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            DIU FIFA Election Platform
          </p>
        </div>

        {/* ─── Email Verification Screen ─── */}
        {mode === 'verify' && (
          <>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-sub">
              We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{success}</div>}
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
              After verifying, come back and sign in.
            </p>
            <button onClick={handleResend} className="btn btn-ghost btn-full" style={{ marginBottom: 'var(--space-3)' }}>
              Resend Verification Email
            </button>
            <button onClick={() => setMode('login')} className="btn btn-primary btn-full">
              Back to Sign In
            </button>
          </>
        )}

        {/* ─── Login Screen ─── */}
        {mode === 'login' && (
          <>
            <h1 className="auth-title">Sign In</h1>
            <p className="auth-sub">Use your <strong>@diu.edu.bd</strong> account</p>

            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{success}</div>}

            {/* Google */}
            <button onClick={handleGoogle} className="google-btn" disabled={loading} id="btn-google-signin">
              <svg className="google-logo" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google (@diu.edu.bd)
            </button>

            <div className="auth-divider">or sign in with email</div>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">DIU Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="student@diu.edu.bd"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="btn-email-login">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
              No account?{' '}
              <button
                onClick={() => { setMode('register'); clearMessages(); }}
                style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Create one
              </button>
            </p>
          </>
        )}

        {/* ─── Register Screen ─── */}
        {mode === 'register' && (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">Requires a valid <strong>@diu.edu.bd</strong> email</p>

            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">DIU Email</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="student@diu.edu.bd"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <span className="form-help">Must end with @diu.edu.bd</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="btn-register">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">or</div>

            <button onClick={handleGoogle} className="google-btn" disabled={loading}>
              <svg className="google-logo" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign up with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); clearMessages(); }}
                style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Sign in
              </button>
            </p>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <Link href="/" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
