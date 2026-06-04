'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  getCustomCatalogById, 
  getProducts, 
  CustomCatalog,
  calculateSourcingETA,
  ETAPrediction,
  addOrder,
  Order,
  getStoreConfig
} from '@/utils/store';
import { FishItem } from '@/data/fishData';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';
import styles from './catalogue.module.css';
import { toast } from 'sonner';

export default function CatalogueDetailPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState<boolean>(false);
  const [catalog, setCatalog] = useState<CustomCatalog | null>(null);
  const [products, setProducts] = useState<FishItem[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  const [storeId, setStoreId] = useState<string>('bluefine');

  // Client checkout states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Search & Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Reset checkout states when the selected variety changes
  useEffect(() => {
    setSuccessOrder(null);
    setClientName('');
    setClientEmail('');
  }, [selectedFish]);

  // Load custom catalog overrides, products, and store config
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const resolvedStoreId = params.get('store') || 'bluefine';
    setStoreId(resolvedStoreId);

    getStoreConfig(resolvedStoreId).then(setStoreConfig);

    const proposalId = pathname ? pathname.split('/').pop() || '' : '';
    if (proposalId) {
      getCustomCatalogById(proposalId, resolvedStoreId).then((catData) => {
        if (catData) {
          setCatalog(catData);
          getProducts(resolvedStoreId).then((prods) => {
            setProducts(prods);
          });
        }
      });
    }
  }, [pathname]);

  if (!mounted) {
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
            fill="url(#catalogue-loading-logo)"
          />
          <defs>
            <linearGradient id="catalogue-loading-logo" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="1.5" style={{ marginBottom: '20px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1 className={styles.errorTitle}>Catalogue Link Expired</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This custom catalogue proposal is either invalid or has been retracted by the administrator.
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary">
            Go to Portal Login
          </button>
        </div>
      </div>
    );
  }

  // Filter items based on proposal settings, category selection, and search query
  const proposalItems = products.filter((p) => {
    const override = catalog.overrides[p.id];
    const isIncluded = override && override.included;
    if (!isIncluded) return false;

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Calculate pricing for the selected specimen modal details
  const selectedOverride = selectedFish ? catalog.overrides[selectedFish.id] : null;
  const selectedCustomPrice = selectedFish
    ? (selectedOverride ? selectedOverride.customPrice : selectedFish.pricePerKg)
    : 0;
  const selectedItemDiscount = selectedFish
    ? ((selectedOverride && selectedOverride.customDiscount !== undefined && selectedOverride.customDiscount > 0)
      ? selectedOverride.customDiscount
      : (catalog.globalDiscount || 0))
    : 0;
  const selectedDisplayPrice = selectedCustomPrice * (1 - selectedItemDiscount / 100);
  const allocatedStock = selectedOverride ? selectedOverride.customStock : 0;
  const inventoryStock = selectedFish ? selectedFish.stock : 0;
  
  const unit = selectedFish?.unit || 'kg';
  
  // Calculate dynamic volume discount based on client general rules:
  // 10-100 kg: 10% discount
  // 100-200 kg: 20% discount
  // > 200 kg: 25% discount
  let selectedVolumeDiscountPercent = 0;
  if (allocatedStock >= 10 && allocatedStock <= 100) {
    selectedVolumeDiscountPercent = 10;
  } else if (allocatedStock > 100 && allocatedStock <= 200) {
    selectedVolumeDiscountPercent = 20;
  } else if (allocatedStock > 200) {
    selectedVolumeDiscountPercent = 25;
  }

  const activeDiscount = selectedItemDiscount + selectedVolumeDiscountPercent;
  const finalUnitPrice = selectedCustomPrice * (1 - activeDiscount / 100);
  const sourcingSubtotal = finalUnitPrice * allocatedStock;
  const sourcingTotal = sourcingSubtotal + (catalog.globalDelivery || 0);

  const simulatedETA = (selectedFish && catalog)
    ? calculateSourcingETA(selectedFish.origin || '', catalog.marketName || '', allocatedStock, inventoryStock)
    : null;

  const handleSourcingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFish || !catalog || !simulatedETA) return;
    setLoading(true);

    const orderRef = `BF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderRef,
      userEmail: clientEmail.toLowerCase(),
      userName: clientName,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      deliveryDate: simulatedETA.targetDateString,
      address: catalog.marketName,
      items: [
        {
          fishId: selectedFish.id,
          name: `${selectedFish.name} (Custom Catalogue Proposal)`,
          quantity: allocatedStock,
          price: finalUnitPrice,
          image: selectedFish.image
        }
      ],
      totalPrice: sourcingTotal,
      status: 'Pending'
    };

    try {
      await addOrder(newOrder, storeId);
      setSuccessOrder(newOrder);
    } catch (err) {
      console.error('Failed to log customized catalog sourcing order:', err);
      toast.error('Reservation Failed', {
        description: `Sourcing order reservation failed at ${new Date().toLocaleString()}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.brandHeader}>
        {storeConfig.storeType === 'seafood' ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.4))' }}
          >
            <path
              d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
              fill="url(#logo-grad)"
            />
            <path
              d="M4 16C4 9.37258 9.37258 4 16 4C19 4 21.5 5 22.5 6.5C19 7 16 9 14.5 11C13 13 12 15 10 16.5C8 18 6 18.5 4.5 18C4 17.5 4 17 4 16Z"
              fill="url(#logo-grad-accent)"
              opacity="0.7"
            />
            <defs>
              <linearGradient id="logo-grad" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
              <linearGradient id="logo-grad-accent" x1="4" y1="4" x2="22.5" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e2b744" />
                <stop offset="1" stopColor="#b88e1a" />
              </linearGradient>
            </defs>
          </svg>
        ) : storeConfig.storeType === 'egg' ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.4))' }}
          >
            <path d="M12 2C7.5 2 4 7 4 12c0 4.5 3.5 10 8 10s8-5.5 8-10c0-5-3.5-10-8-10z" fill="url(#logo-grad)" opacity="0.15" />
            <path d="M12 2C7.5 2 4 7 4 12c0 4.5 3.5 10 8 10s8-5.5 8-10c0-5-3.5-10-8-10z" />
            <defs>
              <linearGradient id="logo-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.4))' }}
          >
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" fill="url(#logo-grad)" opacity="0.1" />
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        )}
        <span className={styles.logoText}>{storeConfig.storeName}</span>
      </header>

      <section className={styles.catalogueHeader}>
        <span className={styles.marketBadge}>{catalog.marketName}</span>
        <h1 className={styles.title}>{storeConfig.attributes.specimenLabel} Catalogue</h1>
        <div className={styles.dateInfo}>
          Issued &bull; <strong style={{ color: 'var(--text-primary)' }}>{catalog.createdDate}</strong>
        </div>
      </section>

      {catalog.notes && (
        <section className={styles.notesBanner}>
          <div className={styles.notesTitle}>Proposal Terms & Notes</div>
          <p className={styles.notesText}>{catalog.notes}</p>
        </section>
      )}

      {/* Global Sourcing Terms Banner */}
      <section className={styles.notesBanner} style={{ borderColor: 'var(--accent-gold)', background: 'rgba(226, 183, 68, 0.02)', marginTop: catalog.notes ? '-6px' : '0px' }}>
        <div className={styles.notesTitle} style={{ color: 'var(--accent-gold)' }}>Sourcing Offer Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '600px', margin: '0 auto', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Global Sourcing Discount:</span>{' '}
            <strong style={{ color: 'var(--accent-cyan)' }}>{catalog.globalDiscount > 0 ? `${catalog.globalDiscount}% Off Catalog` : 'Standard Rates'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Logistics & Delivery Fee:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{catalog.globalDelivery > 0 ? `$${catalog.globalDelivery.toFixed(2)}` : 'Free Logistics'}</strong>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(226, 183, 68, 0.15)', marginTop: '8px', paddingTop: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 600 }}>Bulk Volume Sourcing Discounts</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>10-100 kg:</span> <strong style={{ color: 'var(--accent-cyan)' }}>10% discount</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>100-200 kg:</span> <strong style={{ color: 'var(--accent-cyan)' }}>20% discount</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>&gt; 200 kg:</span> <strong style={{ color: 'var(--accent-cyan)' }}>25% discount</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Toolbar */}
      <section className="glassmorphism" style={{ width: '100%', maxWidth: '1200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', animation: 'slideUp 0.8s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Text Search Input */}
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="luxury-input"
              style={{ paddingLeft: '36px', paddingTop: '0px', paddingBottom: '0px', height: '34px', fontSize: '0.8rem' }}
              placeholder="Search by variety name, scientific name, or origin port..."
              id="client-catalogue-search-input"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              id="client-catalogue-category-select"
            >
              <option value="All" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>All Categories</option>
              {storeConfig.categories.map((cat) => (
                <option key={cat} value={cat} style={{ background: '#050c1a', color: 'var(--text-primary)' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Products Grid */}
      <section className={styles.grid} id="custom-catalogue-grid">
        {proposalItems.length === 0 ? (
          <div className={styles.errorContainer} style={{ gridColumn: '1 / -1', minHeight: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No Products Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {searchQuery || selectedCategory !== 'All' 
                ? 'Try modifying your filters or search text.' 
                : 'No products are included in this customized catalogue proposal.'}
            </p>
          </div>
        ) : (
          proposalItems.map((fishItem) => {
            const override = catalog.overrides[fishItem.id];
            const customPrice = override ? override.customPrice : fishItem.pricePerKg;
            const itemDiscount = (override && override.customDiscount !== undefined && override.customDiscount > 0)
              ? override.customDiscount
              : (catalog.globalDiscount || 0);
            const displayStock = override ? override.customStock : fishItem.stock;

            let cardVolumeDiscountPercent = 0;
            if (displayStock >= 10 && displayStock <= 100) {
              cardVolumeDiscountPercent = 10;
            } else if (displayStock > 100 && displayStock <= 200) {
              cardVolumeDiscountPercent = 20;
            } else if (displayStock > 200) {
              cardVolumeDiscountPercent = 25;
            }
            const totalCardDiscount = itemDiscount + cardVolumeDiscountPercent;
            const cardDisplayPrice = customPrice * (1 - totalCardDiscount / 100);

            return (
              <div 
                key={fishItem.id} 
                className={`${styles.card} glassmorphism glow-hover-cyan`}
                onClick={() => setSelectedFish(fishItem)}
              >
                <div className={styles.imageWrapper}>
                  <img src={fishItem.image} alt={fishItem.name} className={styles.cardImage} />
                  {itemDiscount > 0 && (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'var(--accent-gold)', 
                        color: '#030812', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        boxShadow: '0 2px 10px rgba(226, 183, 68, 0.4)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {itemDiscount}% Off
                    </span>
                  )}
                  {cardVolumeDiscountPercent > 0 && (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '12px', 
                        background: 'var(--accent-cyan)', 
                        color: '#030812', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        boxShadow: '0 2px 10px rgba(0, 242, 254, 0.4)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      +{cardVolumeDiscountPercent}% Vol
                    </span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <h3 className={styles.cardName}>{fishItem.name}</h3>
                    <span className={styles.cardSciName}>{fishItem.scientificName}</span>
                  </div>
                  
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardPrice}>
                      ${cardDisplayPrice.toFixed(2)}/{fishItem.unit || 'kg'}
                      {totalCardDiscount > 0 && (
                        <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ${customPrice.toFixed(2)}
                        </span>
                      )}
                    </span>
                    <span className={styles.cardStock}>Stock: {displayStock} {fishItem.unit || 'kg'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Unified Procurement Details & Checkout Modal */}
      {selectedFish && (
        <div 
          className="modalBackdrop" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(3, 8, 18, 0.85)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflowY: 'auto' }}
          onClick={() => setSelectedFish(null)}
        >
          <div 
            className="glassmorphism" 
            style={{ width: '100%', maxWidth: '1000px', borderRadius: '20px', padding: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)', position: 'relative', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Icon */}
            <button 
              onClick={() => setSelectedFish(null)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Split Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              
              {/* Left Column: Product Showcase & Specifications */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img 
                  src={selectedFish.image} 
                  alt={selectedFish.name} 
                  style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} 
                />

                <h2 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  {selectedFish.name}
                </h2>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px', display: 'block' }}>
                  {selectedFish.scientificName}
                </span>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <span className={styles.cardCategory} style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    {selectedFish.category}
                  </span>
                  <span className={styles.cardCategory} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {selectedFish.sustainability}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  {selectedFish.description}
                </p>

                {/* Sourcing Specifications Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                  
                  {/* Origin */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.85rem' }}>📍</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Origin</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.origin}</span>
                    </div>
                  </div>

                  {/* Texture */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.85rem' }}>✨</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{storeConfig.attributes.textureLabel}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.texture}</span>
                    </div>
                  </div>

                  {/* Prep Skill */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(226, 183, 68, 0.04)', border: '1px solid rgba(226, 183, 68, 0.1)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.85rem' }}>🍳</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{storeConfig.attributes.difficultyLabel}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.difficulty}</span>
                    </div>
                  </div>

                  {/* Sustainable status */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.85rem' }}>🌱</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{storeConfig.attributes.sustainabilityLabel}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.sustainability}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Pricing details, Locked Logistics parameters & Checkout Form */}
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                
                {!successOrder ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-playfair), serif' }}>
                      Sourcing Proposal Quote
                    </h3>

                    {/* Cost Breakdown */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Custom Base Price:</span>
                        <span>${selectedCustomPrice.toFixed(2)} / {unit}</span>
                      </div>
                      {selectedItemDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
                          <span>Market Discount:</span>
                          <span>-{selectedItemDiscount}% (-${(selectedCustomPrice * (selectedItemDiscount / 100)).toFixed(2)} / {unit})</span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                        <span>Bulk Discount Applied:</span>
                        <span>
                          {selectedVolumeDiscountPercent > 0 
                            ? `Level: ${selectedVolumeDiscountPercent}% off (${allocatedStock} ${unit} ordered)` 
                            : `None (< 10 ${unit} ordered)`}
                        </span>
                      </div>

                      {selectedVolumeDiscountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                          <span>Volume Discount ({selectedVolumeDiscountPercent}%):</span>
                          <span>-${(selectedCustomPrice * (selectedVolumeDiscountPercent / 100)).toFixed(2)} / {unit}</span>
                        </div>
                      )}

                      {catalog.globalDelivery > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span>Logistics/Delivery Fee:</span>
                          <span>${catalog.globalDelivery.toFixed(2)}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', marginTop: '10px', fontSize: '1rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-primary)' }}>Unit Net Price:</span>
                        <span style={{ color: 'var(--accent-cyan)' }}>${finalUnitPrice.toFixed(2)} / {unit}</span>
                      </div>
                    </div>

                    {/* ETA Alert Box */}
                    {simulatedETA && (
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.01)', 
                        border: `1px solid ${simulatedETA.stockDelayDays > 0 ? 'rgba(226, 183, 68, 0.3)' : 'rgba(0, 242, 254, 0.2)'}`, 
                        borderRadius: '8px', 
                        padding: '12px', 
                        marginBottom: '20px',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: simulatedETA.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}>
                          <span>🚚</span>
                          <span>Estimated Sourcing ETA: {new Date(simulatedETA.targetDateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({simulatedETA.totalDays} Days)</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                          {simulatedETA.explanation}
                        </div>
                      </div>
                    )}

                    {/* Sourcing Reservation Form */}
                    <form onSubmit={handleSourcingRequest}>
                      
                      {/* Chef/Name Sourcing Inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }} htmlFor="cat-client-name">Chef Name</label>
                          <input
                            type="text"
                            id="cat-client-name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="luxury-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            placeholder="e.g. Chef Mitsu"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }} htmlFor="cat-client-email">Sourcing Email</label>
                          <input
                            type="email"
                            id="cat-client-email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="luxury-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            placeholder="chef@kitchen.com"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Read-Only Locked Parameters set by Admin */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>🔒 Port of Delivery</span>
                          </label>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={catalog.marketName}>
                            {catalog.marketName}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>🔒 Reserved Quantity</span>
                          </label>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {allocatedStock} {unit}
                          </div>
                        </div>
                      </div>

                      {/* Pricing totals footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimated Total Sourcing Cost:</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>${sourcingTotal.toFixed(2)}</span>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                        disabled={loading}
                      >
                        {loading ? 'Logging Procurement...' : 'Reserve Sourcing Catch'}
                      </button>
                    </form>
                  </div>
                ) : (
                  
                  /* Sourcing Order Success Receipt */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--accent-success)', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-playfair), serif', color: 'var(--text-primary)' }}>
                      Sourcing Request Logged!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                      Your custom procurement reservation has been logged into the vessel cargo database. Our logistics manager has been notified.
                    </p>

                    {/* Receipt Card */}
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Reference ID:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{successOrder.id}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vessel Cargo:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{selectedFish.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sourced Weight:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{allocatedStock} {unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Arrival ETA:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(successOrder.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Destination Port:</span>
                        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={successOrder.address}>
                          {successOrder.address}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-primary)' }}>Total Sourced Bill:</span>
                        <span style={{ color: 'var(--accent-cyan)' }}>${successOrder.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedFish(null)}
                      className="btn-gold"
                      style={{ width: '100%', height: '40px', fontSize: '0.9rem' }}
                    >
                      Done & Close
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
