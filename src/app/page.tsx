'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FishItem } from '@/data/fishData';
import { getProducts, getStoreConfig } from '@/utils/store';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';
import Navbar from '@/components/Navbar';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';
import FishCard from '@/components/FishCard';
import FishModal from '@/components/FishModal';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './page.module.css';

interface CartItemData {
  fish: FishItem;
  quantity: number;
}

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [products, setProducts] = useState<FishItem[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  const [currentStoreId, setCurrentStoreId] = useState<string>('catacloud');
  const [isLandingPage, setIsLandingPage] = useState<boolean>(false);


  // Cart & UI states
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Filters & Sorting states
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  const handleLogout = async () => {
    localStorage.removeItem('bluefine_user');
    localStorage.removeItem('bluefine_cart');
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase logout error:', e);
      }
    }
    setIsAuthenticated(false);
    setIsLandingPage(true);
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  // Guard route & Hydration safety
  useEffect(() => {
    const checkAuthAndInit = async () => {
      let user = localStorage.getItem('bluefine_user');
      
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
            localStorage.setItem('bluefine_user', JSON.stringify(appUser));
            user = JSON.stringify(appUser);
            // Sync user details to accounts directory
            let accounts: any[] = [];
            try {
              const stored = localStorage.getItem('bluefine_user_accounts');
              if (stored) accounts = JSON.parse(stored);
            } catch (e) {}
            if (!accounts.some(a => a.email.toLowerCase() === appUser.email)) {
              accounts.push({
                email: appUser.email,
                password: 'google-oauth-dummy-password',
                name: appUser.name,
                role: appUser.role
              });
              localStorage.setItem('bluefine_user_accounts', JSON.stringify(accounts));
            }
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {
          console.warn('Failed to recover session on mount:', e);
        }
      }

      const params = new URLSearchParams(window.location.search);
      let storeId = params.get('store');
      if (!storeId && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && !parts[0].includes('catacloud')) {
          storeId = parts[0];
        }
      }

      // Check if this is an auth callback redirect (e.g. from Supabase email verification or OAuth)
      const isAuthCallback = typeof window !== 'undefined' && (
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('type=signup') ||
        window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('type=invite') ||
        window.location.hash.includes('type=magiclink') ||
        window.location.search.includes('code=')
      );

      let isAdminUser = false;
      try {
        if (user) {
          const parsed = JSON.parse(user);
          if (parsed.role === 'admin') isAdminUser = true;
        }
      } catch {}

      setMounted(true);
      if (!user) {
        setIsAuthenticated(false);
        if (storeId) {
          router.push(`/login?store=${storeId}`);
        } else {
          setIsLandingPage(true);
        }
      } else {
        setIsAuthenticated(true);
        // Load saved cart scoped to user
        let userEmail = '';
        try {
          const parsed = JSON.parse(user);
          if (parsed.email) userEmail = parsed.email.toLowerCase();
        } catch {}
        
        const cartKey = userEmail ? `bluefine_cart_${userEmail}` : 'bluefine_cart';
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch {
            // Keep empty if parse fails
          }
        }
        
        // Force redirect to dashboard if no store, if admin user, or if returning from email confirmation callback
        if (!storeId || isAdminUser || isAuthCallback) {
          router.push('/dashboard');
          return;
        } else {
          setIsLandingPage(false);
          localStorage.setItem('bluefine_current_store_id', storeId);
        }

        setCurrentStoreId(storeId);

        // Load dynamic products & config scoped to storeId
        getStoreConfig(storeId).then((cfg) => {
          setStoreConfig(cfg);
        });
        getProducts(storeId).then((p) => {
          setProducts(p);
        });
      }
    };

    setTimeout(() => {
      checkAuthAndInit();
    }, 0);
  }, [router]);

  useEffect(() => {
    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const storeId = customEvent.detail?.storeId || localStorage.getItem('bluefine_current_store_id') || 'catacloud';
      getStoreConfig(storeId).then(setStoreConfig);
      getProducts(storeId).then(setProducts);
    };

    const handleProductsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const storeId = customEvent.detail?.storeId || localStorage.getItem('bluefine_current_store_id') || 'catacloud';
      getProducts(storeId).then(setProducts);
    };

    window.addEventListener('store-config-updated', handleConfigUpdate);
    window.addEventListener('products-updated', handleProductsUpdate);

    return () => {
      window.removeEventListener('store-config-updated', handleConfigUpdate);
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  // Listen for storage changes from other tabs to sync cart in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      const user = localStorage.getItem('bluefine_user');
      if (!user) return;
      try {
        const parsed = JSON.parse(user);
        if (parsed.email) {
          const cartKey = `bluefine_cart_${parsed.email.toLowerCase()}`;
          const savedCart = localStorage.getItem(cartKey);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (JSON.stringify(parsedCart) !== JSON.stringify(cart)) {
              setCart(parsedCart);
            }
          }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [cart]);

  // Persist cart items scoped to user
  useEffect(() => {
    if (mounted && isAuthenticated) {
      const user = localStorage.getItem('bluefine_user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed.email) {
            const cartKey = `bluefine_cart_${parsed.email.toLowerCase()}`;
            localStorage.setItem(cartKey, JSON.stringify(cart));
            // Trigger storage change manually for same-tab listening (so other tabs can synchronize)
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [cart, mounted, isAuthenticated]);

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

  if (isLandingPage) {
    if (!isAuthenticated) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
    } else {
      return (
        <div className={styles.main}>
          <Navbar
            cartCount={0}
            onCartToggle={() => {}}
            onLogout={handleLogout}
            storeId="catacloud"
          />

          <main className={styles.container} style={{ paddingTop: '120px', display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center' }}>
            <section className="glassmorphism" style={{ maxWidth: '960px', width: '100%', padding: '48px', borderRadius: '24px', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-glass)' }}>
              <div className={styles.ambientGlow} style={{ opacity: 0.15, pointerEvents: 'none' }} />
              
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold', textShadow: '0 0 10px rgba(0, 242, 254, 0.3)' }}>
                  B2B Sourcing Platform
                </span>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '16px', fontFamily: 'var(--font-outfit), sans-serif', lineHeight: '1.2' }}>
                  Create Your Own Store & <span className={styles.titleHighlight}>Send Catalogues</span>
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto', lineHeight: '1.6' }}>
                  CataCloud is a next-generation custom catalog builder designed for wholesale suppliers, producers, and distributors. Tailor your storefronts, manage products, and share secure proposals directly with your clients.
                </p>
              </div>

              {/* How It Works Steps Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '48px' }}>
                
                <div className="glassmorphism" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--accent-cyan)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>1</div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>🏪 Launch Business Store</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                        Register your account and launch a custom storefront. Choose your niche (Seafood, Bakery, Clothing, Egg Farm, or general retail) with custom labels and specific units of measurement (e.g. kg, box, dozen, pcs).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glassmorphism" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--accent-cyan)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>2</div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>📦 Manage Products & PWA</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                        Add items to your catalog, manage stock levels, and set base pricing. Keep track of stock counts automatically, and check out walk-in or phone sales instantly using the built-in PWA Billing Terminal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glassmorphism" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--accent-cyan)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>3</div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>📄 Share Targeted Catalogues</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                        Create custom pricing overrides, set volume discount thresholds, and hide specific products to target individual procurement partners. Share private catalog links (e.g. <code>/?store=your-store-id</code>) with your clients.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glassmorphism" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--accent-cyan)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>4</div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>🙋 Receive Enquiries & Orders</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                        Your clients can browse your catalog, place wholesale orders, or submit custom volume sourcing requests. Receive instant logistics logs and track pending orders inside your unified Seller Dashboard.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-gold"
                  style={{ height: '52px', padding: '0 36px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  Go to Store Manager Dashboard 🚀
                </button>
              </div>
            </section>
          </main>
        </div>
      );
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="glassmorphism" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle at 50% 50%, #0c1c38 0%, #030812 100%)' }}>
        <span style={{ color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif' }}>
          Redirecting to Authorization...
        </span>
      </div>
    );
  }

  // Cart operations
  const handleAddToCart = (fish: FishItem, qty: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.fish.id === fish.id);
      if (existingIndex > -1) {
        const nextCart = [...prev];
        nextCart[existingIndex].quantity += qty;
        return nextCart;
      }
      return [...prev, { fish, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (fishId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(fishId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.fish.id === fishId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (fishId: string) => {
    setCart((prev) => prev.filter((item) => item.fish.id !== fishId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Filtering and Sorting logic
  const filteredFish = products
    .filter((fish) => {
      const matchesSearch =
        fish.name.toLowerCase().includes(search.toLowerCase()) ||
        fish.scientificName.toLowerCase().includes(search.toLowerCase()) ||
        fish.origin.toLowerCase().includes(search.toLowerCase()) ||
        fish.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = category === 'All' || fish.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerKg - b.pricePerKg;
      if (sortBy === 'price-desc') return b.pricePerKg - a.pricePerKg;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // Default featured order
    });


  const isClothing = storeConfig.storeType === 'clothing';

  return (
    <div className={styles.main} data-store-theme={storeConfig.storeType}>
      <Navbar
        cartCount={cart.length}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        onLogout={handleLogout}
        storeId={currentStoreId}
      />

      {isClothing ? (
        /* ─── CLOTHING HERO ─── */
        <section
          style={{
            position: 'relative',
            padding: '72px 40px 40px 40px',
            textAlign: 'center',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* Warm ambient glow orbs */}
          <div style={{
            position: 'absolute', top: '-180px', left: '50%', transform: 'translateX(-50%)',
            width: '700px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(212,169,106,0.12) 0%, rgba(180,120,60,0.06) 45%, transparent 70%)',
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '0', left: '8%',
            width: '260px', height: '260px',
            background: 'radial-gradient(circle, rgba(232,196,122,0.06) 0%, transparent 70%)',
            filter: 'blur(50px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '0', right: '5%',
            width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(180,100,50,0.07) 0%, transparent 70%)',
            filter: 'blur(45px)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '860px', margin: '0 auto' }}>
            {/* Editorial eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              marginBottom: '20px',
              padding: '5px 18px 5px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(212,169,106,0.25)',
              background: 'rgba(212,169,106,0.06)',
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{
                display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#d4a96a,#e8c47a)',
                boxShadow: '0 0 8px rgba(212,169,106,0.8)',
                animation: 'pulseNeon 2.5s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: '#d4a96a',
              }}>SS-25 Collection — Premium Menswear</span>
            </div>

            {/* Main heading */}
            <h1 style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '16px',
              color: '#f5f0eb',
              textTransform: 'capitalize',
              letterSpacing: '-0.5px',
            }}>
              {storeConfig.storeName}<br />
              <span style={{
                background: 'linear-gradient(120deg, #d4a96a 0%, #e8c47a 50%, #c08040 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}>Elevated Everyday Essentials</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '1rem', color: '#a09484', maxWidth: '560px',
              margin: '0 auto 24px auto', lineHeight: 1.6,
            }}>
              Thoughtfully crafted menswear — premium shirts, tailored trousers, rugged cargos &amp; cozy hoodies. Built for the modern man who demands both quality and style.
            </p>

            {/* Category pills row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '4px' }}>
              {storeConfig.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? 'All' : cat)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '999px',
                    border: `1px solid ${cat === category ? 'rgba(212,169,106,0.6)' : 'rgba(180,140,100,0.18)'}`,
                    background: cat === category ? 'rgba(212,169,106,0.14)' : 'rgba(255,255,255,0.02)',
                    color: cat === category ? '#d4a96a' : '#a09484',
                    fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >{cat}</button>
              ))}
              {category !== 'All' && (
                <button
                  onClick={() => setCategory('All')}
                  style={{
                    padding: '6px 18px', borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent', color: '#5a5048',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >✕ Clear</button>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* ─── DEFAULT HERO ─── */
        <section className={styles.hero}>
          <div className={styles.ambientGlow} />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              {storeConfig.storeType === 'seafood' ? (
                <>Oceanic Delicacies <br /><span className={styles.titleHighlight}>Sourced For Master Chefs</span></>
              ) : storeConfig.storeType === 'egg' ? (
                <>Premium Organic Eggs <br /><span className={styles.titleHighlight}>Sourced Fresh Daily</span></>
              ) : (
                <>{storeConfig.storeName} <br /><span className={styles.titleHighlight}>{storeConfig.storeTagline}</span></>
              )}
            </h1>
            <p className={styles.subtitle}>
              {storeConfig.storeType === 'seafood' ? (
                "Explore our curated selection of pristine, sashimi-grade seafood. Hand-picked from sustainable fisheries and flown direct to your kitchen."
              ) : storeConfig.storeType === 'egg' ? (
                "Explore our collection of fresh, farm-gathered organic eggs. Rich in nutrients, pasture-raised, and delivered straight to your establishment."
              ) : (
                `Explore our curated selection of high-quality products. Sourced directly from trusted providers and crafted with pride.`
              )}
            </p>
          </div>
        </section>
      )}

      <main className={styles.container}>
        {/* Filter / Search Toolbar */}
        <section className={`${styles.toolbar} glassmorphism`}>
          <div className={styles.searchSortRow}>
            <div className={styles.searchWrapper}>
              <svg
                className={styles.searchIcon}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="luxury-input"
                style={{ paddingLeft: '36px', paddingTop: '0px', paddingBottom: '0px', height: '34px', fontSize: '0.8rem' }}
                placeholder={isClothing ? `Search by style, fit, or category...` : `Search by variety, ${storeConfig.attributes.scientificNameLabel.toLowerCase()}, or origin...`}
                id="search-input-field"
              />
            </div>

            <div className={styles.sortSelector}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="luxury-input"
                style={{
                  height: '34px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  paddingLeft: '12px',
                  paddingRight: '30px',
                  fontSize: '0.8rem',
                  appearance: 'none',
                  cursor: 'pointer',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
                id="sort-select-dropdown"
              >
                <option value="featured">{isClothing ? 'Featured Picks' : 'Featured Sourcing'}</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '180px' }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="luxury-input"
                  style={{
                    height: '34px',
                    padding: '0 30px 0 12px',
                    fontSize: '0.8rem',
                    appearance: 'none',
                    cursor: 'pointer',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    outline: 'none'
                  }}
                  id="category-select-dropdown"
                >
                  <option value="All">All Categories</option>
                  {storeConfig.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className={styles.resultsCount} id="search-results-count">
              Showing {filteredFish.length} of {products.length} {isClothing ? 'pieces' : 'varieties'}
            </div>
          </div>
        </section>

        {/* Catalogue Grid */}
        <section className={styles.grid} id="fish-cards-grid">
          {filteredFish.length === 0 ? (
            <div className={styles.noResults} id="no-search-results">
              <svg className={styles.noResultsIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3 className={styles.noResultsTitle}>No Products Found</h3>
              <p>Try refining your search terms or clearing the category filters.</p>
            </div>
          ) : (
            filteredFish.map((fish) => (
              <FishCard
                key={fish.id}
                fish={fish}
                onClick={() => setSelectedFish(fish)}
                unit={storeConfig.unit}
                storeType={storeConfig.storeType}
              />
            ))
          )}
        </section>
      </main>

      {/* Dynamic Detail Modal */}
      <FishModal
        key={selectedFish?.id || 'empty'}
        fish={selectedFish}
        onClose={() => setSelectedFish(null)}
        onAddToCart={handleAddToCart}
        storeConfig={storeConfig}
      />

      {/* Dynamic Sliding Shopping Cart */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        unit={storeConfig.unit}
      />

      {/* Multi-step Checkout Reservation Wizard */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onClearCart={handleClearCart}
        unit={storeConfig.unit}
        storeId={currentStoreId}
      />
    </div>
  );
}
