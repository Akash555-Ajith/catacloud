'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googleNameInput, setGoogleNameInput] = useState<string>('');

  // If already logged in, redirect to home page
  useEffect(() => {
    const user = localStorage.getItem('bluefine_user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    if (!email.includes('@') || email.length < 5) {
      setError('Please enter a valid business email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    // Simulate luxury API authentication latency
    setTimeout(() => {
      setLoading(false);
      
      const isSystemAdmin = email.toLowerCase() === 'admin@gmail.com' && password === '12345678';
      
      // Load accounts from LocalStorage
      let accounts: any[] = [];
      try {
        const stored = localStorage.getItem('bluefine_user_accounts');
        if (stored) accounts = JSON.parse(stored);
      } catch (err) {
        // ignore
      }

      // Ensure system admin is always registered
      const hasAdmin = accounts.some(a => a.email.toLowerCase() === 'admin@gmail.com');
      if (!hasAdmin) {
        accounts.push({
          email: 'admin@gmail.com',
          password: '12345678',
          name: 'Admin Manager',
          role: 'admin'
        });
        localStorage.setItem('bluefine_user_accounts', JSON.stringify(accounts));
      }

      const cleanEmail = email.trim().toLowerCase();

      if (isSignUp) {
        // Sign Up Flow
        const exists = accounts.some(a => a.email.toLowerCase() === cleanEmail);
        if (exists) {
          setError('This email address is already registered. Please login.');
          return;
        }

        const newUser = {
          email: cleanEmail,
          password: password,
          name: displayName.trim(),
          role: cleanEmail === 'admin@gmail.com' ? 'admin' : 'user'
        };

        accounts.push(newUser);
        localStorage.setItem('bluefine_user_accounts', JSON.stringify(accounts));

        // Auto-login
        localStorage.setItem('bluefine_user', JSON.stringify({
          email: cleanEmail,
          name: newUser.name,
          role: newUser.role
        }));
        
        router.push('/');
      } else {
        // Login Flow
        const matchedUser = accounts.find(a => a.email.toLowerCase() === cleanEmail && a.password === password);
        
        if (isSystemAdmin || matchedUser) {
          const finalUser = matchedUser || {
            email: 'admin@gmail.com',
            name: 'Admin Manager',
            role: 'admin'
          };

          localStorage.setItem('bluefine_user', JSON.stringify({
            email: finalUser.email,
            name: finalUser.name,
            role: finalUser.role
          }));
          router.push('/');
        } else {
          setError('Invalid business email or secure key code.');
        }
      }
    }, 1200);
  };

  const handleGoogleAuth = async () => {
    // If Supabase is configured, trigger real Google OAuth
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) {
          setError(error.message);
        }
        return;
      } catch (err: any) {
        console.warn('Supabase OAuth fail:', err);
      }
    }

    // Fallback: Open premium Google account simulation modal
    setGoogleEmailInput('');
    setGoogleNameInput('');
    setShowGoogleModal(true);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim() || !googleNameInput.trim()) {
      return;
    }

    setLoading(true);
    setShowGoogleModal(false);

    // Simulate Google authentication latency
    setTimeout(() => {
      setLoading(false);
      const cleanEmail = googleEmailInput.trim().toLowerCase();
      const cleanName = googleNameInput.trim();

      // Load accounts from LocalStorage
      let accounts: any[] = [];
      try {
        const stored = localStorage.getItem('bluefine_user_accounts');
        if (stored) accounts = JSON.parse(stored);
      } catch (err) {
        // ignore
      }

      // Check if user already exists
      let matchedUser = accounts.find(a => a.email.toLowerCase() === cleanEmail);
      if (!matchedUser) {
        matchedUser = {
          email: cleanEmail,
          password: 'google-oauth-dummy-password',
          name: cleanName,
          role: 'user'
        };
        accounts.push(matchedUser);
        localStorage.setItem('bluefine_user_accounts', JSON.stringify(accounts));
      }

      // Log in
      localStorage.setItem('bluefine_user', JSON.stringify({
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role
      }));

      router.push('/');
    }, 1000);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={`${styles.card} glassmorphism`}>
        <div className={styles.header}>
          {/* Logo SVG */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.5))' }}
          >
            <path
              d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
              fill="url(#login-logo-grad)"
            />
            <path
              d="M4 16C4 9.37258 9.37258 4 16 4C19 4 21.5 5 22.5 6.5C19 7 16 9 14.5 11C13 13 12 15 10 16.5C8 18 6 18.5 4.5 18C4 17.5 4 17 4 16Z"
              fill="url(#login-logo-grad-accent)"
              opacity="0.7"
            />
            <defs>
              <linearGradient id="login-logo-grad" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
              <linearGradient id="login-logo-grad-accent" x1="4" y1="4" x2="22.5" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e2b744" />
                <stop offset="1" stopColor="#b88e1a" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className={styles.logoText}>Bluefine</h1>
          <span className={styles.tagline}>{isSignUp ? 'Partner Sourcing Sign-Up' : 'Marine Catalogue'}</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} id="login-form">
          {error && <div className={styles.errorText} id="login-error-message">{error}</div>}

          {isSignUp && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="displayName">
                Display / Business Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="luxury-input"
                placeholder="e.g. Master Chef John, Golden Crust Bakery"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Business Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="luxury-input"
              placeholder="e.g. chef@finedining.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Secure Key Code
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="luxury-input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary styles.submitBtn"
            style={{ width: '100%', height: '48px', fontSize: '1rem', marginTop: '12px' }}
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? 'Processing Credentials...' : (isSignUp ? 'Register & Authenticate' : 'Authenticate')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ padding: '0 12px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            marginBottom: '10px'
          }}
          id="google-auth-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isSignUp ? 'Sign Up with Google' : 'Sign In with Google'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Already registered? ' : 'First time here? '}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>

        <div className={styles.demoBox}>
          <div className={styles.demoTitle}>Portal Access & Authorization</div>
          <span style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Chef Registry:</strong> Click <strong>Sign Up</strong> to register your unique business account.
          </span>
          <span>
            <strong>Admin Access:</strong> Login using email <code>admin@gmail.com</code> and secure key <code>12345678</code>.
          </span>
        </div>
      </div>

      {showGoogleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(3, 8, 18, 0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glassmorphism" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '32px', boxShadow: 'var(--shadow-glass)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>Sign in with Google</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>to continue to Bluefine Sourcing Platform</p>
            </div>

            <form onSubmit={handleGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Google Account Email</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="luxury-input"
                  placeholder="yourname@gmail.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Display / Partner Name</label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  className="luxury-input"
                  placeholder="e.g. Chef Oliver"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn-gold"
                  style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyan"
                  style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
