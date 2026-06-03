'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FishItem } from '@/data/fishData';
import { getProducts } from '@/utils/store';
import Navbar from '@/components/Navbar';
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

  // Cart & UI states
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Filters & Sorting states
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

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
        // Load saved cart
        const savedCart = localStorage.getItem('bluefine_cart');
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch {
            // Keep empty if parse fails
          }
        }
        // Load dynamic products
        getProducts().then((p) => {
          setProducts(p);
        });
      }
    }, 0);
  }, [router]);

  // Persist cart items
  useEffect(() => {
    if (mounted && isAuthenticated) {
      localStorage.setItem('bluefine_cart', JSON.stringify(cart));
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

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('bluefine_user');
    localStorage.removeItem('bluefine_cart');
    router.push('/login');
  };

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
        fish.origin.toLowerCase().includes(search.toLowerCase());
      
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
      />

      <section className={styles.hero}>
        <div className={styles.ambientGlow} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Oceanic Delicacies <br />
            <span className={styles.titleHighlight}>Sourced For Master Chefs</span>
          </h1>
          <p className={styles.subtitle}>
            Explore our curated selection of pristine, sashimi-grade seafood. Hand-picked from sustainable fisheries and flown direct to your kitchen.
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
                width="18"
                height="18"
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
                className="luxury-input styles.searchInput"
                style={{ paddingLeft: '48px' }}
                placeholder="Search by variety, scientific name, or origin..."
                id="search-input-field"
              />
            </div>

            <div className={styles.sortSelector}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="luxury-input"
                style={{ appearance: 'none', cursor: 'pointer' }}
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
            <div className={styles.categories}>
              {['All', 'Saltwater', 'Shellfish', 'Premium Import'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`${styles.categoryBtn} ${
                    category === cat ? styles.categoryBtnActive : ''
                  }`}
                  id={`category-btn-${cat.toLowerCase().replace(' ', '-')}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.resultsCount} id="search-results-count">
              Showing {filteredFish.length} of {products.length} varieties
            </div>
          </div>
        </section>

        {/* Catalogue Grid */}
        <section className={styles.grid} id="fish-cards-grid">
          {filteredFish.length === 0 ? (
            <div className={styles.noResults} id="no-results-view">
              <svg
                className={styles.noResultsIcon}
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <h3 className={styles.noResultsTitle}>No Marine Varieties Found</h3>
              <p>Try refining your search terms or clearing the category filters.</p>
            </div>
          ) : (
            filteredFish.map((fish) => (
              <FishCard
                key={fish.id}
                fish={fish}
                onClick={() => setSelectedFish(fish)}
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
      />

      {/* Multi-step Checkout Reservation Wizard */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
