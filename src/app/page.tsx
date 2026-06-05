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
  const [currentStoreId, setCurrentStoreId] = useState<string>('bluefine');


  // Cart & UI states
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Filters & Sorting states
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Logout handler
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
    router.push('/login');
  };

  // Guard route & Hydration safety
  useEffect(() => {
    const user = localStorage.getItem('bluefine_user');
    
    // Defer state updates to avoid synchronous setState inside render effect
    setTimeout(() => {
      setMounted(true);
      if (!user) {
        router.push('/login');
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
        
        // Resolve store context from URL parameter or localStorage fallback
        const params = new URLSearchParams(window.location.search);
        let storeId = params.get('store');
        
        if (!storeId) {
          let userActiveStore = '';
          try {
            const parsedUser = JSON.parse(user);
            userActiveStore = localStorage.getItem(`bluefine_active_store_id_${parsedUser.email}`) || '';
          } catch (e) {
            // ignore
          }
          storeId = userActiveStore || localStorage.getItem('bluefine_current_store_id') || 'bluefine';
        } else {
          localStorage.setItem('bluefine_current_store_id', storeId);
        }

        setCurrentStoreId(storeId);

        // Load dynamic products & config scoped to storeId
        getStoreConfig(storeId).then((cfg) => {
          let loggedInEmail = '';
          let loggedInRole = '';
          try {
            const parsed = JSON.parse(user || '{}');
            loggedInEmail = parsed.email?.toLowerCase() || '';
            loggedInRole = parsed.role || '';
          } catch {}

          if (
            loggedInEmail && 
            cfg.ownerEmail && 
            cfg.ownerEmail.toLowerCase() !== loggedInEmail && 
            loggedInRole !== 'admin'
          ) {
            router.push('/dashboard');
          } else {
            setStoreConfig(cfg);
          }
        });
        getProducts(storeId).then((p) => {
          setProducts(p);
        });
      }
    }, 0);
  }, [router]);

  useEffect(() => {
    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const storeId = customEvent.detail?.storeId || localStorage.getItem('bluefine_current_store_id') || 'bluefine';
      getStoreConfig(storeId).then(setStoreConfig);
      getProducts(storeId).then(setProducts);
    };

    const handleProductsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const storeId = customEvent.detail?.storeId || localStorage.getItem('bluefine_current_store_id') || 'bluefine';
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

  if (!mounted || !isAuthenticated) {
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
          Verifying Sourcing Authorization...
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


  return (
    <div className={styles.main}>
      <Navbar
        cartCount={cart.length}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        onLogout={handleLogout}
        storeId={currentStoreId}
      />

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
                placeholder={`Search by variety, ${storeConfig.attributes.scientificNameLabel.toLowerCase()}, or origin...`}
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
                <option value="featured">Featured Sourcing</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
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
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  background: 'rgba(5, 12, 26, 0.6)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                id="category-select-dropdown"
              >
                <option value="All" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>All Categories</option>
                {storeConfig.categories.map((cat) => (
                  <option key={cat} value={cat} style={{ background: '#050c1a', color: 'var(--text-primary)' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.resultsCount} id="search-results-count">
              Showing {filteredFish.length} of {products.length} varieties
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
