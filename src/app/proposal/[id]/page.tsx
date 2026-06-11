'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  getProposalById, 
  getProducts, 
  addOrder, 
  Order, 
  Proposal,
  calculateSourcingETA,
  ETAPrediction,
  getStoreConfig
} from '@/utils/store';
import { FishItem } from '@/data/fishData';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';
import styles from './proposal.module.css';
import { toast } from 'sonner';

export default function ProposalDetailPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState<boolean>(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [fish, setFish] = useState<FishItem | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  const [storeId, setStoreId] = useState<string>('catacloud');

  // Client checkout states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Computed total fields
  const [basePrice, setBasePrice] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [etaResult, setEtaResult] = useState<ETAPrediction | null>(null);

  // Recalculate ETA automatically when quantity, address, or product changes
  useEffect(() => {
    if (fish) {
      const prediction = calculateSourcingETA(
        fish.origin || '',
        address,
        quantity,
        fish.stock || 0
      );
      setEtaResult(prediction);
      
      // Auto-populate the delivery arrival date input with the target calculated date
      if (prediction.targetDateString) {
        setDeliveryDate((prev) => {
          if (!prev || prev < prediction.targetDateString) {
            return prediction.targetDateString;
          }
          return prev;
        });
      }
    }
  }, [quantity, address, fish]);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    let resolvedStoreId = params.get('store') || '';
    if (!resolvedStoreId && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'catacloud' && !parts[0].includes('catacloud')) {
        resolvedStoreId = parts[0];
      }
    }
    if (!resolvedStoreId) {
      resolvedStoreId = 'catacloud';
    }
    setStoreId(resolvedStoreId);

    getStoreConfig(resolvedStoreId).then(setStoreConfig);

    const proposalId = pathname ? pathname.split('/').pop() || '' : '';
    if (proposalId) {
      getProposalById(proposalId, resolvedStoreId).then((propData) => {
        if (propData) {
          setProposal(propData);
          setAddress(propData.marketName || '');
          setQuantity(propData.volumeThreshold && propData.volumeThreshold > 0 ? propData.volumeThreshold : 10);
          getProducts(resolvedStoreId).then((products) => {
            const fishData = products.find((p) => p.id === propData.fishId);
            if (fishData) {
              setFish(fishData);
            }
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
            fill="url(#proposal-loading-logo)"
          />
          <defs>
            <linearGradient id="proposal-loading-logo" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (!proposal || !fish) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="1.5" style={{ marginBottom: '20px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1 className={styles.errorTitle}>Proposal Link Expired</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This custom sourcing proposal is either invalid or has been retracted by the administrator.
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary">
            Go to Portal Login
          </button>
        </div>
      </div>
    );
  }

  // Cost calculations
  const unit = fish?.unit || 'kg';
  // Calculate dynamic volume discount based on client general rules:
  // 10-100 kg: 10% discount
  // 100-200 kg: 20% discount
  // > 200 kg: 25% discount
  let selectedVolumeDiscountPercent = 0;
  if (quantity >= 10 && quantity <= 100) {
    selectedVolumeDiscountPercent = 10;
  } else if (quantity > 100 && quantity <= 200) {
    selectedVolumeDiscountPercent = 20;
  } else if (quantity > 200) {
    selectedVolumeDiscountPercent = 25;
  }

  const activeDiscount = proposal.discount + selectedVolumeDiscountPercent;
  const finalUnitPrice = proposal.customPrice * (1 - activeDiscount / 100);
  
  const sourcingSubtotal = finalUnitPrice * quantity;
  const sourcingTotal = sourcingSubtotal + proposal.shippingCharge;

  const handleSourcingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
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
      deliveryDate,
      address,
      items: [
        {
          fishId: fish.id,
          name: `${fish.name} (Custom Proposal)`,
          quantity,
          price: finalUnitPrice,
          image: fish.image
        }
      ],
      totalPrice: sourcingTotal,
      status: 'Pending'
    };

    try {
      await addOrder(newOrder, storeId);
      setSuccessOrder(newOrder);
    } catch (err) {
      console.error('Failed to submit order to database:', err);
      toast.error('Reservation Failed', {
        description: `Logistics reservation failed at ${new Date().toLocaleString()}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.brandHeader} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/logo-icon.svg" 
          alt="CataCloud Brand Logo" 
          style={{ height: '32px', width: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.45))' }}
        />
        <span className={styles.logoText}>{storeConfig.storeName}</span>
      </header>

      <div className={styles.contentWrapper}>
        {/* Left Column: Product Showcase */}
        <section className={`${styles.showcaseCard} glassmorphism`}>
          <span className={styles.marketBadge}>{proposal.marketName}</span>
          <img src={fish.image} alt={fish.name} className={styles.fishImage} />
          
          <h1 className={styles.fishName}>{fish.name}</h1>
          <span className={styles.scientificName}>{fish.scientificName}</span>
          
          <div className={styles.badgeRow}>
            <span className={styles.badge} style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
              {fish.category}
            </span>
            <span className={styles.badge} style={{ borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}>
              {fish.sustainability}
            </span>
          </div>

          <p className={styles.description}>{fish.description}</p>

          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Origin Sourced</span>
              <span className={styles.profileValue}>{fish.origin}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>{storeConfig.attributes.textureLabel}</span>
              <span className={styles.profileValue}>{fish.texture}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>
                {storeConfig.storeType === 'seafood' ? 'Prep Guide' : 'Handling / Storage'}
              </span>
              <span className={styles.profileValue}>{fish.prepTime} ({fish.difficulty})</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>{storeConfig.attributes.tasteProfileLabel}</span>
              <div className={styles.tagContainer}>
                {fish.tasteProfile.map((tag, i) => (
                  <span key={i} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Pricing & Simplified Reservation */}
        <section className={`${styles.sourcingCard} glassmorphism`}>
          {!successOrder ? (
            <div>
              <h2 className={styles.sectionTitle}>Sourcing Proposal Quote</h2>
              
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Custom Proposal Price:</span>
                  <span className={styles.priceHighlight}>${proposal.customPrice.toFixed(2)} / {unit}</span>
                </div>
                {proposal.discount > 0 && (
                  <div className={`${styles.priceRow} styles.discountRow`} style={{ color: 'var(--accent-gold)' }}>
                    <span>Special Market Discount:</span>
                    <span>-{proposal.discount}% (${(proposal.customPrice * (proposal.discount / 100)).toFixed(2)} / {unit})</span>
                  </div>
                )}
                <div className={styles.priceRow} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span>Volume Sourcing Policy:</span>
                  <span style={{ textAlign: 'right' }}>
                    10-100 {unit} (10%) &bull; 100-200 {unit} (20%) &bull; &gt; 200 {unit} (25%)
                  </span>
                </div>
                {selectedVolumeDiscountPercent > 0 && (
                  <div className={styles.priceRow} style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                    <span>Volume Discount Applied ({selectedVolumeDiscountPercent}%):</span>
                    <span>-${(proposal.customPrice * (selectedVolumeDiscountPercent / 100)).toFixed(2)} / {unit}</span>
                  </div>
                )}
                {proposal.shippingCharge > 0 && (
                  <div className={styles.priceRow}>
                    <span>Port Logistics & Shipping:</span>
                    <span>${proposal.shippingCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Net Price per {unit.charAt(0).toUpperCase() + unit.slice(1)}:</span>
                  <span className={styles.totalPrice}>${finalUnitPrice.toFixed(2)} / {unit}</span>
                </div>
              </div>

              {proposal.notes && (
                <div className={styles.notesCard}>
                  <div className={styles.notesTitle}>Special Sourcing Terms</div>
                  <p>{proposal.notes}</p>
                </div>
              )}

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
                Secure Sourcing Reservation
              </h3>
              
              <form onSubmit={handleSourcingRequest} id="proposal-sourcing-form">
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="client-name">Recipient Name / Chef</label>
                  <input
                    type="text"
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Executive Chef Mitsu"
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="client-email">Contact Sourcing Email</label>
                  <input
                    type="email"
                    id="client-email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="luxury-input"
                    placeholder="chef@finedining.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="sourcing-qty">Required Quantity ({unit}) [Configured by Admin]</label>
                  <input
                    type="number"
                    id="sourcing-qty"
                    min="1"
                    value={quantity}
                    className="luxury-input"
                    required
                    disabled={true}
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                  />
                  {selectedVolumeDiscountPercent > 0 && (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: 'var(--accent-success)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Bulk Sourcing Tier Unlocked! Additional {selectedVolumeDiscountPercent}% Discount Applied.
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="delivery-port">Port of Delivery Address [Configured by Admin]</label>
                  <input
                    type="text"
                    id="delivery-port"
                    value={address}
                    className="luxury-input"
                    required
                    disabled={true}
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                  />
                  {etaResult && address && (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: `1px solid ${etaResult.stockDelayDays > 0 ? 'rgba(226, 183, 68, 0.3)' : 'rgba(0, 242, 254, 0.2)'}`,
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: etaResult.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}>
                        <span style={{ fontSize: '0.9rem' }}>🚚</span>
                        Est. Delivery: {new Date(etaResult.targetDateString + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} ({etaResult.totalDays} Days)
                      </div>
                      {etaResult.stockDelayDays > 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          * Includes 14-day vessel sourcing catch delay due to inventory stock shortage.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="delivery-date">Sourcing Arrival Date</label>
                  <input
                    type="date"
                    id="delivery-date"
                    value={deliveryDate}
                    className="luxury-input"
                    required
                    disabled={true}
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                  />
                </div>

                <div className={styles.priceBreakdown} style={{ marginTop: '24px', background: 'rgba(0, 242, 254, 0.02)' }}>
                  <div className={styles.priceRow}>
                    <span>Sourcing Total ({quantity} {unit}):</span>
                    <span>${sourcingSubtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Port Logistics Charges:</span>
                    <span>${proposal.shippingCharge.toFixed(2)}</span>
                  </div>
                  <div className={styles.totalRow} style={{ fontSize: '1.15rem' }}>
                    <span>Estimated Total:</span>
                    <span className={styles.totalPrice}>${sourcingTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary styles.submitBtn"
                  style={{ width: '100%', height: '48px', fontSize: '1rem', marginTop: '16px' }}
                  disabled={loading}
                  id="proposal-submit-btn"
                >
                  {loading ? 'Logging Procurement...' : 'Reserve Sourcing Catch'}
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.successContainer} id="proposal-success-view">
              <svg
                className={styles.successIcon}
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h3 className={styles.successTitle}>Sourcing Request Logged!</h3>
              <p className={styles.successText}>
                Your custom procurement reservation has been logged into the vessel cargo database. Our logistics manager has been notified.
              </p>

              <div className={styles.receiptCard}>
                <div className={styles.receiptRow}>
                  <span>Reference ID:</span>
                  <span className={styles.receiptRowValue}>{successOrder.id}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Vessel Cargo:</span>
                  <span className={styles.receiptRowValue}>{fish.name}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Sourced Quantity:</span>
                  <span className={styles.receiptRowValue}>{quantity} {unit}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Arrival ETA:</span>
                  <span className={styles.receiptRowValue}>{successOrder.deliveryDate}</span>
                </div>
                {etaResult && (
                  <div className={styles.receiptRow}>
                    <span>Sourcing Timeline:</span>
                    <span className={styles.receiptRowValue} style={{ color: etaResult.stockDelayDays > 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}>
                      {etaResult.totalDays} Days ({etaResult.stockDelayDays > 0 ? 'Backordered Catch' : 'Direct Stock'})
                    </span>
                  </div>
                )}
                <div className={styles.receiptRow}>
                  <span>Port Sourced:</span>
                  <span className={styles.receiptRowValue}>{successOrder.address}</span>
                </div>
                <div className={styles.receiptTotal}>
                  <span>Total Bill:</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>${successOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSuccessOrder(null);
                  setClientName('');
                  setClientEmail('');
                  setQuantity(10);
                  setDeliveryDate('');
                  setAddress('');
                }}
                className="btn-gold" 
                style={{ width: '100%' }}
              >
                Place Another Request
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
