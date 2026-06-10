'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  getCustomCatalogById, 
  getProducts, 
  CustomCatalog,
  calculateSourcingETA,
  ETAPrediction,
  addOrder,
  Order,
  getStoreConfig,
  addReview,
  addSourcingRequest,
  CustomSourcingRequest
} from '@/utils/store';
import { FishItem } from '@/data/fishData';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';
import styles from './catalogue.module.css';
import { toast } from 'sonner';

export default function CatalogueDetailPage() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState<boolean>(false);
  const [catalog, setCatalog] = useState<CustomCatalog | null>(null);
  const [products, setProducts] = useState<FishItem[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  const [storeId, setStoreId] = useState<string>('bluefine');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Client checkout states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [checkoutEntireProposal, setCheckoutEntireProposal] = useState<boolean>(false);

  // Search & Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Review states
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewClientName, setReviewClientName] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');

  // Custom Sourcing Request states
  const [sourcingReqProductId, setSourcingReqProductId] = useState('');
  const [sourcingReqProductName, setSourcingReqProductName] = useState('');
  const [sourcingReqQty, setSourcingReqQty] = useState<number>(1);
  const [sourcingReqNotes, setSourcingReqNotes] = useState('');
  const [sourcingReqClientName, setSourcingReqClientName] = useState('');
  const [sourcingReqClientEmail, setSourcingReqClientEmail] = useState('');

  const getVolumeDiscount = (qty: number) => {
    if (qty > 30) return 20;
    if (qty > 20) return 15;
    if (qty > 10) return 10;
    return 0;
  };

  // Reset checkout states when the selected variety changes or entire checkout toggled
  useEffect(() => {
    setSuccessOrder(null);
    setClientName('');
    setClientEmail('');
  }, [selectedFish, checkoutEntireProposal]);

  // Sync procurement name/email to sourcing request name/email
  useEffect(() => {
    if (clientName && !sourcingReqClientName) setSourcingReqClientName(clientName);
    if (clientEmail && !sourcingReqClientEmail) setSourcingReqClientEmail(clientEmail);
  }, [clientName, clientEmail]);

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
            // Initialize quantities
            const initialQties: Record<string, number> = {};
            prods.forEach((p) => {
              const override = catData.overrides[p.id];
              if (override && override.included) {
                initialQties[p.id] = override.customStock || 1;
              }
            });
            setQuantities(initialQties);
          });
        }
      });
    }
  }, [pathname]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId || !reviewClientName.trim() || !reviewComment.trim()) {
      toast.error('Please complete all review fields.');
      return;
    }
    const selectedProd = products.find(p => p.id === reviewProductId);
    if (!selectedProd) return;

    const newReview = {
      id: `rev-${Math.floor(100000 + Math.random() * 900000)}`,
      productId: reviewProductId,
      productName: selectedProd.name,
      clientName: reviewClientName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      storeId: storeId
    };

    try {
      await addReview(newReview, storeId);
      toast.success('Thank you!', {
        description: `Feedback review submitted successfully for ${selectedProd.name}.`
      });
      // Clear review fields
      setReviewProductId('');
      setReviewClientName('');
      setReviewRating(5);
      setReviewComment('');
    } catch (err) {
      toast.error('Submission Failed', {
        description: 'Failed to save review details.'
      });
    }
  };

  const handleSourcingRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcingReqClientName.trim() || !sourcingReqClientEmail.trim() || sourcingReqQty <= 0) {
      toast.error('Please complete all required sourcing fields.');
      return;
    }
    
    let resolvedProductName = sourcingReqProductName.trim();
    if (sourcingReqProductId) {
      const p = products.find(prod => prod.id === sourcingReqProductId);
      if (p) resolvedProductName = p.name;
    }

    if (!resolvedProductName) {
      toast.error('Please specify the product you want to request.');
      return;
    }

    const newRequest: CustomSourcingRequest = {
      id: `sr-${Math.floor(100000 + Math.random() * 900000)}`,
      storeId,
      clientName: sourcingReqClientName,
      clientEmail: sourcingReqClientEmail.toLowerCase(),
      productId: sourcingReqProductId || undefined,
      productName: resolvedProductName,
      requestedQuantity: sourcingReqQty,
      notes: sourcingReqNotes,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      await addSourcingRequest(newRequest, storeId);
      toast.success('Sourcing Request Submitted!', {
        description: `Your request for ${sourcingReqQty} units of ${resolvedProductName} has been sent to the partner.`
      });
      // Clear inputs
      setSourcingReqProductId('');
      setSourcingReqProductName('');
      setSourcingReqQty(1);
      setSourcingReqNotes('');
    } catch (err) {
      toast.error('Submission Failed', {
        description: 'Failed to send sourcing request. Please try again.'
      });
    }
  };

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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Please ask the merchant to resend the catalogue link.
          </p>
        </div>
      </div>
    );
  }

  // Filter items based on proposal settings, category selection, search query, price range, and sort
  const proposalItems = products
    .filter((p) => {
      const override = catalog.overrides[p.id];
      const isIncluded = override && override.included;
      if (!isIncluded) return false;

      const price = override.customPrice;


      const matchesCategory = selectedCategory === 'All' || selectedCategory === 'All Items' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const overrideA = catalog.overrides[a.id]!;
      const overrideB = catalog.overrides[b.id]!;
      if (sortBy === 'price-asc') return overrideA.customPrice - overrideB.customPrice;
      if (sortBy === 'price-desc') return overrideB.customPrice - overrideA.customPrice;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // Default featured order
    });

  // Consolidated Proposal Cart Calculations
  const includedItems = products.filter((p) => {
    const override = catalog.overrides[p.id];
    return override && override.included && (quantities[p.id] !== undefined ? quantities[p.id] > 0 : override.customStock > 0);
  });

  const totalProposalQty = includedItems.reduce((acc, p) => {
    return acc + (quantities[p.id] !== undefined ? quantities[p.id] : 0);
  }, 0);

  const totalProposalBill = includedItems.reduce((acc, p) => {
    const override = catalog.overrides[p.id];
    if (!override) return acc;
    const price = override.customPrice;
    const qty = quantities[p.id] !== undefined ? quantities[p.id] : override.customStock;
    
    const volDiscount = getVolumeDiscount(qty);

    const discount = ((override.customDiscount !== undefined && override.customDiscount > 0)
      ? override.customDiscount
      : (catalog.globalDiscount || 0)) + volDiscount;
    const finalPrice = price * (1 - discount / 100);
    return acc + (finalPrice * qty);
  }, 0) + (catalog.globalDelivery || 0);

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
  
  const selectedVolumeDiscountPercent = getVolumeDiscount(allocatedStock);

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

  const handleEntireProposalSourcingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalog) return;
    setLoading(true);

    if (includedItems.length === 0) {
      toast.error('No items included in proposal.');
      setLoading(false);
      return;
    }

    // Calculate longest ETA based on active quantities
    let maxETADays = 0;
    let finalETADateString = new Date().toISOString().split('T')[0];
    includedItems.forEach((p) => {
      const qty = quantities[p.id] || 0;
      const eta = calculateSourcingETA(p.origin || '', catalog.marketName || '', qty, p.stock);
      if (eta && eta.totalDays > maxETADays) {
        maxETADays = eta.totalDays;
        finalETADateString = eta.targetDateString;
      }
    });

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
      deliveryDate: finalETADateString,
      address: catalog.marketName,
      items: includedItems.map((p) => {
        const override = catalog.overrides[p.id]!;
        const price = override.customPrice;
        const qty = quantities[p.id] || 0;
        
        const volDiscount = getVolumeDiscount(qty);

        const discount = ((override.customDiscount !== undefined && override.customDiscount > 0)
          ? override.customDiscount
          : (catalog.globalDiscount || 0)) + volDiscount;
        const finalPrice = price * (1 - discount / 100);
        return {
          fishId: p.id,
          name: p.name,
          quantity: qty,
          price: finalPrice,
          image: p.image
        };
      }),
      totalPrice: totalProposalBill,
      status: 'Pending'
    };

    try {
      await addOrder(newOrder, storeId);
      setSuccessOrder(newOrder);
      toast.success('Sourcing Request Logged', {
        description: `Order ${orderRef} successfully recorded.`
      });
    } catch (err) {
      console.error('Failed to log proposal sourcing order:', err);
      toast.error('Reservation Failed', {
        description: `Sourcing order reservation failed at ${new Date().toLocaleString()}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };


  // Derive unique categories from proposal items
  const allProposalItems = products.filter((p) => {
    const override = catalog.overrides[p.id];
    return override && override.included;
  });
  const uniqueCategories = ['All Items', ...Array.from(new Set(allProposalItems.map(p => p.category)))];

  // Items for the right order summary (those with qty > 0)
  const orderItems = allProposalItems.filter(p => (quantities[p.id] || 0) > 0);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', maxWidth: '760px', margin: '0 auto', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Global Sourcing Discount:</span>{' '}
            <strong style={{ color: 'var(--accent-cyan)' }}>{catalog.globalDiscount > 0 ? `${catalog.globalDiscount}% Off Catalog` : 'Standard Rates'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Logistics & Delivery Fee:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{catalog.globalDelivery > 0 ? `$${catalog.globalDelivery.toFixed(2)}` : 'Free Logistics'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Catalogue Price:</span>{' '}
            <strong style={{ color: 'var(--accent-gold)' }}>${totalProposalBill.toFixed(2)}</strong>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(226, 183, 68, 0.15)', marginTop: '8px', paddingTop: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '4px', fontWeight: 600 }}>Bulk Volume Sourcing Discounts</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>More than 10 {storeConfig.unit}:</span> <strong style={{ color: 'var(--accent-cyan)' }}>10% discount</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>More than 20 {storeConfig.unit}:</span> <strong style={{ color: 'var(--accent-cyan)' }}>15% discount</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>More than 30 {storeConfig.unit}:</span> <strong style={{ color: 'var(--accent-cyan)' }}>20% discount</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Toolbar */}
      <section className="glassmorphism" style={{ width: '100%', maxWidth: '1200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', marginBottom: '16px', animation: 'slideUp 0.8s ease-out', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Text Search Input */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="luxury-input"
              style={{ paddingLeft: '36px', paddingTop: '0px', paddingBottom: '0px', height: '34px', fontSize: '0.8rem' }}
              placeholder="Search catalog by name, origin or category..."
              id="client-catalogue-search-input"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div style={{ minWidth: '150px' }}>
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
              {uniqueCategories.filter(c => c !== 'All Items').map((cat) => (
                <option key={cat} value={cat} style={{ background: '#050c1a', color: 'var(--text-primary)' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector Dropdown */}
          <div style={{ minWidth: '150px' }}>
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
              id="client-catalogue-sort-select"
            >
              <option value="featured" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>Featured Picks</option>
              <option value="price-asc" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>Price: Low to High</option>
              <option value="price-desc" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>Price: High to Low</option>
              <option value="name-asc" style={{ background: '#050c1a', color: 'var(--text-primary)' }}>Alphabetical (A-Z)</option>
            </select>
          </div>
      </section>

      {/* Main Side-by-Side Sourcing Pane */}
      <div className={styles.cartContainer}>
        {successOrder ? (
          /* Receipt / Success Screen */
          <div className="glassmorphism" style={{ gridColumn: '1 / -1', padding: '32px', borderRadius: '16px', border: '1px solid var(--accent-success)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(16, 185, 129, 0.02)', animation: 'fadeIn 0.6s ease' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', width: '60px', height: '60px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-playfair), serif' }}>
              Proposal Sourcing Request Lodged!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', maxWidth: '600px' }}>
              The custom sourcing proposal package has been converted into a logged shipment. A receipt invoice has been prepared for dispatch.
            </p>

            <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Invoice ID:</span>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{successOrder.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Client Partner:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{successOrder.userName} ({successOrder.userEmail})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consolidated weight/qty:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{totalProposalQty} {storeConfig.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estimated Arrival:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {new Date(successOrder.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', marginTop: '8px', fontSize: '1.2rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)' }}>Consolidated Total Bill:</span>
                <span style={{ color: 'var(--accent-gold)' }}>${successOrder.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="btn-gold"
              style={{ width: '100%', maxWidth: '300px', height: '44px', fontSize: '0.95rem' }}
            >
              Back to Shopping Cart
            </button>
          </div>
        ) : (
          <>
            {/* Left Pane: Amazon-Style Specimen List layout with Bluefine Dark Glassmorphism Theme */}
            <div className="glassmorphism" style={{ color: 'var(--text-primary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-playfair), serif' }}>Specimen Wish List</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Price</span>
              </div>

              {proposalItems.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Your Wish List is empty.</h3>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Adjust category and text searches above to load proposal catch options.</p>
                </div>
              ) : (
                proposalItems.map((p) => {
                  const override = catalog.overrides[p.id]!;
                  const qty = quantities[p.id] || 0;
                  if (qty === 0) return null;

                  const price = override.customPrice;
                  const volDiscount = getVolumeDiscount(qty);

                  const discount = ((override.customDiscount !== undefined && override.customDiscount > 0)
                    ? override.customDiscount
                    : (catalog.globalDiscount || 0)) + volDiscount;
                  const finalPrice = price * (1 - discount / 100);
                  const itemSubtotal = finalPrice * qty;
                  const itemEta = calculateSourcingETA(p.origin || '', catalog.marketName || '', qty, p.stock);

                  return (
                    <div key={p.id} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
                      {/* Left: Product Image */}
                      <div 
                        onClick={() => setSelectedFish(p)}
                        style={{ width: '130px', height: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <img src={p.image} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>

                      {/* Middle: Specs & Details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 
                          onClick={() => setSelectedFish(p)}
                          style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', margin: 0, cursor: 'pointer', lineHeight: '1.25' }}
                        >
                          {p.name}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--accent-success)', fontWeight: 'bold' }}>In stock</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          FREE delivery <strong style={{ color: 'var(--text-primary)' }}>{new Date(itemEta.targetDateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ background: 'var(--accent-gold)', color: '#030812', fontSize: '9px', fontWeight: 800, padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase' }}>{storeConfig.storeName.split(' ')[0]}</span>
                          <span>Fulfilled</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <strong>Origin:</strong> {p.origin} &bull; <strong>Scientific Name:</strong> {p.scientificName}
                        </div>

                        {/* Spec Details instead of interactive cart selectors */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            Quantity: {qty} {p.unit || storeConfig.unit || 'kg'}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Stock:</strong> {p.stock} {p.unit || storeConfig.unit || 'kg'} available
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Category:</strong> {p.category}
                          </span>
                          {p.difficulty && (
                            <>
                              <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <strong>Difficulty:</strong> {p.difficulty}
                              </span>
                            </>
                          )}
                          {p.sustainability && (
                            <>
                              <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <strong>Sustainability:</strong> {p.sustainability}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Subtotal price */}
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)' }}>${itemSubtotal.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ${finalPrice.toFixed(2)} / {p.unit || storeConfig.unit}
                        </div>
                        {volDiscount > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 'bold', marginTop: '4px' }}>
                            Includes {volDiscount}% Volume Sourcing Discount
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {proposalItems.length > 0 && (
                <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 400, marginTop: '20px', color: 'var(--text-primary)' }}>
                  Wish List Total ({totalProposalQty} items): <strong style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>${(totalProposalBill - (catalog.globalDelivery || 0)).toFixed(2)}</strong>
                </div>
              )}



              {/* Custom Sourcing Request Form */}
              <div className="glassmorphism" style={{ marginTop: '30px', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-playfair), serif' }}>Request Custom Sourcing & Volumes</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  If you need a product not listed in the catalogue, or require larger quantities of an existing product, specify your requirements here.
                </p>
                <form onSubmit={handleSourcingRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Target Product</label>
                      <select
                        value={sourcingReqProductId}
                        onChange={(e) => {
                          setSourcingReqProductId(e.target.value);
                          if (e.target.value !== '') {
                            setSourcingReqProductName('');
                          }
                        }}
                        className="luxury-input"
                        style={{ width: '100%', padding: '8px 10px', height: '38px', fontSize: '14px' }}
                      >
                        <option value="">-- Custom / Other Product --</option>
                        {allProposalItems.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {!sourcingReqProductId && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Name</label>
                        <input
                          type="text"
                          value={sourcingReqProductName}
                          onChange={(e) => setSourcingReqProductName(e.target.value)}
                          className="luxury-input"
                          style={{ width: '100%', padding: '8px 10px', height: '38px', fontSize: '14px' }}
                          placeholder="e.g. Premium Sea Urchin Uni"
                          required={!sourcingReqProductId}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Desired Quantity ({storeConfig.unit})</label>
                      <input
                        type="number"
                        min="1"
                        value={sourcingReqQty}
                        onChange={(e) => setSourcingReqQty(parseInt(e.target.value) || 1)}
                        className="luxury-input"
                        style={{ width: '100%', padding: '8px 10px', height: '38px', fontSize: '14px' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Your Name</label>
                      <input
                        type="text"
                        value={sourcingReqClientName}
                        onChange={(e) => setSourcingReqClientName(e.target.value)}
                        className="luxury-input"
                        style={{ width: '100%', padding: '8px 10px', height: '38px', fontSize: '14px' }}
                        placeholder="e.g. Chef Mitsu"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Your Email</label>
                      <input
                        type="email"
                        value={sourcingReqClientEmail}
                        onChange={(e) => setSourcingReqClientEmail(e.target.value)}
                        className="luxury-input"
                        style={{ width: '100%', padding: '8px 10px', height: '38px', fontSize: '14px' }}
                        placeholder="chef@restaurant.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Requirement Details / Custom Specifications</label>
                    <textarea
                      value={sourcingReqNotes}
                      onChange={(e) => setSourcingReqNotes(e.target.value)}
                      className="luxury-input"
                      style={{ width: '100%', padding: '10px', minHeight: '80px', fontSize: '14px', resize: 'vertical' }}
                      placeholder="Specify size, grade, target pricing, delivery schedule or special packaging..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-cyan"
                    style={{ width: 'fit-content', padding: '0 24px', height: '40px', fontSize: '14px', alignSelf: 'flex-start' }}
                  >
                    Submit Sourcing Request
                  </button>
                </form>
              </div>
            </div>

            {/* Right Pane: Checkout Sourcing Summary Form and Contact Details in Premium Glassmorphism styling */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content', position: 'sticky', top: '100px' }}>
              <div className="glassmorphism" style={{ color: 'var(--text-primary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Order Summary</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Items Subtotal:</span>
                    <span style={{ color: 'var(--text-primary)' }}>${(totalProposalBill - (catalog.globalDelivery || 0)).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Logistics & Handling:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{catalog.globalDelivery > 0 ? `$${catalog.globalDelivery.toFixed(2)}` : 'Free'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '24px' }}>
                  <span>Order Total:</span>
                  <span>${totalProposalBill.toFixed(2)}</span>
                </div>

                {/* Sourcing form fields */}
                <form onSubmit={handleEntireProposalSourcingRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }} htmlFor="client-name">Chef Name / Client Licensee</label>
                    <input
                      type="text"
                      id="client-name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="luxury-input"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }}
                      placeholder="e.g. Chef Mitsuhiro Araki"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }} htmlFor="client-email">Procurement Email</label>
                    <input
                      type="email"
                      id="client-email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="luxury-input"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }}
                      placeholder="chef@kitchen.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div style={{ marginTop: '4px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>📍 <strong>Destination Port:</strong> {catalog.marketName}</div>
                    <div>🚚 <strong>Arrival Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || totalProposalQty === 0}
                    className="btn-cyan"
                    style={{
                      width: '100%',
                      height: '42px',
                      fontSize: '14px',
                      fontWeight: 700,
                      marginTop: '12px',
                      textAlign: 'center'
                    }}
                  >
                    {loading ? 'Processing Sourcing Shipment...' : `Place Sourcing Shipment`}
                  </button>
                </form>
              </div>

              {/* Contact Seller Card */}
              <div className="glassmorphism" style={{ color: 'var(--text-primary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--accent-cyan)' }}>Contact Partner</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div>📧 <strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{storeConfig.ownerEmail || 'contact@bluefine.com'}</span></div>
                  {storeConfig.storePhone && (
                    <div>📞 <strong>Phone:</strong> <span style={{ color: 'var(--text-primary)' }}>{storeConfig.storePhone}</span></div>
                  )}
                  {storeConfig.storeAddress && (
                    <div>📍 <strong>Address:</strong> <span style={{ color: 'var(--text-primary)' }}>{storeConfig.storeAddress}</span></div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Unified Procurement Details Modal for inspecting single product specifications */}
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
                </div>
              </div>

              {/* Right Column: Detailed Product Sourcing Rules */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>Product Sourcing Characteristics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>{storeConfig.attributes.textureLabel}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedFish.texture}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>{storeConfig.attributes.tasteProfileLabel}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedFish.tasteProfile?.join(', ') || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>{storeConfig.attributes.sustainabilityLabel}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedFish.sustainability}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>{storeConfig.attributes.difficultyLabel}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedFish.difficulty}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Origin:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedFish.origin}</strong>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedFish(null)}
                  className="btn-gold"
                  style={{ width: '100%', height: '40px', fontSize: '0.9rem' }}
                >
                  Close Specifications
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
