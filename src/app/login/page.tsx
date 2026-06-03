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
      
      const userName = email.split('@')[0];
      const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
      
      localStorage.setItem(
        'bluefine_user',
        JSON.stringify({
          email: email.toLowerCase(),
          name: capitalizedName
        })
      );
      
      router.push('/');
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
          <span className={styles.tagline}>Marine Catalogue</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} id="login-form">
          {error && <div className={styles.errorText} id="login-error-message">{error}</div>}

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
            {loading ? 'Decrypting Credentials...' : 'Authenticate'}
          </button>
        </form>

        <div className={styles.demoBox}>
          <div className={styles.demoTitle}>Chef Portal Access</div>
          <span>Any business email and a password of 6+ characters will be accepted for catalog preview.</span>
        </div>
      </div>
    </div>
  );
}
