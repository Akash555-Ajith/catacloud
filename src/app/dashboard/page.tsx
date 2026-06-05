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
  addOrder,
  updateOrderStatus, 
  Order,
  Proposal,
  getProposals,
  addProposal,
  deleteProposal,
  CustomCatalog,
  getCustomCatalogs,
  addCustomCatalog,
  deleteCustomCatalog,
  getStoreConfig,
  saveStoreConfig,
  reseedProducts,
  getStoresOwnedByUser,
  getAllStores,
  getOrdersForBuyer,
  ProductReview,
  getReviews,
  getSourcingRequests,
  CustomSourcingRequest
} from '@/utils/store';
import { StoreConfig, SEAFOOD_PRESET, EGG_PRESET, GENERIC_PRESET } from '@/data/storeConfig';
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

  // Multi-Tenant States
  const [userStores, setUserStores] = useState<StoreConfig[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [dashboardMode, setDashboardMode] = useState<'buyer' | 'seller'>('buyer');
  
  // Onboarding Form States
  const [onboardName, setOnboardName] = useState('');
  const [onboardTagline, setOnboardTagline] = useState('');
  const [onboardNiche, setOnboardNiche] = useState('');
  const [onboardUnit, setOnboardUnit] = useState('pcs');
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [showStoreCreator, setShowStoreCreator] = useState(false);

  // Navigation / UI tabs for Admin
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'catalogs' | 'all-stores' | 'pos' | 'enquiries'>('orders');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [sourcingRequests, setSourcingRequests] = useState<CustomSourcingRequest[]>([]);
  const [globalStoreStats, setGlobalStoreStats] = useState<Record<string, { productsCount: number; ordersCount: number; proposalsCount: number }>>({});
  const [allGlobalStores, setAllGlobalStores] = useState<StoreConfig[]>([]);
  const [selectedViewStore, setSelectedViewStore] = useState<StoreConfig | null>(null);
  const [viewStoreProducts, setViewStoreProducts] = useState<FishItem[]>([]);
  const [viewStoreOrders, setViewStoreOrders] = useState<Order[]>([]);
  const [viewStoreProposals, setViewStoreProposals] = useState<CustomCatalog[]>([]);
  const [viewStoreLoading, setViewStoreLoading] = useState(false);
  const [viewStoreTab, setViewStoreTab] = useState<'info' | 'products' | 'orders' | 'proposals'>('info');

  useEffect(() => {
    if (adminTab === 'all-stores' && allGlobalStores.length > 0) {
      const statsMap: Record<string, { productsCount: number; ordersCount: number; proposalsCount: number }> = {};
      Promise.all(
        allGlobalStores.map(async (store) => {
          const storeIdKey = store.id || '';
          if (!storeIdKey) return;
          try {
            const [prods, ords, props] = await Promise.all([
              getProducts(storeIdKey),
              getOrders(storeIdKey),
              getProposals(storeIdKey)
            ]);
            statsMap[storeIdKey] = {
              productsCount: prods.length,
              ordersCount: ords.length,
              proposalsCount: props.length
            };
          } catch (e) {
            statsMap[storeIdKey] = { productsCount: 0, ordersCount: 0, proposalsCount: 0 };
          }
        })
      ).then(() => {
        setGlobalStoreStats({ ...statsMap });
      });
    }
  }, [adminTab, allGlobalStores]);

  useEffect(() => {
    if (selectedViewStore?.id) {
      setViewStoreLoading(true);
      setViewStoreTab('info');
      Promise.all([
        getProducts(selectedViewStore.id),
        getOrders(selectedViewStore.id),
        getCustomCatalogs(selectedViewStore.id)
      ]).then(([prods, ords, props]) => {
        setViewStoreProducts(prods);
        setViewStoreOrders(ords);
        setViewStoreProposals(props);
        setViewStoreLoading(false);
      }).catch((e) => {
        console.error('Failed to load store details', e);
        setViewStoreLoading(false);
      });
    } else {
      setViewStoreProducts([]);
      setViewStoreOrders([]);
      setViewStoreProposals([]);
    }
  }, [selectedViewStore]);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  
  // Store Config Form States
  const [cfgStoreName, setCfgStoreName] = useState('');
  const [cfgStoreTagline, setCfgStoreTagline] = useState('');
  const [cfgStoreType, setCfgStoreType] = useState<'seafood' | 'egg' | 'generic'>('seafood');
  const [cfgUnit, setCfgUnit] = useState('kg');
  const [cfgCategories, setCfgCategories] = useState<string[]>([]);
  const [cfgStorePhone, setCfgStorePhone] = useState('');
  const [cfgStoreAddress, setCfgStoreAddress] = useState('');
  const [cfgSpecimenLabel, setCfgSpecimenLabel] = useState('');
  const [cfgScientificNameLabel, setCfgScientificNameLabel] = useState('');
  const [cfgTasteProfileLabel, setCfgTasteProfileLabel] = useState('');
  const [cfgTextureLabel, setCfgTextureLabel] = useState('');
  const [cfgSustainabilityLabel, setCfgSustainabilityLabel] = useState('');
  const [cfgDifficultyLabel, setCfgDifficultyLabel] = useState('');

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
  
  // POS System State
  const [posCart, setPosCart] = useState<{ fish: FishItem; quantity: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('All');
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'Card' | 'Tap'>('Cash');
  const [posReceipt, setPosReceipt] = useState<Order | null>(null);

  const handleAddToPosCart = (fish: FishItem) => {
    if (fish.stock <= 0) {
      toast.error('Out of Stock', { description: `${fish.name} is currently out of stock.` });
      return;
    }
    setPosCart((prev) => {
      const idx = prev.findIndex((item) => item.fish.id === fish.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        if (newQty > fish.stock) {
          toast.warning('Stock Limit Reached', { description: `Cannot add more than ${fish.stock} available units.` });
          return prev;
        }
        next[idx].quantity = newQty;
        return next;
      }
      return [...prev, { fish, quantity: 1 }];
    });
  };

  const handleUpdatePosQuantity = (fishId: string, qty: number) => {
    if (qty <= 0) {
      setPosCart((prev) => prev.filter((item) => item.fish.id !== fishId));
      return;
    }
    const item = posCart.find((i) => i.fish.id === fishId);
    if (item && qty > item.fish.stock) {
      toast.warning('Stock Limit Reached', { description: `Only ${item.fish.stock} units are available.` });
      return;
    }
    setPosCart((prev) =>
      prev.map((item) => (item.fish.id === fishId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveFromPosCart = (fishId: string) => {
    setPosCart((prev) => prev.filter((item) => item.fish.id !== fishId));
  };

  const handleCompletePosSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    const totalPrice = posCart.reduce((sum, item) => sum + item.fish.pricePerKg * item.quantity, 0);
    const saleId = `POS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: saleId,
      userEmail: `${posCustomerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'walkin'}@pos.com`,
      userName: posCustomerName,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      deliveryDate: 'Instant (POS)',
      address: `In-Store Sales (${posPaymentMethod})`,
      items: posCart.map((item) => ({
        fishId: item.fish.id,
        name: item.fish.name,
        quantity: item.quantity,
        price: item.fish.pricePerKg,
        image: item.fish.image
      })),
      totalPrice,
      status: 'Delivered',
      store_id: activeStoreId
    };

    try {
      await addOrder(newOrder, activeStoreId);
      toast.success('Sale Completed Successfully', {
        description: `Receipt ${saleId} generated.`
      });

      // Update statistics and reload products/orders
      const [prods, ords] = await Promise.all([
        getProducts(activeStoreId),
        getOrders(activeStoreId)
      ]);
      setProducts(prods);
      setOrders(ords);

      // Keep receipt open for showing bill/invoice print view
      setPosReceipt(newOrder);
      setPosCart([]);
      setPosCustomerName('Walk-in Customer');
      setPosPaymentMethod('Cash');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register POS sale.');
    }
  };

  
  // Product form fields
  const [formName, setFormName] = useState('');
  const [formSciName, setFormSciName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formPrice, setFormPrice] = useState(0);
  const [formOrigin, setFormOrigin] = useState('');
  const [formStock, setFormStock] = useState(0);
  const [formImage, setFormImage] = useState('/images/bluefin_tuna.png');
  const [formDesc, setFormDesc] = useState('');
  const [formTaste, setFormTaste] = useState('');
  const [formTexture, setFormTexture] = useState('');
  const [formSustainability, setFormSustainability] = useState<string>('Wild Caught');
  const [formPrep, setFormPrep] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<string>('Easy');

  // 1. Initial User load
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
          // Set initial dashboard mode based on role
          setDashboardMode(parsed.role === 'admin' ? 'seller' : 'buyer');
        } catch {
          router.push('/login');
        }
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-profile-updated', loadUser);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
    };
  }, [router]);

  // 2. Load owned stores once user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      getStoresOwnedByUser(user.email).then(async (stores) => {
        let finalStores = [...stores];
        if (user.role === 'admin') {
          const hasBluefine = finalStores.some(s => s.id === 'bluefine');
          if (!hasBluefine) {
            const defaultAdminStore: StoreConfig = {
              ...SEAFOOD_PRESET,
              id: 'bluefine',
              ownerEmail: user.email.toLowerCase()
            };
            await saveStoreConfig('bluefine', defaultAdminStore);
            finalStores.unshift(defaultAdminStore);
          }
        }

        setUserStores(finalStores);
        if (finalStores.length > 0) {
          const savedActive = localStorage.getItem(`bluefine_active_store_id_${user.email}`);
          const exists = finalStores.some(s => s.id === savedActive);
          const initialStoreId = exists && savedActive ? savedActive : finalStores[0].id || 'bluefine';
          setActiveStoreId(initialStoreId);
          localStorage.setItem(`bluefine_active_store_id_${user.email}`, initialStoreId);
        } else {
          setActiveStoreId('bluefine');
          localStorage.setItem(`bluefine_active_store_id_${user.email}`, 'bluefine');
        }
      });

      if (user.role === 'admin') {
        getAllStores().then((stores) => {
          setAllGlobalStores(stores);
        });
      }
    }
  }, [isAuthenticated, user]);

  // 3. Load all dashboard data based on mode & active store
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (dashboardMode === 'buyer') {
      getOrdersForBuyer(user.email).then((ords) => {
        setOrders(ords);
      });
    } else if (dashboardMode === 'seller' && activeStoreId) {
      Promise.all([
        getProducts(activeStoreId),
        getOrders(activeStoreId),
        getProposals(activeStoreId),
        getCustomCatalogs(activeStoreId),
        getStoreConfig(activeStoreId),
        getReviews(activeStoreId),
        getSourcingRequests(activeStoreId)
      ]).then(([prods, ords, props, cats, cfg, revs, reqs]) => {
        setProducts(prods);
        setOrders(ords);
        setProposals(props);
        setCustomCatalogs(cats);
        setStoreConfig(cfg);
        setReviews(revs);
        setSourcingRequests(reqs);

        // Initialize config form fields
        setCfgStoreName(cfg.storeName);
        setCfgStoreTagline(cfg.storeTagline);
        setCfgStoreType(cfg.storeType);
        setCfgUnit(cfg.unit);
        setCfgCategories(cfg.categories);
        setCfgStorePhone(cfg.storePhone || '');
        setCfgStoreAddress(cfg.storeAddress || '');
        setCfgSpecimenLabel(cfg.attributes.specimenLabel);
        setCfgScientificNameLabel(cfg.attributes.scientificNameLabel);
        setCfgTasteProfileLabel(cfg.attributes.tasteProfileLabel);
        setCfgTextureLabel(cfg.attributes.textureLabel);
        setCfgSustainabilityLabel(cfg.attributes.sustainabilityLabel);
        setCfgDifficultyLabel(cfg.attributes.difficultyLabel);
      });
    }
    setMounted(true);
  }, [dashboardMode, activeStoreId, isAuthenticated, user]);

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
    await updateOrderStatus(orderId, status, activeStoreId);
    const ords = await getOrders(activeStoreId);
    setOrders(ords);
  };

  // Create store helper
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim() || !onboardTagline.trim() || !onboardNiche.trim() || !onboardUnit.trim()) return;

    setOnboardSubmitting(true);
    
    // Create url-friendly store slug from store name
    const storeSlug = onboardName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    // Make sure store slug is unique or append a random number
    const finalStoreId = `${storeSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanNiche = onboardNiche.toLowerCase();
    const resolvedType = cleanNiche.includes('seafood') || cleanNiche.includes('fish')
      ? 'seafood'
      : cleanNiche.includes('egg')
        ? 'egg'
        : 'generic';

    const basePreset = resolvedType === 'egg' 
      ? EGG_PRESET 
      : resolvedType === 'seafood' 
        ? SEAFOOD_PRESET 
        : GENERIC_PRESET;

    const newConfig: StoreConfig = {
      ...basePreset,
      id: finalStoreId,
      ownerEmail: user.email.toLowerCase(),
      storeName: onboardName,
      storeTagline: onboardTagline,
      storeType: resolvedType,
      unit: onboardUnit.trim(),
      categories: resolvedType === 'generic' 
        ? ['Featured', 'New Arrivals', 'Sale'] 
        : basePreset.categories
    };

    try {
      await saveStoreConfig(finalStoreId, newConfig);
      toast.success(`Store "${onboardName}" created successfully!`);

      // Reload owned stores
      const stores = await getStoresOwnedByUser(user.email);
      let finalStores = [...stores];
      if (user.role === 'admin') {
        const hasBluefine = finalStores.some(s => s.id === 'bluefine');
        if (!hasBluefine) {
          const defaultAdminStore: StoreConfig = {
            ...SEAFOOD_PRESET,
            id: 'bluefine',
            ownerEmail: user.email.toLowerCase()
          };
          finalStores.unshift(defaultAdminStore);
        }
      }
      setUserStores(finalStores);

      if (user.role === 'admin') {
        getAllStores().then((allStores) => {
          setAllGlobalStores(allStores);
        });
      }
      
      // Set as active store
      setActiveStoreId(finalStoreId);
      localStorage.setItem(`bluefine_active_store_id_${user.email}`, finalStoreId);
      
      // Reset forms & close wizard
      setOnboardName('');
      setOnboardTagline('');
      setOnboardNiche('');
      setOnboardUnit('pcs');
      setShowStoreCreator(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create store.');
    } finally {
      setOnboardSubmitting(false);
    }
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
      setFormUnit(product.unit || storeConfig.unit);
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormSciName('');
      setFormCategory(storeConfig.categories[0] || 'Saltwater');
      setFormPrice(15.0);
      setFormOrigin('');
      setFormStock(20);
      // Randomly pick one of the default beautiful images
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
      setFormUnit(storeConfig.unit);
    }
    setIsProductModalOpen(true);
  };

  // Configuration settings handlers
  const handleApplyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: StoreConfig = {
      id: activeStoreId,
      ownerEmail: user.email.toLowerCase(),
      storeName: cfgStoreName,
      storeTagline: cfgStoreTagline,
      storeType: cfgStoreType,
      unit: cfgUnit,
      categories: cfgCategories,
      storePhone: cfgStorePhone,
      storeAddress: cfgStoreAddress,
      attributes: {
        specimenLabel: cfgSpecimenLabel,
        scientificNameLabel: cfgScientificNameLabel,
        tasteProfileLabel: cfgTasteProfileLabel,
        textureLabel: cfgTextureLabel,
        sustainabilityLabel: cfgSustainabilityLabel,
        difficultyLabel: cfgDifficultyLabel
      }
    };

    await saveStoreConfig(activeStoreId, updatedConfig);
    setStoreConfig(updatedConfig);
    toast.success('Configuration Saved', {
      description: 'Store parameters have been successfully updated.'
    });
  };

  const handlePresetChange = (presetType: 'seafood' | 'egg' | 'generic') => {
    let preset: StoreConfig;
    if (presetType === 'seafood') preset = SEAFOOD_PRESET;
    else if (presetType === 'egg') preset = EGG_PRESET;
    else preset = GENERIC_PRESET;

    setCfgStoreName(preset.storeName);
    setCfgStoreTagline(preset.storeTagline);
    setCfgStoreType(preset.storeType);
    setCfgUnit(preset.unit);
    setCfgCategories(preset.categories);
    setCfgStorePhone(preset.storePhone || '');
    setCfgStoreAddress(preset.storeAddress || '');
    setCfgSpecimenLabel(preset.attributes.specimenLabel);
    setCfgScientificNameLabel(preset.attributes.scientificNameLabel);
    setCfgTasteProfileLabel(preset.attributes.tasteProfileLabel);
    setCfgTextureLabel(preset.attributes.textureLabel);
    setCfgSustainabilityLabel(preset.attributes.sustainabilityLabel);
    setCfgDifficultyLabel(preset.attributes.difficultyLabel);
  };

  const handleReseed = async () => {
    if (confirm('Warning: Reseeding will clear the existing database inventory and replace it with default items for this store preset. Do you want to continue?')) {
      const seeded = await reseedProducts(cfgStoreType, activeStoreId);
      setProducts(seeded);
      toast.success('Database Reseeded', {
        description: `Catalog has been reseeded with default ${cfgStoreType} items.`
      });
    }
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
      await updateProduct(productData, activeStoreId);
    } else {
      await addProduct(productData, activeStoreId);
    }

    const prods = await getProducts(activeStoreId);
    setProducts(prods);
    setIsProductModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product from the inventory catalogue?')) {
      await deleteProduct(id, activeStoreId);
      const prods = await getProducts(activeStoreId);
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
      overrides: overridesToSave,
      store_id: activeStoreId
    };

    await addCustomCatalog(newCatalog, activeStoreId);
    const cats = await getCustomCatalogs(activeStoreId);
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
      await deleteCustomCatalog(id, activeStoreId);
      const cats = await getCustomCatalogs(activeStoreId);
      setCustomCatalogs(cats);
    }
  };

  const handleCopyCatalogLink = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/catalogue/${id}?store=${activeStoreId}`;
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
        storeId={activeStoreId || 'bluefine'}
      />

      <main className={styles.container}>
        {/* Global Dashboard Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '12px 24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }} className="glassmorphism">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Account Type:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              {user.role === 'admin' ? 'Administrator' : 'Business Partner'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setDashboardMode('buyer')}
              className={`${styles.tabBtn}`}
              style={{
                background: dashboardMode === 'buyer' ? 'var(--accent-gold)' : 'transparent',
                color: dashboardMode === 'buyer' ? '#030812' : 'var(--text-secondary)',
                border: dashboardMode === 'buyer' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🛒 Buyer Panel
            </button>
            <button
              onClick={() => setDashboardMode('seller')}
              className={`${styles.tabBtn}`}
              style={{
                background: dashboardMode === 'seller' ? 'var(--accent-cyan)' : 'transparent',
                color: dashboardMode === 'seller' ? '#030812' : 'var(--text-secondary)',
                border: dashboardMode === 'seller' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              💼 Store Manager
            </button>
          </div>
        </div>

        {/* Display Seller Dashboard or Onboarding Form */}
        {dashboardMode === 'seller' ? (
          showStoreCreator ? (
            /* Onboarding Store Creator Wizard */
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', width: '100%' }}>
              <div className="glassmorphism" style={{ maxWidth: '600px', width: '100%', padding: '32px', borderRadius: '16px', border: '1px solid var(--accent-gold)' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>Create Your Business Store</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', fontSize: '0.95rem' }}>
                  Set up your niche product catalog, define your categories, units, and custom labels. Select a preset below to get started instantly.
                </p>
                
                <form onSubmit={handleCreateStore}>
                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={styles.label} htmlFor="onboard-name">Business Store Name</label>
                    <input
                      type="text"
                      id="onboard-name"
                      value={onboardName}
                      onChange={(e) => setOnboardName(e.target.value)}
                      placeholder="e.g. Sunrise Organic Eggs, Golden Crust Bakery"
                      className="luxury-input"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={styles.label} htmlFor="onboard-tagline">Tagline / Slogan</label>
                    <input
                      type="text"
                      id="onboard-tagline"
                      value={onboardTagline}
                      onChange={(e) => setOnboardTagline(e.target.value)}
                      placeholder="e.g. Fresh Pasture-Raised Farm Goods"
                      className="luxury-input"
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={styles.label} htmlFor="onboard-niche">Store Niche / Category Type</label>
                    <input
                      type="text"
                      id="onboard-niche"
                      value={onboardNiche}
                      onChange={(e) => setOnboardNiche(e.target.value)}
                      placeholder="e.g. Dairy, Electronics, Clothes, Seafood, Eggs"
                      className="luxury-input"
                      required
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                    <label className={styles.label} htmlFor="onboard-unit">Primary Unit of Measurement</label>
                    <input
                      type="text"
                      id="onboard-unit"
                      value={onboardUnit}
                      onChange={(e) => setOnboardUnit(e.target.value)}
                      placeholder="e.g. pcs, kg, litre, box, dozen"
                      className="luxury-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    {userStores.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowStoreCreator(false)}
                        className="btn-gold"
                        style={{ flex: 1, height: '48px', fontSize: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={onboardSubmitting}
                      className="btn-gold"
                      style={{ flex: 2, height: '48px', fontSize: '1rem' }}
                    >
                      {onboardSubmitting ? 'Establishing Hub...' : 'Establish Sourcing Hub'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Active Store Manager Dashboard */
            <div>
              <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h1 className={styles.title}>Inventory Manager Panel</h1>
                  <span className={styles.titleHighlight}>{storeConfig.storeName} &bull; {storeConfig.storeTagline}</span>
                </div>
                
                {/* Store Switcher Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {userStores.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label htmlFor="store-select" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Store:</label>
                      <select
                        id="store-select"
                        value={activeStoreId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setActiveStoreId(newId);
                          localStorage.setItem(`bluefine_active_store_id_${user.email}`, newId);
                          toast.info(`Switched active store context to "${userStores.find(s => s.id === newId)?.storeName}"`);
                        }}
                        style={{
                          background: '#0a1424',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-primary)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {userStores.map(store => (
                          <option key={store.id} value={store.id}>{store.storeName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={() => setShowStoreCreator(true)}
                    className="btn-gold"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', height: '36px' }}
                  >
                    + New Store
                  </button>
                </div>
              </header>

              {/* Shareable Link Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shareable Buyer Link:</span>
                  <code style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/?store=${activeStoreId}` : `/?store=${activeStoreId}`}
                  </code>
                </div>
                <button
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/?store=${activeStoreId}` : `/?store=${activeStoreId}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Store catalog link copied to clipboard!');
                  }}
                  className="btn-gold"
                  style={{ padding: '4px 12px', fontSize: '0.75rem', height: '28px' }}
                >
                  Copy Link
                </button>
              </div>

            {/* Admin Stats Row */}
            <section className={styles.statsGrid}>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>{storeConfig.attributes.specimenLabel} Varieties</span>
                <span className={styles.statValue}>{products.length}</span>
                <span className={styles.statSubtext}>Active in catalogue</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Available Stock</span>
                <span className={styles.statValue}>{adminTotalStock} <span style={{ fontSize: '1.2rem' }}>{storeConfig.unit}</span></span>
                <span className={styles.statSubtext}>
                  {storeConfig.storeType === 'seafood' ? 'Across Tsukiji / North Atlantic ports' : 'Across regional distribution centers'}
                </span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Active Shipments</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>{adminActiveOrders}</span>
                <span className={styles.statSubtext}>Pending or Dispatched</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <span className={styles.statLabel}>Total Sourced Value</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-gold)' }}>${adminTotalRevenue.toFixed(2)}</span>
                <span className={styles.statSubtext}>Orders from all partner Buyers</span>
              </div>
            </section>

            {/* Tab Controllers */}
            <div className={styles.tabContainer}>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setAdminTab('all-stores')}
                  className={`${styles.tabBtn} ${adminTab === 'all-stores' ? styles.tabBtnActive : ''}`}
                  id="admin-tab-all-stores"
                >
                  Global Stores Directory ({allGlobalStores.length})
                </button>
              )}
              <button 
                onClick={() => setAdminTab('orders')}
                className={`${styles.tabBtn} ${adminTab === 'orders' ? styles.tabBtnActive : ''}`}
                id="admin-tab-orders"
              >
                Logistics & Orders ({orders.length})
              </button>
              <button 
                onClick={() => setAdminTab('pos')}
                className={`${styles.tabBtn} ${adminTab === 'pos' ? styles.tabBtnActive : ''}`}
                id="admin-tab-pos"
              >
                ⚡ Sell Products (POS)
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
                Custom Proposals ({customCatalogs.length})
              </button>


              <button 
                onClick={() => setAdminTab('enquiries')}
                className={`${styles.tabBtn} ${adminTab === 'enquiries' ? styles.tabBtnActive : ''}`}
                id="admin-tab-enquiries"
              >
                🙋 Enquiries ({sourcingRequests.length})
              </button>
            </div>

            {/* Global Stores Directory Section */}
            {adminTab === 'all-stores' && user?.role === 'admin' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Global Stores Directory</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Below is the master list of all business stores created by platform users. As an Administrator, you can view metrics, view store detail parameters, or copy buyer catalog links.
                </p>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Store Details</th>
                        <th>Owner Email</th>
                        <th>Niche & Type</th>
                        <th>Unit</th>
                        <th>Inventory Items</th>
                        <th>Orders</th>
                        <th>Proposals</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allGlobalStores.map((store) => {
                        const storeIdKey = store.id || '';
                        const stats = globalStoreStats[storeIdKey] || { productsCount: 0, ordersCount: 0, proposalsCount: 0 };
                        return (
                          <tr key={storeIdKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{store.storeName}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {storeIdKey}</span>
                              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontStyle: 'italic' }}>{store.storeTagline}</span>
                            </td>
                            <td>
                              <code style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>{store.ownerEmail || 'system'}</code>
                            </td>
                            <td>
                              <span style={{ 
                                textTransform: 'capitalize', 
                                background: 'rgba(0, 242, 254, 0.1)', 
                                border: '1px solid rgba(0, 242, 254, 0.2)', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.8rem',
                                color: 'var(--accent-cyan)'
                              }}>
                                {store.storeType}
                              </span>
                            </td>
                            <td>
                              <code style={{ color: 'var(--text-secondary)' }}>{store.unit}</code>
                            </td>
                            <td>{stats.productsCount} items</td>
                            <td>{stats.ordersCount} requests</td>
                            <td>{stats.proposalsCount} proposals</td>
                            <td>
                              <div className={styles.actionButtons} style={{ justifyContent: 'center', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedViewStore(store);
                                  }}
                                  className="btn-gold"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                >
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Orders Logistics Section */}
            {adminTab === 'orders' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Partner Sourcing Requests</h2>
                {orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg className={styles.emptyStateIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <p>No sourcing orders recorded in history.</p>
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
                              <span style={{ color: 'var(--text-muted)' }}>Account Name:</span>{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>{order.userName}</strong> ({order.userEmail})
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>ETA Delivery:</span>{' '}
                              <span className={styles.orderAddress}>{order.deliveryDate}</span>
                            </div>
                          </div>
                          <div className={styles.orderMetaRow} style={{ marginBottom: '24px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>{' '}
                              <span className={styles.orderAddress}>{order.address}</span>
                            </div>
                          </div>

                          <table className={styles.orderItemsTable}>
                            <thead>
                              <tr>
                                <th>Sourced Product</th>
                                <th style={{ textAlign: 'right' }}>Quantity ({storeConfig.unit})</th>
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
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {storeConfig.unit}</td>
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

            {/* POS Point of Sale Section */}
            {adminTab === 'pos' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>⚡ Point of Sale (POS) & Billing</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                  Register direct in-store sales, customize client billing names, and automatically deduct sourced quantities from active catalogue inventory stocks.
                </p>

                {posReceipt && (
                  <div className="glassmorphism" style={{ border: '2px solid var(--accent-gold)', borderRadius: '16px', padding: '24px', marginBottom: '32px', background: 'rgba(226, 183, 68, 0.03)', position: 'relative' }}>
                    <button 
                      onClick={() => setPosReceipt(null)}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      &times;
                    </button>
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
                      <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', fontFamily: 'var(--font-playfair), serif', margin: '0 0 4px 0' }}>{storeConfig.storeName}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Billing Invoice</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span> <strong style={{ color: 'var(--text-primary)' }}>{posReceipt.id}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Date:</span> <strong style={{ color: 'var(--text-primary)' }}>{posReceipt.date}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Client:</span> <strong style={{ color: 'var(--text-primary)' }}>{posReceipt.userName}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Method:</span> <strong style={{ color: 'var(--accent-cyan)' }}>{posReceipt.address.replace('In-Store Sales (', '').replace(')', '')}</strong>
                      </div>
                    </div>

                    <table className={styles.orderItemsTable} style={{ margin: '16px 0' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Price</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posReceipt.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {storeConfig.unit}</td>
                            <td style={{ textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '16px' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>{' '}
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${posReceipt.totalPrice.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Taxes & Levies:</span>{' '}
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>Included</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '8px' }}>
                        <span>Total Bill Amount:</span>{' '}
                        <span>${posReceipt.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button 
                        onClick={() => window.print()}
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        🖨️ Print Bill Invoice
                      </button>
                      <button 
                        onClick={() => setPosReceipt(null)}
                        className="btn-gold"
                        style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem' }}
                      >
                        Create New POS Sale
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.splitLayout} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
                  {/* Left Column: POS Catalog List */}
                  <div className="glassmorphism" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <input 
                        type="text"
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        placeholder="Search POS items..."
                        className="luxury-input"
                        style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                      />
                      <select 
                        value={posCategory}
                        onChange={(e) => setPosCategory(e.target.value)}
                        className="luxury-input"
                        style={{ width: '150px', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}
                      >
                        <option value="All">All Categories</option>
                        {storeConfig.categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {products.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No inventory available to sell. Go to <strong>Catalogue Inventory</strong> to add items.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                        {products
                          .filter((p) => {
                            const matchCat = posCategory === 'All' || p.category === posCategory;
                            const matchSearch = p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                              p.scientificName.toLowerCase().includes(posSearch.toLowerCase());
                            return matchCat && matchSearch;
                          })
                          .map((p) => (
                            <div 
                              key={p.id} 
                              className="glassmorphism" 
                              style={{ 
                                padding: '12px', 
                                borderRadius: '10px', 
                                border: '1px solid var(--glass-border)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                opacity: p.stock <= 0 ? 0.5 : 1
                              }}
                            >
                              <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {p.stock <= 0 && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    Out of Stock
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0', lineBreak: 'anywhere' }}>{p.name}</h4>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>{p.scientificName}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                  ${p.pricePerKg.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: p.stock < 10 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                                  Stock: <strong>{p.stock}</strong>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleAddToPosCart(p)}
                                disabled={p.stock <= 0}
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '10px', height: '28px', fontSize: '0.75rem', padding: '0' }}
                              >
                                + Add to Sale
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: POS Cart Drawer Panel */}
                  <div className="glassmorphism" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      Cart Bill Breakdown
                    </h3>

                    {posCart.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span>🛒 POS Cart is Empty</span>
                        <span style={{ fontSize: '0.75rem' }}>Select products on the left to start a billing session.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
                        {posCart.map((item) => (
                          <div key={item.fish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.fish.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.fish.pricePerKg.toFixed(2)} / {item.fish.unit || storeConfig.unit}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                              <button 
                                type="button"
                                onClick={() => handleUpdatePosQuantity(item.fish.id, item.quantity - 1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => handleUpdatePosQuantity(item.fish.id, item.quantity + 1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                +
                              </button>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>${(item.fish.pricePerKg * item.quantity).toFixed(2)}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFromPosCart(item.fish.id)}
                                style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className={styles.formGroup} style={{ marginBottom: '4px' }}>
                        <label className={styles.label} style={{ fontSize: '0.75rem' }}>Billing Client Name</label>
                        <input 
                          type="text" 
                          value={posCustomerName}
                          onChange={(e) => setPosCustomerName(e.target.value)}
                          className="luxury-input"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          required
                        />
                      </div>

                      <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                        <label className={styles.label} style={{ fontSize: '0.75rem' }}>Payment Method</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {(['Cash', 'Card', 'Tap'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPosPaymentMethod(method)}
                              style={{
                                height: '32px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderColor: posPaymentMethod === method ? 'var(--accent-cyan)' : 'var(--glass-border)',
                                color: posPaymentMethod === method ? '#030812' : 'var(--text-secondary)',
                                background: posPaymentMethod === method ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.01)'
                              }}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Bill Amount:</span>
                        <strong style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>
                          ${posCart.reduce((sum, item) => sum + item.fish.pricePerKg * item.quantity, 0).toFixed(2)}
                        </strong>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => handleCompletePosSale(e)}
                        disabled={posCart.length === 0}
                        className="btn-cyan" 
                        style={{ width: '100%', height: '40px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}
                      >
                        🧾 Complete POS Sale & Bill
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Products Inventory Section */}
            {adminTab === 'products' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <div className={styles.sectionTitle}>
                  <span>Inventory Catalog</span>
                  <button 
                    onClick={() => handleOpenProductModal(null)} 
                    className="btn-primary" 
                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                    id="admin-add-product-btn"
                  >
                    + Add Product
                  </button>
                </div>

                <div className={styles.productsTableWrapper}>
                  <table className={styles.productsTable}>
                    <thead>
                      <tr>
                        <th>{storeConfig.attributes.specimenLabel}</th>
                        <th>Category</th>
                        <th>Price / Unit</th>
                        <th>Current Stock</th>
                        <th>Origin</th>
                        <th>{storeConfig.attributes.sustainabilityLabel}</th>
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
                          <td style={{ fontWeight: 600 }}>${prod.pricePerKg.toFixed(2)} / {prod.unit || storeConfig.unit}</td>
                          <td style={{ color: prod.stock < 10 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                            <strong>{prod.stock}</strong> {prod.unit || storeConfig.unit}
                            {prod.stock < 10 && <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--accent-danger)' }}>Low Stock</span>}
                          </td>
                          <td>{prod.origin}</td>
                          <td style={{ fontSize: '0.85rem' }}>{prod.sustainability}</td>
                          <td>
                            <div className={styles.actionButtons} style={{ justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleOpenProductModal(prod)}
                                className={styles.btnIcon}
                                title="Edit Product Details"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className={`${styles.btnIcon} ${styles.btnIconDelete}`}
                                title="Delete Product"
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
                        Configure Product Overrides
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Selected: <strong style={{ color: 'var(--accent-cyan)' }}>{Object.values(catOverrides).filter(o => o.included).length}</strong> / {products.length} items
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
                          placeholder="Search overrides by name, code, or origin..."
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
                          {storeConfig.categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className={styles.productsTableWrapper} style={{ marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                    <table className={styles.productsTable}>
                      <thead>
                        <tr>
                          <th style={{ width: '80px', textAlign: 'center' }}>Include</th>
                          <th>{storeConfig.attributes.specimenLabel} Name</th>
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
                              <td>${p.pricePerKg.toFixed(2)}/{p.unit || storeConfig.unit}</td>
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
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{p.unit || storeConfig.unit}</span>
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
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.unit || storeConfig.unit}</span>
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
                          <th>Included Items</th>
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
                              <td>{includedCount} of {products.length} items</td>
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





            {adminTab === 'enquiries' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>Client Sourcing Enquiries</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Incoming custom requests from clients requesting products or quantities not listed in active catalogs.
                </p>
                {sourcingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>🙋</span>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No sourcing requests</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enquiries submitted on the client catalogue pages will appear here.</p>
                  </div>
                ) : (
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Client Partner</th>
                          <th>Product Requested</th>
                          <th>Requested Qty</th>
                          <th>Requirements & Specifications</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sourcingRequests.map((req) => (
                          <tr key={req.id}>
                            <td>
                              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{req.clientName}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.clientEmail}</span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{req.productName}</span>
                              {req.productId && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {req.productId}</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ color: 'var(--accent-gold)' }}>{req.requestedQuantity}</strong> {storeConfig.unit}
                            </td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {req.notes}
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {req.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )
      ) : (
          /* Chef / User Dashboard */
          <div>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>Sourcing Dashboard</h1>
                <span className={styles.titleHighlight}>{storeConfig.storeName} Buyer Hub</span>
              </div>
            </header>

            {/* Chef Stats Row */}
            <section className={styles.statsGrid}>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sourced Quantity</span>
                <span className={styles.statValue}>{totalWeightSourced} <span style={{ fontSize: '1.2rem' }}>{storeConfig.unit}</span></span>
                <span className={styles.statSubtext}>{storeConfig.storeType === 'seafood' ? 'Premium marine species' : 'Premium products'}</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sourcing Investment</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>${totalSourcingValue.toFixed(2)}</span>
                <span className={styles.statSubtext}>Total catalog investment</span>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <span className={styles.statLabel}>Sustainability Profile</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-success)' }}>{sustainabilityScore}</span>
                <span className={styles.statSubtext}>Ethical sourcing</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <span className={styles.statLabel}>Account Tier</span>
                <span className={styles.statValue} style={{ color: 'var(--accent-gold)', fontSize: '1.6rem' }}>
                  {totalSourcingValue > 1000 ? 'Elite Member' : totalSourcingValue > 500 ? 'Preferred Partner' : 'General Partner'}
                </span>
                <span className={styles.statSubtext}>Account tier status</span>
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
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Sourced Items Yet</h3>
                    <p style={{ marginBottom: '24px' }}>Submit a procurement reservation in our catalog.</p>
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
                              <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery (ETA):</span>{' '}
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
                                <th>Product Item</th>
                                <th style={{ textAlign: 'right' }}>Quantity ({storeConfig.unit})</th>
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
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {storeConfig.unit}</td>
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
                {editingProduct ? `Edit ${storeConfig.attributes.specimenLabel} Details` : `Add New ${storeConfig.attributes.specimenLabel}`}
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
                  <label className={styles.label} htmlFor="prod-name">Name / Type</label>
                  <input
                    type="text"
                    id="prod-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Free-Range Large Brown Eggs"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-sci-name">{storeConfig.attributes.scientificNameLabel}</label>
                  <input
                    type="text"
                    id="prod-sci-name"
                    value={formSciName}
                    onChange={(e) => setFormSciName(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Grade AA Large"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-category">Category</label>
                  <select
                    id="prod-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    {storeConfig.categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-unit">Unit of Measurement</label>
                  <input
                    type="text"
                    id="prod-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. kg, dozen, pcs"
                    required
                  />
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
                  <label className={styles.label} htmlFor="prod-origin">Origin / Source</label>
                  <input
                    type="text"
                    id="prod-origin"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Sunshine Valley Farms"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-stock">Current Stock ({formUnit})</label>
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
                  <label className={styles.label} htmlFor="prod-image">Image Path or URL</label>
                  <input
                    type="text"
                    id="prod-image"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="luxury-input"
                    placeholder="https://images.unsplash.com/... or /images/..."
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
                    placeholder="Enter detailed description..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-taste">{storeConfig.attributes.tasteProfileLabel} (Comma Separated)</label>
                  <input
                    type="text"
                    id="prod-taste"
                    value={formTaste}
                    onChange={(e) => setFormTaste(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Pasture Raised, Organic Feed"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-texture">{storeConfig.attributes.textureLabel}</label>
                  <input
                    type="text"
                    id="prod-texture"
                    value={formTexture}
                    onChange={(e) => setFormTexture(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Deep orange yolk"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-sustainability">{storeConfig.attributes.sustainabilityLabel}</label>
                  <input
                    type="text"
                    id="prod-sustainability"
                    value={formSustainability}
                    onChange={(e) => setFormSustainability(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Free-Range"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-prep">
                    {storeConfig.storeType === 'seafood' ? 'Prep Time' : 'Handling / Storage'}
                  </label>
                  <input
                    type="text"
                    id="prod-prep"
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Keep refrigerated (3-5°C)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="prod-difficulty">
                    {storeConfig.storeType === 'seafood' ? 'Preparation Skill Level' : 'Care Level'}
                  </label>
                  <input
                    type="text"
                    id="prod-difficulty"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Easy"
                  />
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
                  {editingProduct ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read-Only View Store Details Modal (Visible only to Admin) */}
      {selectedViewStore && (
        <div 
          className={styles.modalBackdrop}
          onClick={() => setSelectedViewStore(null)}
          style={{ zIndex: 300 }}
        >
          <div 
            className={`${styles.modalContent} glassmorphism`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-gold)' }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle} style={{ color: 'var(--accent-gold)' }}>Store Config Details</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Read-Only Inspection &bull; Owner: <code style={{ color: 'var(--accent-cyan)' }}>{selectedViewStore.ownerEmail}</code>
                </span>
              </div>
              <button 
                onClick={() => setSelectedViewStore(null)}
                className={styles.closeBtn}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div className={styles.tabContainer} style={{ marginTop: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                type="button"
                onClick={() => setViewStoreTab('info')}
                className={`${styles.tabBtn} ${viewStoreTab === 'info' ? styles.tabBtnActive : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                ℹ️ Store Info & Config
              </button>
              <button 
                type="button"
                onClick={() => setViewStoreTab('products')}
                className={`${styles.tabBtn} ${viewStoreTab === 'products' ? styles.tabBtnActive : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                📦 Products ({viewStoreProducts.length})
              </button>
              <button 
                type="button"
                onClick={() => setViewStoreTab('orders')}
                className={`${styles.tabBtn} ${viewStoreTab === 'orders' ? styles.tabBtnActive : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                📋 Orders ({viewStoreOrders.length})
              </button>
              <button 
                type="button"
                onClick={() => setViewStoreTab('proposals')}
                className={`${styles.tabBtn} ${viewStoreTab === 'proposals' ? styles.tabBtnActive : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                💼 Proposals ({viewStoreProposals.length})
              </button>
            </div>

            {viewStoreLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading store details...
              </div>
            ) : (
              <>
                {/* 1. INFO TAB */}
                {viewStoreTab === 'info' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Store Name</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedViewStore.storeName}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Store Tagline</span>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{selectedViewStore.storeTagline}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Store ID / Slug</span>
                        <code style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>{selectedViewStore.id}</code>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Niche & Store Type</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedViewStore.storeType}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Measurement Unit</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.unit}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Defined Categories</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedViewStore.categories?.join(', ') || 'None'}</span>
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--accent-gold)', marginBottom: '12px', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Attributes Labels</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specimen / Product Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.specimenLabel || 'Specimen'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scientific / Grade Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.scientificNameLabel || 'Scientific Name'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taste Profile Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.tasteProfileLabel || 'Taste Profile'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Texture / Core Feature Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.textureLabel || 'Texture'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sustainability / Sourcing Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.sustainabilityLabel || 'Sustainability'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preparation / Difficulty Label</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedViewStore.attributes?.difficultyLabel || 'Preparation Difficulty'}</span>
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--accent-gold)', marginBottom: '12px', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Statistics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                      <div className={styles.statCard} style={{ padding: '16px' }}>
                        <span className={styles.statLabel}>Products Uploaded</span>
                        <span className={styles.statValue} style={{ fontSize: '1.5rem' }}>{viewStoreProducts.length}</span>
                      </div>
                      <div className={styles.statCard} style={{ padding: '16px' }}>
                        <span className={styles.statLabel}>Total Orders</span>
                        <span className={styles.statValue} style={{ fontSize: '1.5rem' }}>{viewStoreOrders.length}</span>
                      </div>
                      <div className={styles.statCard} style={{ padding: '16px' }}>
                        <span className={styles.statLabel}>Total Proposals</span>
                        <span className={styles.statValue} style={{ fontSize: '1.5rem' }}>{viewStoreProposals.length}</span>
                      </div>
                      <div className={styles.statCard} style={{ padding: '16px', border: '1px solid var(--accent-gold)' }}>
                        <span className={styles.statLabel}>Accumulated Revenue</span>
                        <span className={styles.statValue} style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>
                          ${viewStoreOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS TAB */}
                {viewStoreTab === 'products' && (
                  <div>
                    {viewStoreProducts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        No inventory items uploaded by user.
                      </div>
                    ) : (
                      <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>{selectedViewStore.attributes?.specimenLabel || 'Product Details'}</th>
                              <th>{selectedViewStore.attributes?.scientificNameLabel || 'Grade'}</th>
                              <th>Category</th>
                              <th>Price / Unit</th>
                              <th>Current Stock</th>
                              <th>Origin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewStoreProducts.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <div className={styles.productNameCell}>
                                    <img src={p.image} alt={p.name} className={styles.productImg} style={{ width: '32px', height: '32px' }} />
                                    <div>
                                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.name}</strong>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={styles.productScientificName} style={{ fontSize: '0.8rem' }}>{p.scientificName}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.category}</span>
                                </td>
                                <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                  ${p.pricePerKg.toFixed(2)} / {p.unit || selectedViewStore.unit}
                                </td>
                                <td style={{ fontSize: '0.85rem', color: p.stock < 10 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                                  <strong>{p.stock}</strong> {p.unit || selectedViewStore.unit}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{p.origin}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ORDERS TAB */}
                {viewStoreTab === 'orders' && (
                  <div>
                    {viewStoreOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        No orders recorded for this store.
                      </div>
                    ) : (
                      <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Buyer Details</th>
                              <th>Total Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewStoreOrders.map((o) => (
                              <tr key={o.id}>
                                <td>
                                  <code style={{ color: 'var(--accent-cyan)' }}>{o.id}</code>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{o.date}</td>
                                <td>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.userName}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.userEmail}</div>
                                </td>
                                <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                                  ${(o.totalPrice || 0).toFixed(2)}
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    background: o.status === 'Delivered' ? 'rgba(0, 230, 115, 0.15)' : o.status === 'Dispatched' ? 'rgba(0, 180, 216, 0.15)' : 'rgba(255, 179, 0, 0.15)',
                                    color: o.status === 'Delivered' ? '#00e673' : o.status === 'Dispatched' ? '#00b4d8' : '#ffb300'
                                  }}>
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PROPOSALS TAB */}
                {viewStoreTab === 'proposals' && (
                  <div>
                    {viewStoreProposals.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        No proposals created for this store.
                      </div>
                    ) : (
                      <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Proposal ID</th>
                              <th>Target Client</th>
                              <th>Discount</th>
                              <th>Delivery Fee</th>
                              <th>Created Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewStoreProposals.map((cat) => (
                              <tr key={cat.id}>
                                <td>
                                  <code style={{ color: 'var(--accent-cyan)' }}>{cat.id}</code>
                                </td>
                                <td>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{cat.marketName}</strong>
                                </td>
                                <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                                  {cat.globalDiscount}%
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                  ${cat.globalDelivery.toFixed(2)}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{cat.createdDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                type="button" 
                onClick={() => setSelectedViewStore(null)} 
                className="btn-gold"
                style={{ padding: '10px 24px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
