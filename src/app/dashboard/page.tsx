'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FishItem } from '@/data/fishData';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getOrders, 
  updateOrderStatus, 
  Order,
  Proposal,
  getProposals,
  addProposal,
  deleteProposal,
  CustomCatalog,
  getCustomCatalogs,
  addCustomCatalog,
  deleteCustomCatalog
} from '@/utils/store';
import Navbar from '@/components/Navbar';
import styles from './dashboard.module.css';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ email: string; name: string; role: 'user' | 'admin'; avatar?: string } | null>(null);

  // Data states
  const [products, setProducts] = useState<FishItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [customCatalogs, setCustomCatalogs] = useState<CustomCatalog[]>([]);

  // Navigation / UI tabs for Admin
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'catalogs'>('orders');

  // Custom Catalogue Form Fields
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [catSelectedCategory, setCatSelectedCategory] = useState('All');
  const [catMarket, setCatMarket] = useState('');
  const [catNotes, setCatNotes] = useState('');
  const [catDiscount, setCatDiscount] = useState<number>(0);
  const [catDelivery, setCatDelivery] = useState<number>(0);
  const [catOverrides, setCatOverrides] = useState<{
    [id: string]: { price: number; stock: number; discount: number; threshold: number; volumeDiscount: number; included: boolean };
  }>({});
  const [formUnit, setFormUnit] = useState('kg');

  // Modal / Form states for product management
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<FishItem | null>(null);
  
  // Product form fields
  const [formName, setFormName] = useState('');
  const [formSciName, setFormSciName] = useState('');
  const [formCategory, setFormCategory] = useState<'Saltwater' | 'Freshwater' | 'Shellfish' | 'Premium Import'>('Saltwater');
  const [formPrice, setFormPrice] = useState(0);
  const [formOrigin, setFormOrigin] = useState('');
  const [formStock, setFormStock] = useState(0);
  const [formImage, setFormImage] = useState('/images/bluefin_tuna.png');
  const [formDesc, setFormDesc] = useState('');
  const [formTaste, setFormTaste] = useState('');
  const [formTexture, setFormTexture] = useState('');
  const [formSustainability, setFormSustainability] = useState<'Sustainably Farmed' | 'Wild Caught' | 'MSC Certified'>('Wild Caught');
  const [formPrep, setFormPrep] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Expert'>('Easy');

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('bluefine_user');
      if (!storedUser) {
        router.push('/login');
      } else {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        } catch {
          router.push('/login');
        }
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-profile-updated', loadUser);

    // Load data asynchronously
    const storedUser = localStorage.getItem('bluefine_user');
    if (storedUser) {
      Promise.all([
        getProducts(),
        getOrders(),
        getProposals(),
        getCustomCatalogs()
      ]).then(([prods, ords, props, cats]) => {
        setProducts(prods);
        setOrders(ords);
        setProposals(props);
        setCustomCatalogs(cats);
      });
    }
    setMounted(true);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
    };
  }, [router]);

  // Initialize custom catalog overrides when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const initialOverrides: typeof catOverrides = {};
      products.forEach((p) => {
        initialOverrides[p.id] = {
          price: p.pricePerKg,
          stock: p.stock,
          discount: 0,
          threshold: 0,
          volumeDiscount: 0,
          included: false
        };
      });
      setCatOverrides(initialOverrides);
    }
  }, [products]);

  if (!mounted || !isAuthenticated || !user) {
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
            fill="url(#dashboard-loading-logo)"
          />
          <defs>
            <linearGradient id="dashboard-loading-logo" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('bluefine_user');
    localStorage.removeItem('bluefine_cart');
    router.push('/login');
  };

  // Order status modification handler
  const handleUpdateStatus = async (orderId: string, status: 'Pending' | 'Dispatched' | 'Delivered') => {
    await updateOrderStatus(orderId, status);
    const ords = await getOrders();
    setOrders(ords);
  };

  // Open product modal for editing or adding
  const handleOpenProductModal = (product: FishItem | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormSciName(product.scientificName);
      setFormCategory(product.category);
      setFormPrice(product.pricePerKg);
      setFormOrigin(product.origin);
      setFormStock(product.stock);
      setFormImage(product.image);
      setFormDesc(product.description);
      setFormTaste(product.tasteProfile.join(', '));
      setFormTexture(product.texture);
      setFormSustainability(product.sustainability);
      setFormPrep(product.prepTime);
      setFormDifficulty(product.difficulty);
      setFormUnit(product.unit || 'kg');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormSciName('');
      setFormCategory('Saltwater');
      setFormPrice(15.0);
      setFormOrigin('');
      setFormStock(20);
      // Randomly pick one of the default beautiful seafood images
      const sampleImages = [
        '/images/bluefin_tuna.png',
        '/images/king_salmon.png',
        '/images/diver_scallops.png',
        '/images/tiger_prawns.png',
        '/images/red_snapper.png',
        '/images/atlantic_halibut.png'
      ];
      const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      setFormImage(randomImg);
      setFormDesc('');
      setFormTaste('');
      setFormTexture('');
      setFormSustainability('Wild Caught');
      setFormPrep('');
      setFormDifficulty('Easy');
      setFormUnit('kg');
    }
    setIsProductModalOpen(true);
  };

  // Submit product add or edit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tasteProfileArray = formTaste
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const productData: FishItem = {
      id: editingProduct ? editingProduct.id : formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: formName,
      scientificName: formSciName,
      category: formCategory,
      pricePerKg: Number(formPrice),
      origin: formOrigin,
      stock: Number(formStock),
      image: formImage,
      description: formDesc,
      tasteProfile: tasteProfileArray.length > 0 ? tasteProfileArray : ['Savory', 'Fresh'],
      texture: formTexture || 'Firm, tender',
      sustainability: formSustainability,
      prepTime: formPrep || '15 mins',
      difficulty: formDifficulty,
      unit: formUnit
    };

    if (editingProduct) {
      await updateProduct(productData);
    } else {
      await addProduct(productData);
    }

    const prods = await getProducts();
    setProducts(prods);
    setIsProductModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product from the inventory catalogue?')) {
      await deleteProduct(id);
      const prods = await getProducts();
      setProducts(prods);
    }
  };





  const handleOverridePriceChange = (productId: string, price: number) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], price }
    }));
  };

  const handleOverrideStockChange = (productId: string, stock: number) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], stock }
    }));
  };

  const handleOverrideDiscountChange = (productId: string, discount: number) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], discount }
    }));
  };

  const handleOverrideThresholdChange = (productId: string, threshold: number) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], threshold }
    }));
  };

  const handleOverrideVolumeDiscountChange = (productId: string, volumeDiscount: number) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], volumeDiscount }
    }));
  };

  const handleOverrideIncludedChange = (productId: string, included: boolean) => {
    setCatOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], included }
    }));
  };

  const handleCatProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catMarket) return;

    const overridesToSave: CustomCatalog['overrides'] = {};
    Object.keys(catOverrides).forEach((pid) => {
      overridesToSave[pid] = {
        customPrice: catOverrides[pid].price,
        customStock: catOverrides[pid].stock,
        customDiscount: catOverrides[pid].discount || 0,
        customVolumeThreshold: catOverrides[pid].threshold || 0,
        customVolumeDiscount: catOverrides[pid].volumeDiscount || 0,
        included: catOverrides[pid].included
      };
    });

    const hasIncluded = Object.values(overridesToSave).some((o) => o.included);
    if (!hasIncluded) {
      toast.error('Selection Required', {
        description: 'Please include at least one specimen in the custom catalogue.'
      });
      return;
    }

    const newCatalog: CustomCatalog = {
      id: `cat-proposal-${Math.floor(100000 + Math.random() * 900000)}`,
      marketName: catMarket,
      notes: catNotes,
      globalDiscount: Number(catDiscount),
      globalDelivery: Number(catDelivery),
      createdDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      overrides: overridesToSave
    };

    await addCustomCatalog(newCatalog);
    const cats = await getCustomCatalogs();
    setCustomCatalogs(cats);

    // Reset form fields
    setCatMarket('');
    setCatNotes('');
    setCatDiscount(0);
    setCatDelivery(0);
    const resetOverrides: typeof catOverrides = {};
    products.forEach((p) => {
      resetOverrides[p.id] = {
        price: p.pricePerKg,
        stock: p.stock,
        discount: 0,
        threshold: 0,
        volumeDiscount: 0,
        included: false
      };
    });
    setCatOverrides(resetOverrides);
    toast.success('Catalogue Generated', {
      description: `Generated successfully on ${new Date().toLocaleString()}`
    });
  };

  const handleDeleteCustomCatalog = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom catalogue proposal link?')) {
      await deleteCustomCatalog(id);
      const cats = await getCustomCatalogs();
      setCustomCatalogs(cats);
    }
  };

  const handleCopyCatalogLink = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/catalogue/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link Copied to Clipboard', {
        description: `Proposal link copied on ${new Date().toLocaleString()}`,
        action: {
          label: 'Open Link',
          onClick: () => window.open(link, '_blank')
        }
      });
    }).catch(() => {
      toast.error('Copy Failed', {
        description: `Could not copy automatically. Click to open: ${link}`,
        action: {
          label: 'Open Link',
          onClick: () => window.open(link, '_blank')
        }
      });
    });
  };

  // Calculate statistics
  const chefOrders = orders.filter((o) => o.userEmail.toLowerCase() === user.email.toLowerCase());
  
  // User Stats
  const totalWeightSourced = chefOrders.reduce(
    (acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );
  const totalSourcingValue = chefOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  
  // Sustainability rating based on MSC / Sustainably Farmed shares
  const sustainableItemsCount = chefOrders.reduce(
    (acc, order) => acc + order.items.length, 0
  );
  const sustainabilityScore = sustainableItemsCount > 0 ? 'A+' : 'N/A';

  // Admin Stats
  const adminTotalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const adminActiveOrders = orders.filter((o) => o.status !== 'Delivered').length;
  const adminTotalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);



  return (
    <div className={styles.pageContainer}>
      <Navbar
        cartCount={0}
        onCartToggle={() => {}}
        onLogout={handleLogout}
      />

      <main className={styles.container}>
        {/* Admin Dashboard */}
        {user.role === 'admin' ? (
          <div>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>Inventory Manager Panel</h1>
                <span className={styles.titleHighlight}>Landed Catch & logistics Hub</span>
              </div>
            </header>

            {/* Admin Stats Row */}
            <section className={styles.statsGrid}>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Ocean Varieties</span>
                <span className={styles.statValue}>{products.length}</span>
                <span className={styles.statSubtext}>Active in catalogue</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Available Stock</span>
                <span className={styles.statValue}>{adminTotalStock} <span style={{ fontSize: '1.2rem' }}>kg</span></span>
                <span className={styles.statSubtext}>Across Tsukiji / North Atlantic ports</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Active Shipments</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>{adminActiveOrders}</span>
                <span className={styles.statSubtext}>Pending or Dispatched</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <span className={styles.statLabel}>Total Sourced Value</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-gold)' }}>${adminTotalRevenue.toFixed(2)}</span>
                <span className={styles.statSubtext}>Orders from all partner Chefs</span>
              </div>
            </section>

            {/* Tab Controllers */}
            <div className={styles.tabContainer}>
              <button 
                onClick={() => setAdminTab('orders')}
                className={`${styles.tabBtn} ${adminTab === 'orders' ? styles.tabBtnActive : ''}`}
                id="admin-tab-orders"
              >
                Logistics & Orders ({orders.length})
              </button>
              <button 
                onClick={() => setAdminTab('products')}
                className={`${styles.tabBtn} ${adminTab === 'products' ? styles.tabBtnActive : ''}`}
                id="admin-tab-products"
              >
                Catalogue Inventory ({products.length})
              </button>
              <button 
                onClick={() => setAdminTab('catalogs')}
                className={`${styles.tabBtn} ${adminTab === 'catalogs' ? styles.tabBtnActive : ''}`}
                id="admin-tab-catalogs"
              >
                Custom Catalogue Proposals ({customCatalogs.length})
              </button>
            </div>

            {/* Orders Logistics Section */}
            {adminTab === 'orders' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Partner Sourcing Requests</h2>
                {orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg className={styles.emptyStateIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <p>No culinary sourcing orders recorded in history.</p>
                  </div>
                ) : (
                  <div className={styles.ordersList}>
                    {orders.map((order) => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <div>
                            <span className={styles.orderId}>{order.id}</span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>&bull;</span>
                            <span className={styles.orderDate}>{order.date}</span>
                          </div>
                          <span className={`${styles.orderStatus} ${
                            order.status === 'Pending' ? styles.statusPending :
                            order.status === 'Dispatched' ? styles.statusDispatched :
                            styles.statusDelivered
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className={styles.orderBody}>
                          <div className={styles.orderMetaRow}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Chef Account:</span>{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>{order.userName}</strong> ({order.userEmail})
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>ETA Delivery:</span>{' '}
                              <span className={styles.orderAddress}>{order.deliveryDate}</span>
                            </div>
                          </div>
                          <div className={styles.orderMetaRow} style={{ marginBottom: '24px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Port of Delivery:</span>{' '}
                              <span className={styles.orderAddress}>{order.address}</span>
                            </div>
                          </div>

                          <table className={styles.orderItemsTable}>
                            <thead>
                              <tr>
                                <th>Sourced Product</th>
                                <th style={{ textAlign: 'right' }}>Weight (kg)</th>
                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className={styles.itemNameCell}>
                                    <img src={item.image} alt={item.name} className={styles.itemImage} />
                                    <span>{item.name}</span>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} kg</td>
                                  <td style={{ textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.orderFooter}>
                          <div className={styles.adminControls}>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Pending')}
                              className={`btn-secondary ${styles.controlBtn}`}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              disabled={order.status === 'Pending'}
                            >
                              Set Pending
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Dispatched')}
                              className={`btn-primary ${styles.controlBtn}`}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              disabled={order.status === 'Dispatched'}
                            >
                              Dispatch Cargo
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                              className={`btn-gold ${styles.controlBtn}`}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              disabled={order.status === 'Delivered'}
                            >
                              Confirm Delivery
                            </button>
                          </div>
                          <div className={styles.orderTotal}>
                            Order Value: ${order.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Products Inventory Section */}
            {adminTab === 'products' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <div className={styles.sectionTitle}>
                  <span>Landed Catch Inventory Catalog</span>
                  <button 
                    onClick={() => handleOpenProductModal(null)} 
                    className="btn-primary" 
                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                    id="admin-add-product-btn"
                  >
                    + Land New Catch
                  </button>
                </div>

                <div className={styles.productsTableWrapper}>
                  <table className={styles.productsTable}>
                    <thead>
                      <tr>
                        <th>Specimen</th>
                        <th>Category</th>
                        <th>Price/Kg</th>
                        <th>Current Stock</th>
                        <th>Origin</th>
                        <th>Sustainability</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <div className={styles.productNameCell}>
                              <img src={prod.image} alt={prod.name} className={styles.productImg} />
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{prod.name}</strong>
                                <span className={styles.productScientificName}>{prod.scientificName}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${
                              prod.category === 'Saltwater' ? styles.badgeSaltwater :
                              prod.category === 'Freshwater' ? styles.badgeFreshwater :
                              prod.category === 'Shellfish' ? styles.badgeShellfish :
                              styles.badgePremium
                            }`}>
                              {prod.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>${prod.pricePerKg.toFixed(2)}</td>
                          <td style={{ color: prod.stock < 10 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                            <strong>{prod.stock}</strong> kg
                            {prod.stock < 10 && <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--accent-danger)' }}>Low Stock</span>}
                          </td>
                          <td>{prod.origin}</td>
                          <td style={{ fontSize: '0.85rem' }}>{prod.sustainability}</td>
                          <td>
                            <div className={styles.actionButtons} style={{ justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleOpenProductModal(prod)}
                                className={styles.btnIcon}
                                title="Edit Catch Details"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className={`${styles.btnIcon} ${styles.btnIconDelete}`}
                                title="Delete Specimen"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Custom Catalogues Section */}
            {adminTab === 'catalogs' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Custom Catalogue Proposal Generator</h2>

                {/* Catalogue generator form */}
                <form onSubmit={handleCatProposalSubmit} style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Target Market / Client Name</label>
                      <input
                        type="text"
                        value={catMarket}
                        onChange={(e) => setCatMarket(e.target.value)}
                        className="luxury-input"
                        placeholder="e.g. London Gourmet Foods"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Proposal Notes / Custom Terms</label>
                      <input
                        type="text"
                        value={catNotes}
                        onChange={(e) => setCatNotes(e.target.value)}
                        className="luxury-input"
                        placeholder="e.g. Free shipping, VAT excluded"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Global Sourcing Discount (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCatDiscount(prev => Math.max(0, prev - 1))}
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={catDiscount}
                          onChange={(e) => setCatDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="luxury-input"
                          style={{
                            borderRadius: '0',
                            textAlign: 'center',
                            height: '40px',
                            borderLeft: 'none',
                            borderRight: 'none',
                            flex: 1
                          }}
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => setCatDiscount(prev => Math.min(100, prev + 1))}
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--glass-border)',
                            borderLeft: 'none',
                            borderRadius: '0 8px 8px 0',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Global Logistics / Delivery Charge ($)</label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCatDelivery(prev => Math.max(0, Number((prev - 5).toFixed(2))))}
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={catDelivery}
                          onChange={(e) => setCatDelivery(Math.max(0, Number(e.target.value)))}
                          className="luxury-input"
                          style={{
                            borderRadius: '0',
                            textAlign: 'center',
                            height: '40px',
                            borderLeft: 'none',
                            borderRight: 'none',
                            flex: 1
                          }}
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => setCatDelivery(prev => Math.max(0, Number((prev + 5).toFixed(2))))}
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--glass-border)',
                            borderLeft: 'none',
                            borderRadius: '0 8px 8px 0',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                   {/* Overrides Table Header & Search Filter Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '1.2rem', margin: 0 }}>
                        Configure Specimen Overrides
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Selected: <strong style={{ color: 'var(--accent-cyan)' }}>{Object.values(catOverrides).filter(o => o.included).length}</strong> / {products.length} specimens
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const bulk: typeof catOverrides = {};
                            products.forEach(p => {
                              bulk[p.id] = {
                                ...catOverrides[p.id],
                                included: true
                              };
                            });
                            setCatOverrides(bulk);
                          }}
                          className="btn-cyan"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', background: 'rgba(0, 242, 254, 0.05)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Add All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const bulk: typeof catOverrides = {};
                            products.forEach(p => {
                              bulk[p.id] = {
                                ...catOverrides[p.id],
                                included: false
                              };
                            });
                            setCatOverrides(bulk);
                          }}
                          className="btn-gold"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', background: 'rgba(226, 183, 68, 0.05)', color: 'var(--accent-gold)', border: '1px solid rgba(226, 183, 68, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove All
                        </button>
                      </div>
                    </div>

                    {/* Search & Category Filter Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <input
                          type="text"
                          value={catSearchQuery}
                          onChange={(e) => setCatSearchQuery(e.target.value)}
                          className="luxury-input"
                          style={{ paddingLeft: '36px', paddingTop: '0px', paddingBottom: '0px', height: '36px', fontSize: '0.85rem' }}
                          placeholder="Search overrides by name, scientific name, or origin..."
                          id="cat-override-search-input"
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>🔍</span>
                      </div>
                      <div style={{ minWidth: '180px' }}>
                        <select
                          value={catSelectedCategory}
                          onChange={(e) => setCatSelectedCategory(e.target.value)}
                          className="luxury-input"
                          style={{ height: '36px', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '12px', paddingRight: '32px', fontSize: '0.85rem', appearance: 'none', cursor: 'pointer', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                        >
                          <option value="All">All Categories</option>
                          <option value="Saltwater">Saltwater</option>
                          <option value="Freshwater">Freshwater</option>
                          <option value="Shellfish">Shellfish</option>
                          <option value="Premium Import">Premium Import</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className={styles.productsTableWrapper} style={{ marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                    <table className={styles.productsTable}>
                      <thead>
                        <tr>
                          <th style={{ width: '80px', textAlign: 'center' }}>Include</th>
                          <th>Specimen Name</th>
                          <th>Standard Price</th>
                          <th>Custom Proposal Price ($)</th>
                          <th>Proposal Discount (%)</th>
                          <th>Allocated Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products
                          .filter((p) => {
                            const matchesCategory = catSelectedCategory === 'All' || p.category === catSelectedCategory;
                            const matchesSearch = p.name.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
                              p.scientificName.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
                              p.origin.toLowerCase().includes(catSearchQuery.toLowerCase());
                            return matchesCategory && matchesSearch;
                          })
                          .map((p) => {
                          const override = catOverrides[p.id] || { price: p.pricePerKg, stock: p.stock, discount: 0, threshold: 0, volumeDiscount: 0, included: false };
                          return (
                            <tr key={p.id} style={{ opacity: override.included ? 1 : 0.4 }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={override.included}
                                  onChange={(e) => handleOverrideIncludedChange(p.id, e.target.checked)}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                              </td>
                              <td>
                                <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong>
                                <span className={styles.productScientificName}>{p.scientificName}</span>
                              </td>
                              <td>${p.pricePerKg.toFixed(2)}/{p.unit || 'kg'}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={override.price}
                                    onChange={(e) => handleOverridePriceChange(p.id, Number(e.target.value))}
                                    className="luxury-input"
                                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100px' }}
                                    disabled={!override.included}
                                    required={override.included}
                                  />
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{p.unit || 'kg'}</span>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={override.discount || 0}
                                  onChange={(e) => handleOverrideDiscountChange(p.id, Number(e.target.value))}
                                  className="luxury-input"
                                  style={{ padding: '6px 12px', fontSize: '0.85rem', width: '80px' }}
                                  disabled={!override.included}
                                  required={override.included}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    value={override.stock}
                                    onChange={(e) => handleOverrideStockChange(p.id, Number(e.target.value))}
                                    className="luxury-input"
                                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: '80px' }}
                                    disabled={!override.included}
                                    required={override.included}
                                  />
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.unit || 'kg'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button type="submit" className="btn-primary" id="generate-cat-proposal-btn">
                    Generate Custom Catalogue Proposal Link
                  </button>
                </form>

                {/* List of custom catalogs */}
                <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '1.3rem', marginBottom: '20px' }}>
                  Active Catalogue Links
                </h3>
                {customCatalogs.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No custom catalogue links generated yet. Use the form above to generate links.</p>
                  </div>
                ) : (
                  <div className={styles.productsTableWrapper}>
                    <table className={styles.productsTable}>
                      <thead>
                        <tr>
                          <th>Target Market</th>
                          <th>Included Varieties</th>
                          <th>Global Discount</th>
                          <th>Delivery Charge</th>
                          <th>Notes</th>
                          <th>Created</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customCatalogs.map((cat) => {
                          const includedCount = Object.values(cat.overrides).filter((o) => o.included).length;
                          return (
                            <tr key={cat.id}>
                              <td>
                                <strong style={{ color: 'var(--text-primary)' }}>{cat.marketName}</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {cat.id}</span>
                              </td>
                              <td>{includedCount} of {products.length} specimens</td>
                              <td style={{ color: cat.globalDiscount > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: 600 }}>
                                {cat.globalDiscount > 0 ? `${cat.globalDiscount}%` : 'None'}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {cat.globalDelivery > 0 ? `$${cat.globalDelivery.toFixed(2)}` : 'Free'}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cat.notes || '-'}</td>
                              <td>{cat.createdDate}</td>
                              <td>
                                <div className={styles.actionButtons} style={{ justifyContent: 'center' }}>
                                  <button
                                    onClick={() => handleCopyCatalogLink(cat.id)}
                                    className="btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                                    title="Copy Catalogue Link"
                                  >
                                    Copy Link
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomCatalog(cat.id)}
                                    className={`${styles.btnIcon} ${styles.btnIconDelete}`}
                                    title="Delete Catalogue Proposal"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* Chef / User Dashboard */
          <div>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>Chef Sourcing Dashboard</h1>
                <span className={styles.titleHighlight}>Michelin Partner Culinary Hub</span>
              </div>
            </header>

            {/* Chef Stats Row */}
            <section className={styles.statsGrid}>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sourced Weight</span>
                <span className={styles.statValue}>{totalWeightSourced} <span style={{ fontSize: '1.2rem' }}>kg</span></span>
                <span className={styles.statSubtext}>Premium marine species</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sourcing Investment</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>${totalSourcingValue.toFixed(2)}</span>
                <span className={styles.statSubtext}>Total catalog investment</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sustainability Profile</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-success)' }}>{sustainabilityScore}</span>
                <span className={styles.statSubtext}>Responsible harvesting</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <span className={styles.statLabel}>Sourcing Authorization</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-gold)', fontSize: '1.6rem' }}>
                  {totalSourcingValue > 1000 ? 'Elite Michelin' : totalSourcingValue > 500 ? 'Preferred Chef' : 'General Sourcing'}
                </span>
                <span className={styles.statSubtext}>Michelin account tier status</span>
              </div>
            </section>

            <div className={styles.splitLayout}>
              {/* Left Column: Sourcing Order History */}
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Sourcing & Delivery History</h2>
                {chefOrders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg className={styles.emptyStateIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Sourced Catch Yet</h3>
                    <p style={{ marginBottom: '24px' }}>Submit a procurement reservation in our catalog port.</p>
                    <button onClick={() => router.push('/')} className="btn-primary">
                      Explore Sourcing Catalog
                    </button>
                  </div>
                ) : (
                  <div className={styles.ordersList}>
                    {chefOrders.map((order) => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <div>
                            <span className={styles.orderId}>{order.id}</span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>&bull;</span>
                            <span className={styles.orderDate}>{order.date}</span>
                          </div>
                          <span className={`${styles.orderStatus} ${
                            order.status === 'Pending' ? styles.statusPending :
                            order.status === 'Dispatched' ? styles.statusDispatched :
                            styles.statusDelivered
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className={styles.orderBody}>
                          <div className={styles.orderMetaRow}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Estimated Sourcing Port (ETA):</span>{' '}
                              <span className={styles.orderAddress}>{order.deliveryDate}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>{' '}
                              <span className={styles.orderAddress}>{order.address}</span>
                            </div>
                          </div>

                          <table className={styles.orderItemsTable}>
                            <thead>
                              <tr>
                                <th>Specimen Variety</th>
                                <th style={{ textAlign: 'right' }}>Weight (kg)</th>
                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Sourced Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className={styles.itemNameCell}>
                                    <img src={item.image} alt={item.name} className={styles.itemImage} />
                                    <span>{item.name}</span>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} kg</td>
                                  <td style={{ textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.orderFooter} style={{ justifyContent: 'flex-end' }}>
                          <div className={styles.orderTotal}>
                            Reservation Amount: ${order.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Right Column: Profile details */}
              <section className={`${styles.profileCard} glassmorphism`}>
                <Avatar className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] shadow-[0_0_24px_rgba(56,189,248,0.4)] select-none">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                  )}
                  <AvatarFallback className="text-3xl font-extrabold text-[#030812] bg-transparent">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className={styles.profileName}>{user.name}</h3>
                <span className={styles.profileEmail}>{user.email}</span>

                <div className={styles.profileDetailRow}>
                  <span className={styles.profileDetailLabel}>Sourcing Authorization</span>
                  <span className={styles.profileDetailValue} style={{ color: 'var(--accent-cyan)' }}>Active</span>
                </div>
                <div className={styles.profileDetailRow}>
                  <span className={styles.profileDetailLabel}>Port License No</span>
                  <span className={styles.profileDetailValue}>LIC-928374-B</span>
                </div>
                <div className={styles.profileDetailRow}>
                  <span className={styles.profileDetailLabel}>Establishment Tier</span>
                  <span className={styles.profileDetailValue}>Fine Dining / Michelin</span>
                </div>
                <div className={styles.profileDetailRow}>
                  <span className={styles.profileDetailLabel}>Sustainability Commits</span>
                  <span className={styles.profileDetailValue} style={{ color: 'var(--accent-success)' }}>100% Sourced</span>
                </div>

                <button 
                  onClick={() => router.push('/')} 
                  className="btn-gold" 
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  Order Fresh Catch
                </button>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Product Add/Edit Modal Form */}
      {isProductModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsProductModalOpen(false)}>
          <div className={`${styles.modalContent} glassmorphism`} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingProduct ? 'Edit Sourcing Catch Details' : 'Land New Catch Variety'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsProductModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleProductSubmit} id="admin-product-form">
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-name">Name</label>
                  <input
                    type="text"
                    id="prod-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Pacific Oyster"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-sci-name">Scientific Name</label>
                  <input
                    type="text"
                    id="prod-sci-name"
                    value={formSciName}
                    onChange={(e) => setFormSciName(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Crassostrea gigas"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-category">Category</label>
                  <select
                    id="prod-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="Saltwater">Saltwater</option>
                    <option value="Freshwater">Freshwater</option>
                    <option value="Shellfish">Shellfish</option>
                    <option value="Premium Import">Premium Import</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-price">Price Per Kg ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="prod-price"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="luxury-input"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-category">Category</label>
                  <select
                    id="prod-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="Saltwater">Saltwater</option>
                    <option value="Freshwater">Freshwater</option>
                    <option value="Shellfish">Shellfish</option>
                    <option value="Premium Import">Premium Import</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-unit">Unit of Measurement</label>
                  <select
                    id="prod-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                    <option value="pcs">pcs (Pieces)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-price">Price Per Unit ($ / {formUnit})</label>
                  <input
                    type="number"
                    step="0.01"
                    id="prod-price"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="luxury-input"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-origin">Origin Port / Country</label>
                  <input
                    type="text"
                    id="prod-origin"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Miyagi, Japan"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-stock">Initial Stock ({formUnit})</label>
                  <input
                    type="number"
                    id="prod-stock"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="luxury-input"
                    required
                  />
                </div>
                <div className={`${styles.formGroup} styles.formGroupFull`}>
                  <label className={styles.label} htmlFor="prod-image">Image Sourcing Path</label>
                  <input
                    type="text"
                    id="prod-image"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="luxury-input"
                    placeholder="/images/bluefin_tuna.png"
                    required
                  />
                </div>
                <div className={`${styles.formGroup} styles.formGroupFull`}>
                  <label className={styles.label} htmlFor="prod-description">Description</label>
                  <textarea
                    id="prod-description"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="luxury-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Enter detailed taste and sourcing descriptions..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-taste">Taste Profile Tags (Comma Separated)</label>
                  <input
                    type="text"
                    id="prod-taste"
                    value={formTaste}
                    onChange={(e) => setFormTaste(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Sweet, Briny, Creamy"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-texture">Texture</label>
                  <input
                    type="text"
                    id="prod-texture"
                    value={formTexture}
                    onChange={(e) => setFormTexture(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Plump, velvety, delicate"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-sustainability">Sustainability Status</label>
                  <select
                    id="prod-sustainability"
                    value={formSustainability}
                    onChange={(e) => setFormSustainability(e.target.value as any)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="Wild Caught">Wild Caught</option>
                    <option value="Sustainably Farmed">Sustainably Farmed</option>
                    <option value="MSC Certified">MSC Certified</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-prep">Prep Time</label>
                  <input
                    type="text"
                    id="prod-prep"
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. 5 mins (raw) / 10 mins (grill)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-difficulty">Preparation Skill Level</label>
                  <select
                    id="prod-difficulty"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)} 
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                  id="admin-product-submit-btn"
                >
                  {editingProduct ? 'Save Changes' : 'Land Variety'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
