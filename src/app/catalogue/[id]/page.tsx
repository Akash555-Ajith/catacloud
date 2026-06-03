'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  getCustomCatalogById, 
  getProducts, 
  CustomCatalog,
  calculateSourcingETA,
  ETAPrediction
} from '@/utils/store';
import { FishItem } from '@/data/fishData';
import styles from './catalogue.module.css';

export default function CatalogueDetailPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState<boolean>(false);
  const [catalog, setCatalog] = useState<CustomCatalog | null>(null);
  const [products, setProducts] = useState<FishItem[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);

  // Load custom catalog overrides and products
  useEffect(() => {
    setMounted(true);

    const proposalId = pathname ? pathname.split('/').pop() || '' : '';
    if (proposalId) {
      getCustomCatalogById(proposalId).then((catData) => {
        if (catData) {
          setCatalog(catData);
          getProducts().then((prods) => {
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

  // Filter items based on proposal settings
  const proposalItems = products.filter((p) => {
    const override = catalog.overrides[p.id];
    return override && override.included;
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
  const selectedCustomVolumeThreshold = (selectedFish && selectedOverride)
    ? (selectedOverride.customVolumeThreshold || 0)
    : 0;
  const selectedCustomVolumeDiscount = (selectedFish && selectedOverride)
    ? (selectedOverride.customVolumeDiscount || 0)
    : 0;
  const allocatedStock = selectedOverride ? selectedOverride.customStock : 0;
  const inventoryStock = selectedFish ? selectedFish.stock : 0;
  const simulatedETA = (selectedFish && catalog)
    ? calculateSourcingETA(selectedFish.origin || '', catalog.marketName || '', allocatedStock, inventoryStock)
    : null;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.brandHeader}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }}
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
        <span className={styles.logoText}>Bluefine</span>
      </header>

      <section className={styles.catalogueHeader}>
        <span className={styles.marketBadge}>{catalog.marketName}</span>
        <h1 className={styles.title}>Oceanic Specimen Catalogue</h1>
        <div className={styles.dateInfo}>
          Proposal Sourcing Issued &bull; <strong style={{ color: 'var(--text-primary)' }}>{catalog.createdDate}</strong>
        </div>
      </section>

      {catalog.notes && (
        <section className={styles.notesBanner}>
          <div className={styles.notesTitle}>Proposal Terms & Notes</div>
          <p className={styles.notesText}>{catalog.notes}</p>
        </section>
      )}

      {/* Global Sourcing Terms Banner */}
      <section className={styles.notesBanner} style={{ borderColor: 'var(--accent-gold)', background: 'rgba(226, 183, 68, 0.02)', marginTop: catalog.notes ? '-20px' : '0px' }}>
        <div className={styles.notesTitle} style={{ color: 'var(--accent-gold)' }}>Sourcing Offer Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Global Sourcing Discount:</span>{' '}
            <strong style={{ color: 'var(--accent-cyan)' }}>{catalog.globalDiscount > 0 ? `${catalog.globalDiscount}% Off Catalog` : 'Standard Rates'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Logistics & Delivery Fee:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{catalog.globalDelivery > 0 ? `$${catalog.globalDelivery.toFixed(2)}` : 'Free Logistics'}</strong>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className={styles.grid} id="custom-catalogue-grid">
        {proposalItems.length === 0 ? (
          <div className={styles.errorContainer} style={{ gridColumn: '1 / -1', minHeight: '30vh' }}>
            <p>No products included in this customized catalogue proposal.</p>
          </div>
        ) : (
          proposalItems.map((fishItem) => {
            const override = catalog.overrides[fishItem.id];
            const customPrice = override ? override.customPrice : fishItem.pricePerKg;
            const itemDiscount = (override && override.customDiscount !== undefined && override.customDiscount > 0)
              ? override.customDiscount
              : (catalog.globalDiscount || 0);
            const displayPrice = customPrice * (1 - itemDiscount / 100);
            const displayStock = override ? override.customStock : fishItem.stock;

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
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <h3 className={styles.cardName}>{fishItem.name}</h3>
                    <span className={styles.cardSciName}>{fishItem.scientificName}</span>
                  </div>
                  
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardPrice}>
                      ${displayPrice.toFixed(2)}/{fishItem.unit || 'kg'}
                      {itemDiscount > 0 && (
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

      {/* View-Only Details Modal */}
      {selectedFish && (
        <div 
          className="modalBackdrop" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(3, 8, 18, 0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          onClick={() => setSelectedFish(null)}
        >
          <div 
            className="glassmorphism" 
            style={{ width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedFish(null)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <img 
              src={selectedFish.image} 
              alt={selectedFish.name} 
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px' }} 
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

            {selectedCustomVolumeThreshold > 0 && selectedCustomVolumeDiscount > 0 && (
              <div style={{ 
                background: 'rgba(0, 242, 254, 0.03)', 
                border: '1px solid rgba(0, 242, 254, 0.15)', 
                borderRadius: '8px', 
                padding: '12px 16px', 
                marginBottom: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Bulk Sourcing Offer:</span>{' '}
                  Procure <strong style={{ color: 'var(--accent-cyan)' }}>{selectedCustomVolumeThreshold} {selectedFish.unit || 'kg'}</strong> or more to unlock an additional <strong style={{ color: 'var(--accent-success)' }}>{selectedCustomVolumeDiscount}% volume discount</strong> on this product!
                </div>
              </div>
            )}

            {/* Sourcing Logistics & Delivery ETA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
              
              {/* Sourcing Price */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  background: 'rgba(0, 242, 254, 0.04)',
                  border: '1px solid rgba(0, 242, 254, 0.1)',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  flexShrink: 0
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Sourcing Price</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    ${selectedDisplayPrice.toFixed(2)}/{selectedFish.unit || 'kg'}
                    {selectedItemDiscount > 0 && (
                      <span style={{ textDecoration: 'line-through', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 'normal' }}>
                        ${selectedCustomPrice.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Origin Sourced */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.1)',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Origin Sourced</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.origin}</span>
                </div>
              </div>

              {/* Estimated Delivery */}
              {simulatedETA && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{
                    background: simulatedETA.stockDelayDays > 0 ? 'rgba(226, 183, 68, 0.04)' : 'rgba(0, 242, 254, 0.04)',
                    border: simulatedETA.stockDelayDays > 0 ? '1px solid rgba(226, 183, 68, 0.1)' : '1px solid rgba(0, 242, 254, 0.1)',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: simulatedETA.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Estimated Delivery</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: simulatedETA.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}>
                      {new Date(simulatedETA.targetDateString + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} ({simulatedETA.totalDays} Days)
                    </span>
                  </div>
                </div>
              )}

              {/* Sourcing Status */}
              {simulatedETA && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{
                    background: simulatedETA.stockDelayDays > 0 ? 'rgba(226, 183, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                    border: simulatedETA.stockDelayDays > 0 ? '1px solid rgba(226, 183, 68, 0.1)' : '1px solid rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: simulatedETA.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-success)',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Sourcing Status</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: simulatedETA.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-success)' }}>
                      {simulatedETA.stockDelayDays > 0 ? 'Backorder Catch Delay' : 'In Stock (Direct)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Texture */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.1)',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 12h20M2 6h20M2 18h20" />
                  </svg>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Texture</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.texture}</span>
                </div>
              </div>

              {/* Preparation Skill */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  background: 'rgba(226, 183, 68, 0.04)',
                  border: '1px solid rgba(226, 183, 68, 0.1)',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold)',
                  flexShrink: 0
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Preparation Skill</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFish.prepTime} ({selectedFish.difficulty})</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
