'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { supabase, isSupabaseConfigured, cleanedSupabaseUrl } from '@/utils/supabaseClient';
import { toast } from 'sonner';
import { dbGetUser, dbSaveUser } from '@/utils/store';

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

  // Gmail Verification Modal states
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<{
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user';
    isGoogle?: boolean;
    isSignUp?: boolean;
    isGoogleOtp?: boolean;
  } | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const sendRealEmailCode = async (targetEmail: string, code: string) => {
    // Log code to browser console for development troubleshooting
    console.log(`[CataCloud Auth] Verification Code for ${targetEmail}: ${code}`);

    // Show secure dispatch notification
    toast.info(`Verification email sent to ${targetEmail}`, {
      description: "Please check your Gmail inbox (and spam folder) for the 6-digit verification code."
    });

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: "CataCloud Verification Code",
          "Verification Code": code,
          "Message": `Your CataCloud secure authentication verification code is: ${code}. Please enter this code in the login verification form to complete your sign in / sign up.`,
          "Platform": "CataCloud Sourcing & Catalogues Manager"
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Real email code successfully dispatched to ${targetEmail}!`);
      } else {
        console.warn("FormSubmit response non-success:", data);
      }
    } catch (e) {
      console.error("Failed to send real email code:", e);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    if (!verificationCode.trim()) {
      setVerificationError('Please enter a verification code.');
      return;
    }
    if (!pendingUser) return;

    // Local validation if Supabase is NOT configured
    if (!isSupabaseConfigured || !supabase) {
      if (verificationCode.trim() !== generatedCode) {
        setVerificationError('Invalid verification code. Please check your email inbox.');
        return;
      }
    }

    setLoading(true);
    try {
      const isRegistering = pendingUser.isSignUp !== false;
      const newUser = {
        email: pendingUser.email,
        password: pendingUser.password || 'google-oauth-dummy-password',
        name: pendingUser.name,
        role: pendingUser.role
      };

      if (isSupabaseConfigured && supabase) {
        // Native Supabase verification
        const verifyType = pendingUser.isGoogleOtp ? 'email' : (isRegistering ? 'signup' : 'signup');
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: pendingUser.email,
          token: verificationCode.trim(),
          type: verifyType
        });

        if (verifyError) {
          if (pendingUser.isGoogleOtp && verifyType === 'email') {
            const { error: retryError } = await supabase.auth.verifyOtp({
              email: pendingUser.email,
              token: verificationCode.trim(),
              type: 'magiclink'
            });
            if (retryError) throw retryError;
          } else {
            throw verifyError;
          }
        }
      }

      if (isRegistering) {
        await dbSaveUser(newUser);
      }

      localStorage.setItem('catacloud_user', JSON.stringify({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }));

      setShowVerificationModal(false);
      setPendingUser(null);
      setVerificationCode('');
      setGeneratedCode('');
      setLoading(false);
      handleRedirect(newUser.email);
      
      if (isRegistering) {
        toast.success('Gmail Account Verified & Registered Successfully!');
      } else {
        toast.success('Authentication Successful & Verified!');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  // Diagnostic logs to check environment variables on Vercel
  useEffect(() => {
    console.log('[CataCloud Auth System] Initialized.');
    console.log(' - Supabase Configured:', isSupabaseConfigured);
    console.log(' - Supabase URL:', cleanedSupabaseUrl);
  }, []);

  // Listen for simulated Google login message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_SIGNIN') {
        const { email, name } = event.data;
        handleGoogleCallback(email, name);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleCallback = async (googleEmail: string, googleName: string) => {
    setLoading(true);
    setError('');
    const cleanEmail = googleEmail.trim().toLowerCase();
    
    try {
      const matchedUser = await dbGetUser(cleanEmail);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isRealEmail = emailRegex.test(cleanEmail);

      if (!isRealEmail) {
        setError('Invalid email address format.');
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured && supabase) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });

        if (otpError) {
          setError(otpError.message);
          setLoading(false);
          return;
        }

        setPendingUser({
          email: cleanEmail,
          password: 'google-oauth-dummy-password',
          name: matchedUser?.name || googleName,
          role: matchedUser?.role || 'user',
          isSignUp: !matchedUser,
          isGoogleOtp: true
        });
        setLoading(false);
        setShowVerificationModal(true);
        toast.info(`Verification email sent by Supabase to ${cleanEmail}`);
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      if (matchedUser) {
        // Sign In Mode: Check if account exists
        setPendingUser({
          email: matchedUser.email,
          password: matchedUser.password || 'google-oauth-dummy-password',
          name: matchedUser.name,
          role: matchedUser.role,
          isSignUp: false
        });
        setLoading(false);
        setShowVerificationModal(true);
        sendRealEmailCode(cleanEmail, code);
      } else {
        // Sign Up Mode: Create new user
        setPendingUser({
          email: cleanEmail,
          password: 'google-oauth-dummy-password',
          name: googleName,
          role: 'user',
          isSignUp: true
        });
        setLoading(false);
        setShowVerificationModal(true);
        sendRealEmailCode(cleanEmail, code);
      }
    } catch (err) {
      console.error(err);
      setError('Google Sign-In callback failed.');
      setLoading(false);
    }
  };

  const handleRedirect = (userEmail: string) => {
    const params = new URLSearchParams(window.location.search);
    const targetStore = params.get('store');
    if (targetStore) {
      localStorage.setItem(`catacloud_active_store_id_${userEmail}`, targetStore);
    }
    router.push('/dashboard');
  };

  // If already logged in, redirect to home page, and listen for Supabase auth redirects
  useEffect(() => {
    const user = localStorage.getItem('catacloud_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        handleRedirect(parsed.email);
      } catch {
        router.push('/dashboard');
      }
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
        if (session?.user) {
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split('@')[0];
          
          const appUser = {
            email: userEmail.toLowerCase(),
            name: userName,
            role: userEmail.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user'
          };
          
          localStorage.setItem('catacloud_user', JSON.stringify(appUser));
          
          // Add to local accounts directory for consistency
          let accounts: any[] = [];
          try {
            const stored = localStorage.getItem('catacloud_user_accounts');
            if (stored) accounts = JSON.parse(stored);
          } catch (e) {}
          if (!accounts.some(a => a.email.toLowerCase() === appUser.email)) {
            accounts.push({
              email: appUser.email,
              password: 'google-oauth-dummy-password',
              name: appUser.name,
              role: appUser.role
            });
            localStorage.setItem('catacloud_user_accounts', JSON.stringify(accounts));
          }
          
          handleRedirect(appUser.email);
        }
      });
      return () => subscription.unsubscribe();
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
      const cleanEmail = email.trim().toLowerCase();

      const runAuth = async () => {
        if (isSignUp) {
          // Sign Up Flow
          const exists = await dbGetUser(cleanEmail);
          if (exists) {
            setError('This email address is already registered. Switching to Sign In mode...');
            setIsSignUp(false); // Automatically toggle to sign in mode
            setLoading(false);
            return;
          }

          if (isSupabaseConfigured && supabase) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: {
                  name: displayName.trim(),
                  role: 'user'
                }
              }
            });

            if (signUpError) {
              setError(signUpError.message);
              setLoading(false);
              return;
            }

            setPendingUser({
              email: cleanEmail,
              password: password,
              name: displayName.trim(),
              role: 'user',
              isSignUp: true
            });
            setLoading(false);
            setShowVerificationModal(true);
            toast.info(`Verification email sent by Supabase to ${cleanEmail}`);
            return;
          }

          const newUser = {
            email: cleanEmail,
            password: password,
            name: displayName.trim(),
            role: (cleanEmail === 'admin@gmail.com' ? 'admin' : 'user') as 'admin' | 'user'
          };

          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedCode(code);
          setPendingUser({ ...newUser, isSignUp: true });
          setLoading(false);
          setShowVerificationModal(true);
          
          // Send real email code
          sendRealEmailCode(cleanEmail, code);
        } else {
          // Login Flow
          const matchedUser = await dbGetUser(cleanEmail);
          
          if (!matchedUser && !isSystemAdmin) {
            setError('This email account is not registered. Switching to Sign Up mode...');
            setIsSignUp(true); // Automatically toggle to sign up mode
            setLoading(false);
            return;
          }

          if (isSupabaseConfigured && supabase) {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password
            });

            if (signInError) {
              if (signInError.message.toLowerCase().includes('confirm') || signInError.message.toLowerCase().includes('verified')) {
                await supabase.auth.resend({
                  type: 'signup',
                  email: cleanEmail
                });
                
                setPendingUser({
                  email: cleanEmail,
                  password: password,
                  name: matchedUser?.name || 'User',
                  role: matchedUser?.role || 'user',
                  isSignUp: true
                });
                setLoading(false);
                setShowVerificationModal(true);
                toast.info(`Verification email resent by Supabase to ${cleanEmail}`);
                return;
              }

              setError(signInError.message);
              setLoading(false);
              return;
            }

            const finalUser = matchedUser || {
              email: cleanEmail,
              name: data.user?.user_metadata?.name || cleanEmail.split('@')[0],
              role: (cleanEmail === 'admin@gmail.com' ? 'admin' : 'user') as 'admin' | 'user'
            };

            localStorage.setItem('catacloud_user', JSON.stringify({
              email: finalUser.email,
              name: finalUser.name,
              role: finalUser.role
            }));

            setLoading(false);
            handleRedirect(finalUser.email);
            toast.success('Authentication Successful!');
            return;
          }

          if (isSystemAdmin || (matchedUser && matchedUser.password === password)) {
            const finalUser = matchedUser || {
              email: 'admin@gmail.com',
              name: 'Admin Manager',
              password: '12345678',
              role: 'admin' as 'admin' | 'user'
            };

            // Seed system admin to db if not exists
            if (isSystemAdmin && !matchedUser) {
              await dbSaveUser({
                email: 'admin@gmail.com',
                name: 'Admin Manager',
                password: '12345678',
                role: 'admin'
              });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            setPendingUser({
              email: finalUser.email,
              name: finalUser.name,
              password: finalUser.password || password,
              role: finalUser.role,
              isSignUp: false
            });
            setLoading(false);
            setShowVerificationModal(true);

            // Send real email code
            sendRealEmailCode(finalUser.email, code);
          } else {
            setError('Invalid secure key code.');
            setLoading(false);
          }
        }
      };

      runAuth().catch((err) => {
        console.error(err);
        setError('An unexpected error occurred during authentication.');
        setLoading(false);
      });
    }, 1200);
  };

  const handleGoogleAuth = () => {
    setError('');
    
    // Open a real popup window simulating official Google Identity Services popup
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      '/login/google',
      'Google Sign-In',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
    );
  };


  return (
    <div className={styles.pageContainer}>
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={`${styles.card} glassmorphism`}>
        <div className={styles.header}>
          <img src="/logo.svg" alt="CataCloud" style={{ height: '140px', objectFit: 'contain', marginBottom: '12px' }} />
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
      </div>



      {showVerificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(3, 8, 18, 0.85)', backdropFilter: 'blur(10px)', zIndex: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glassmorphism" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '32px', boxShadow: 'var(--shadow-glass)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>✉️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--text-primary)' }}>Verify Your Email</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                A verification code has been sent to your email address: <strong style={{ color: 'var(--accent-cyan)' }}>{pendingUser?.email}</strong>.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                Please check your inbox (including your spam folder) for the <strong>6-digit verification code</strong> and enter it below.
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {verificationError && <div className={styles.errorText}>{verificationError}</div>}
              <div className={styles.formGroup}>
                <label className={styles.label}>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="luxury-input"
                  placeholder="e.g. 123456"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setPendingUser(null);
                  }}
                  className="btn-gold"
                  style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyan"
                  style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify & Proceed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
