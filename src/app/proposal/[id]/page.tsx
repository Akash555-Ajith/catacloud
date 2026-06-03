'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  getProposalById, 
  getProducts, 
  addOrder, 
  Order, 
  Proposal 
} from '@/utils/store';
import { FishItem } from '@/data/fishData';
import styles from './proposal.module.css';

export default function ProposalDetailPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState<boolean>(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [fish, setFish] = useState<FishItem | null>(null);

  // Client checkout states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    setMounted(true);

    const proposalId = pathname ? pathname.split('/').pop() || '' : '';
    if (proposalId) {
      getProposalById(proposalId).then((propData) => {
        if (propData) {
          setProposal(propData);
          getProducts().then((products) => {
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
  const discountedPricePerKg = proposal.customPrice * (1 - proposal.discount / 100);
  const sourcingSubtotal = discountedPricePerKg * quantity;
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
          price: discountedPricePerKg,
          image: fish.image
        }
      ],
      totalPrice: sourcingTotal,
      status: 'Pending'
    };

    try {
      await addOrder(newOrder);
      setSuccessOrder(newOrder);
    } catch (err) {
      console.error('Failed to submit order to database:', err);
      alert('Logistics reservation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <span className={styles.profileLabel}>Texture Profile</span>
              <span className={styles.profileValue}>{fish.texture}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Prep Guide</span>
              <span className={styles.profileValue}>{fish.prepTime} ({fish.difficulty})</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Taste Profile</span>
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
                  <span className={styles.priceHighlight}>${proposal.customPrice.toFixed(2)} / kg</span>
                </div>
                {proposal.discount > 0 && (
                  <div className={`${styles.priceRow} styles.discountRow`} style={{ color: 'var(--accent-gold)' }}>
                    <span>Special Market Discount:</span>
                    <span>-{proposal.discount}% (${(proposal.customPrice * (proposal.discount / 100)).toFixed(2)} / kg)</span>
                  </div>
                )}
                {proposal.shippingCharge > 0 && (
                  <div className={styles.priceRow}>
                    <span>Port Logistics & Shipping:</span>
                    <span>${proposal.shippingCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Net Price per Kg:</span>
                  <span className={styles.totalPrice}>${discountedPricePerKg.toFixed(2)} / kg</span>
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
                  <label className={styles.label} htmlFor="sourcing-qty">Required Weight (kg)</label>
                  <input
                    type="number"
                    id="sourcing-qty"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="luxury-input"
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="delivery-date">Sourcing Arrival Date</label>
                  <input
                    type="date"
                    id="delivery-date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="luxury-input"
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="delivery-port">Port of Delivery Address</label>
                  <input
                    type="text"
                    id="delivery-port"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="luxury-input"
                    placeholder=" Tsukiji Harbour, Kitchen 5A"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.priceBreakdown} style={{ marginTop: '24px', background: 'rgba(0, 242, 254, 0.02)' }}>
                  <div className={styles.priceRow}>
                    <span>Sourcing Total ({quantity} kg):</span>
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
                  <span>Sourced Weight:</span>
                  <span className={styles.receiptRowValue}>{quantity} kg</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Arrival ETA:</span>
                  <span className={styles.receiptRowValue}>{successOrder.deliveryDate}</span>
                </div>
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
