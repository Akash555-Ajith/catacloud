'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Guard route & Hydration safety
  useEffect(() => {
    const checkAuthAndInit = async () => {
      let user = localStorage.getItem('catacloud_user');
      
      // If no local storage user, check if we have a valid Supabase session
      if (!user && isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userEmail = session.user.email || '';
            const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split('@')[0];
            const appUser = {
              email: userEmail.toLowerCase(),
              name: userName,
              role: userEmail.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user'
            };
            localStorage.setItem('catacloud_user', JSON.stringify(appUser));
            user = JSON.stringify(appUser);
            // Sync user details to accounts directory
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
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {
          console.warn('Failed to recover session on mount:', e);
        }
      }

      setMounted(true);

      // Bypasses subdomain redirect to login if the user has explicitly clicked logout
      const justLoggedOut = localStorage.getItem('catacloud_logged_out');
      if (justLoggedOut === 'true') {
        setIsAuthenticated(false);
        localStorage.removeItem('catacloud_logged_out');
        return;
      }

      if (!user) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        router.push('/dashboard');
      }
    };

    setTimeout(() => {
      checkAuthAndInit();
    }, 0);
  }, [router]);

  if (!mounted) {
    // Elegant loading screen during verification
    return (
      <div className="glassmorphism" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle at 50% 50%, #0c1c38 0%, #030812 100%)' }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <path
            d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
            fill="url(#loading-logo)"
          />
          <defs>
            <linearGradient id="loading-logo" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ marginTop: '16px', color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif' }}>
          Loading...
        </span>
      </div>
    );
  }

  // If already authenticated on the root page, we redirect to `/dashboard`
  if (isAuthenticated) {
    return (
      <div className="glassmorphism" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle at 50% 50%, #0c1c38 0%, #030812 100%)' }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <path
            d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
            fill="url(#loading-logo-redirect)"
          />
          <defs>
            <linearGradient id="loading-logo-redirect" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ marginTop: '16px', color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif' }}>
          Redirecting to Dashboard...
        </span>
      </div>
    );
  }

  // Not authenticated: always show the B2B landing page
  return (
    <div className={styles.main} style={{ background: '#020617', minHeight: '100vh', overflowX: 'hidden', color: '#f8fafc', position: 'relative' }}>
      {/* Header/Navbar */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 40px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => router.push('/')}
        >
          <img src="/logo-horizontal.svg" alt="CataCloud" style={{ height: '36px', display: 'block' }} />
        </div>
        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#solutions" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Solutions</a>
          <a href="#catalog" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Catalog</a>
          <a href="#pwa" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>PWA</a>
          <a href="#suppliers" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Suppliers</a>
          <a href="#pricing" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</a>
        </nav>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/login" style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>Login</a>
          <a href="/login" style={{
            background: 'linear-gradient(to right, #00f2fe, #4facfe)',
            color: '#030812',
            padding: '10px 24px',
            borderRadius: '9999px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            transition: 'transform 0.2s'
          }}>Get Started</a>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 0.95)), url("https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
      }}>
        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '900px' }}>
          <span style={{ fontSize: '0.9rem', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold', textShadow: '0 0 15px rgba(0, 242, 254, 0.4)' }}>
            Maritime Digital Commerce & Catalogues
          </span>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'var(--font-outfit), sans-serif',
            lineHeight: '1.1',
            letterSpacing: '-1.5px',
            margin: '0'
          }}>
            Empowering Maritime Commerce
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.85)',
            maxWidth: '650px',
            margin: '12px auto 24px',
            lineHeight: '1.6',
            fontFamily: 'var(--font-inter), sans-serif'
          }}>
            CataCloud provides wholesale maritime suppliers, shipping agencies, and distributors the power to build custom B2B storefronts, manage port stock, and negotiate secure proposals.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary flex items-center gap-2 hover:scale-105 transition-all cursor-pointer border-none"
              style={{ height: '52px', padding: '0 36px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '9999px', background: 'linear-gradient(to right, #00f2fe, #4facfe)', color: '#030812' }}
            >
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <button
              onClick={() => {
                document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-secondary flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              style={{ height: '52px', padding: '0 36px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '9999px' }}
            >
              Learn how it works
            </button>
          </div>
        </div>
      </section>

      <main className={styles.container} style={{ display: 'flex', flexDirection: 'column', gap: '80px', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Interactive Logo Container */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible', margin: '40px 0 20px 0' }}>
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.08)', filter: 'blur(80px)', animation: 'pulseNeon 4s ease-in-out infinite', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 10 }}>
            <img 
              src="/logo.svg" 
              alt="CataCloud Logo" 
              style={{ 
                height: '240px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 30px rgba(0, 242, 254, 0.35))',
                animation: 'float 4s ease-in-out infinite'
              }} 
            />
          </div>
        </div>

        {/* Feature Grid Section */}
        <section id="features-section" style={{ display: 'flex', flexDirection: 'column', gap: '48px', width: '100%', marginTop: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }}>
              Everything you need to trade globally
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px' }}>
              Simplify operations, curate catalogs, and handle logistics from one integrated panel.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            <div className="glassmorphism hover:scale-[1.02] transition-all duration-300" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--accent-cyan)', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>🏪</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 'bold' }}>Launch Store</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  Establish your custom B2B storefront. Choose your industry preset (Seafood, Bakery, Clothing, Egg Farm, or general retail) with bespoke attributes and product units.
                </p>
              </div>
            </div>

            <div className="glassmorphism hover:scale-[1.02] transition-all duration-300" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-blue)', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>📦</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 'bold' }}>Manage PWA & Items</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  Keep inventories synchronized automatically. Add new product lines, track stock counts, and check out walk-in or telephone sales on the terminal.
                </p>
              </div>
            </div>

            <div className="glassmorphism hover:scale-[1.02] transition-all duration-300" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--accent-gold)', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>📄</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 'bold' }}>Targeted Catalogs</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  Set customized pricing structures, volume discounts, and hide specific products to target procurement partners. Share secure links with clients.
                </p>
              </div>
            </div>

            <div className="glassmorphism hover:scale-[1.02] transition-all duration-300" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>🙋</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 'bold' }}>Direct Orders</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  Enable clients to browse, place reservation orders, or submit bulk volume requests. Track orders, logistics logs, and client billing from one location.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="glassmorphism" style={{ width: '100%', padding: '64px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(135deg, rgba(15,28,48,0.6) 0%, rgba(3,8,18,0.9) 100%)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }}>
            Launch your catalog business today
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', lineHeight: '1.6' }}>
            Join wholesale sellers and distributors scaling their catalog outreach with CataCloud. Setup takes less than 2 minutes.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary flex items-center gap-2 hover:scale-105 transition-all cursor-pointer border-none"
            style={{ height: '52px', padding: '0 36px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '9999px', background: 'var(--gradient-premium)', color: '#030812' }}
          >
            Get Started Now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </section>
      </main>
    </div>
  );
}
