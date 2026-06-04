'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');

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
    </div>
  );
}
