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
  deleteStore,
  getStoresOwnedByUser,
  getOrdersForBuyer,
  ProductReview,
  getReviews,
  getSourcingRequests,
  CustomSourcingRequest,
  saveProducts,
  saveProposals,
  saveCustomCatalogs
} from '@/utils/store';
import { StoreConfig, SEAFOOD_PRESET, EGG_PRESET, GENERIC_PRESET, CLOTHING_PRESET } from '@/data/storeConfig';
import Navbar from '@/components/Navbar';
import styles from './dashboard.module.css';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';
import { TrendingUp, DollarSign, Award, Target, Plus, CheckCircle, Package, Clock, Users, ArrowUpRight, ShoppingBag, Eye, Settings, FileText, ChevronRight, Activity, ShieldCheck, ShoppingCart, LayoutDashboard, Bell, HelpCircle, Search, CreditCard, MessageSquare, Star, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as XLSX from 'xlsx';

const isBrowser = () => typeof window !== 'undefined';

const IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'>No Image</text></svg>";

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
  const [adminTab, setAdminTab] = useState<'dashboard' | 'products' | 'enquiries' | 'pwa' | 'settings' | 'catalogs' | 'orders'>('dashboard');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [sourcingRequests, setSourcingRequests] = useState<CustomSourcingRequest[]>([]);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  
  // Store Config Form States
  const [cfgStoreName, setCfgStoreName] = useState('');
  const [cfgStoreTagline, setCfgStoreTagline] = useState('');
  const [cfgStoreType, setCfgStoreType] = useState<'seafood' | 'egg' | 'generic' | 'clothing'>('seafood');
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
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState<boolean>(false);
  const [catOverrides, setCatOverrides] = useState<{
    [id: string]: { price: number; stock: number; discount: number; threshold: number; volumeDiscount: number; included: boolean };
  }>({});
  const [formUnit, setFormUnit] = useState('kg');

  // Modal / Form states for product management
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<FishItem | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkCSVText, setBulkCSVText] = useState<string>('');
  
  // PWA System State
  const [pwaCart, setPwaCart] = useState<{ fish: FishItem; quantity: number }[]>([]);
  const [pwaSearch, setPwaSearch] = useState('');
  const [pwaCategory, setPwaCategory] = useState('All');
  const [pwaCustomerName, setPwaCustomerName] = useState('Walk-in Customer');
  const [pwaPaymentMethod, setPwaPaymentMethod] = useState<'Cash' | 'Card' | 'Tap'>('Cash');
  const [pwaReceipt, setPwaReceipt] = useState<Order | null>(null);
  const [pwaTab, setPwaTab] = useState<'all' | 'custom'>('all');
  const [pwaIsOffline, setPwaIsOffline] = useState<boolean>(false);
  const [pwaSyncQueue, setPwaSyncQueue] = useState<Order[]>([]);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [pwaIsInstalled, setPwaIsInstalled] = useState<boolean>(false);

  const handleAddToPwaCart = (fish: FishItem) => {
    if (fish.stock <= 0) {
      toast.error('Out of Stock', { description: `${fish.name} is currently out of stock.` });
      return;
    }
    setPwaCart((prev) => {
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

  const handleUpdatePwaQuantity = (fishId: string, qty: number) => {
    if (qty <= 0) {
      setPwaCart((prev) => prev.filter((item) => item.fish.id !== fishId));
      return;
    }
    const item = pwaCart.find((i) => i.fish.id === fishId);
    if (item && qty > item.fish.stock) {
      toast.warning('Stock Limit Reached', { description: `Only ${item.fish.stock} units are available.` });
      return;
    }
    setPwaCart((prev) =>
      prev.map((item) => (item.fish.id === fishId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveFromPwaCart = (fishId: string) => {
    setPwaCart((prev) => prev.filter((item) => item.fish.id !== fishId));
  };

  const handleCompletePwaSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwaCart.length === 0) return;

    const totalPrice = pwaCart.reduce((sum, item) => sum + item.fish.pricePerKg * item.quantity, 0);
    const saleId = `PWA-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: saleId,
      userEmail: `${pwaCustomerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'walkin'}@pwa.com`,
      userName: pwaCustomerName,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      deliveryDate: 'Instant (PWA)',
      address: `In-Store Sales (${pwaPaymentMethod})`,
      items: pwaCart.map((item) => ({
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

    if (pwaIsOffline) {
      const updatedQueue = [...pwaSyncQueue, newOrder];
      setPwaSyncQueue(updatedQueue);
      if (isBrowser()) {
        localStorage.setItem(`catacloud_pwa_sync_queue_${activeStoreId}`, JSON.stringify(updatedQueue));
      }
      toast.success('Sale Processed Offline', {
        description: `Receipt ${saleId} queued for sync.`
      });
      
      // Deduct stock locally from state to show instant PWA updates
      setProducts(prevProducts => 
        prevProducts.map(prod => {
          const itemInCart = pwaCart.find(item => item.fish.id === prod.id);
          if (itemInCart) {
            return { ...prod, stock: Math.max(0, prod.stock - itemInCart.quantity) };
          }
          return prod;
        })
      );

      setPwaReceipt(newOrder);
      setPwaCart([]);
      setPwaCustomerName('Walk-in Customer');
      setPwaPaymentMethod('Cash');
      return;
    }

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
      setPwaReceipt(newOrder);
      setPwaCart([]);
      setPwaCustomerName('Walk-in Customer');
      setPwaPaymentMethod('Cash');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register PWA sale.');
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

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setFormImage(data.url);
        toast.success('Image uploaded successfully to Cloudflare R2!');
      } else {
        toast.error(data.error || 'Upload failed. Check your R2 environment variables.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('An error occurred while uploading. Ensure your R2 API keys are set.');
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Initial User load
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('catacloud_user');
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
      getStoresOwnedByUser(user.email).then((stores) => {
        setUserStores(stores);
        if (stores.length > 0) {
          const savedActive = localStorage.getItem(`catacloud_active_store_id_${user.email}`);
          const exists = stores.some(s => s.id === savedActive);
          const initialStoreId = exists && savedActive ? savedActive : stores[0].id || '';
          setActiveStoreId(initialStoreId);
          localStorage.setItem(`catacloud_active_store_id_${user.email}`, initialStoreId);
          setShowStoreCreator(false);
        } else {
          setActiveStoreId('');
          localStorage.removeItem(`catacloud_active_store_id_${user.email}`);
          setShowStoreCreator(true);
        }
      });
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

  // PWA Initialization & Offline Handling Helper
  const syncOfflineOrders = async (queueToSync: Order[] = pwaSyncQueue) => {
    if (queueToSync.length === 0) return;
    
    let successCount = 0;
    const remainingQueue: Order[] = [];

    for (const order of queueToSync) {
      try {
        await addOrder(order, activeStoreId);
        successCount++;
      } catch (err) {
        console.error('Failed to sync offline order:', order.id, err);
        remainingQueue.push(order);
      }
    }

    if (successCount > 0) {
      toast.success('Offline Sync Completed', {
        description: `Successfully synchronized ${successCount} transaction(s) with cloud.`
      });
      // Reload lists
      const [prods, ords] = await Promise.all([
        getProducts(activeStoreId),
        getOrders(activeStoreId)
      ]);
      setProducts(prods);
      setOrders(ords);
    }

    setPwaSyncQueue(remainingQueue);
    if (isBrowser()) {
      localStorage.setItem(`catacloud_pwa_sync_queue_${activeStoreId}`, JSON.stringify(remainingQueue));
    }
  };

  useEffect(() => {
    if (!isBrowser()) return;

    // Load offline sync queue
    const queueKey = `catacloud_pwa_sync_queue_${activeStoreId}`;
    const stored = localStorage.getItem(queueKey);
    if (stored) {
      try {
        setPwaSyncQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse offline sync queue:', e);
      }
    }

    // Check standalone app status
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaIsInstalled(true);
    }

    // Listen for install prompts
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    // Listen for online status to sync
    const handleOnline = () => {
      setPwaIsOffline(false);
      toast.success('Connection restored! Synchronizing offline sales...');
      // Sync queue
      const storedQueue = localStorage.getItem(queueKey);
      if (storedQueue) {
        try {
          const queue = JSON.parse(storedQueue);
          if (queue.length > 0) {
            syncOfflineOrders(queue);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    const handleOffline = () => {
      setPwaIsOffline(true);
      toast.warning('Network disconnected! Switched to offline billing.');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial browser status check
    if (!navigator.onLine) {
      setPwaIsOffline(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeStoreId]);

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

  const handleLogout = async () => {
    localStorage.removeItem('catacloud_user');
    localStorage.removeItem('catacloud_cart');
    localStorage.setItem('catacloud_logged_out', 'true');
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase logout error:', e);
      }
    }
    window.dispatchEvent(new Event('storage'));
    router.push('/');
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
        : (cleanNiche.includes('clothing') || cleanNiche.includes('apparel') || cleanNiche.includes('wear') || cleanNiche.includes('fashion') || cleanNiche.includes('threads') || cleanNiche.includes('garment') || cleanNiche.includes('boutique'))
          ? 'clothing'
          : 'generic';

    const basePreset = resolvedType === 'egg' 
      ? EGG_PRESET 
      : resolvedType === 'seafood' 
        ? SEAFOOD_PRESET 
        : resolvedType === 'clothing'
          ? CLOTHING_PRESET
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
      await reseedProducts(resolvedType, finalStoreId);
      toast.success(`Store "${onboardName}" created successfully!`);

      const stores = await getStoresOwnedByUser(user.email);
      setUserStores(stores);
      
      // Set as active store
      setActiveStoreId(finalStoreId);
      localStorage.setItem(`catacloud_active_store_id_${user.email}`, finalStoreId);
      
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

  const handlePresetChange = (presetType: 'seafood' | 'egg' | 'generic' | 'clothing') => {
    let preset: StoreConfig;
    if (presetType === 'seafood') preset = SEAFOOD_PRESET;
    else if (presetType === 'egg') preset = EGG_PRESET;
    else if (presetType === 'clothing') preset = CLOTHING_PRESET;
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

  const handleDeleteStore = async () => {
    if (!activeStoreId) return;
    const storeName = storeConfig.storeName;
    const storeIdToDelete = activeStoreId;
    const configToDelete = { ...storeConfig };
    const productsToDelete = [...products];
    const proposalsToDelete = [...proposals];
    const catalogsToDelete = [...customCatalogs];

    if (confirm(`Warning: Are you sure you want to delete the store "${storeName}"? This will temporarily remove all its data, but you can Undo this action.`)) {
      setLoading(true);
      try {
        await deleteStore(storeIdToDelete);
        
        // Reload owned stores
        const stores = await getStoresOwnedByUser(user!.email);
        setUserStores(stores);
        
        // Pick new active store
        if (stores.length > 0) {
          const newActive = stores[0].id || '';
          setActiveStoreId(newActive);
          localStorage.setItem(`catacloud_active_store_id_${user!.email}`, newActive);
          setShowStoreCreator(false);
        } else {
          setActiveStoreId('');
          localStorage.removeItem(`catacloud_active_store_id_${user!.email}`);
          setShowStoreCreator(true);
        }

        toast(`Store "${storeName}" has been deleted`, {
          description: `Removed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}`,
          action: {
            label: "Undo",
            onClick: async () => {
              // Restore store configuration
              await saveStoreConfig(storeIdToDelete, configToDelete);
              // Restore products
              if (productsToDelete.length > 0) {
                await saveProducts(productsToDelete, storeIdToDelete);
              }
              // Restore proposals
              if (proposalsToDelete.length > 0) {
                await saveProposals(proposalsToDelete, storeIdToDelete);
              }
              // Restore catalogs
              if (catalogsToDelete.length > 0) {
                await saveCustomCatalogs(catalogsToDelete, storeIdToDelete);
              }
              
              // Reload
              const restoredStores = await getStoresOwnedByUser(user!.email);
              setUserStores(restoredStores);
              setActiveStoreId(storeIdToDelete);
              localStorage.setItem(`catacloud_active_store_id_${user!.email}`, storeIdToDelete);
              setShowStoreCreator(false);
              
              toast.success(`Restored store "${storeName}" successfully!`);
            }
          }
        });
      } catch (e) {
        console.error(e);
        toast.error('Failed to delete store.');
      } finally {
        setLoading(false);
      }
    }
  };

  const exportCatalogToCSV = () => {
    if (products.length === 0) {
      toast.error('No products in the catalog to export.');
      return;
    }
    
    // Header Row
    const headers = ['ID', 'Name', 'Scientific Name', 'Category', 'Price Per Unit', 'Unit', 'Stock', 'Origin', 'Sustainability', 'Description'];
    
    // Product Rows
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.scientificName || '').replace(/"/g, '""')}"`,
      p.category,
      p.pricePerKg,
      p.unit || storeConfig.unit,
      p.stock,
      `"${(p.origin || '').replace(/"/g, '""')}"`,
      p.sustainability || '',
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${storeConfig.id || 'store'}_catalog_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Inventory exported as CSV successfully!');
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

    try {
      if (editingProduct) {
        await updateProduct(productData, activeStoreId);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productData, activeStoreId);
        toast.success('Product added successfully!');
      }

      const prods = await getProducts(activeStoreId);
      setProducts(prods);
      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');
    const isCSV = fileNameLower.endsWith('.csv');

    if (!isExcel && !isCSV) {
      toast.error('Please upload a valid CSV or Excel file.');
      return;
    }

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          setBulkCSVText(csv || '');
          toast.success(`Successfully parsed Excel sheet: ${file.name}`);
        } catch (err) {
          toast.error('Failed to parse Excel file.');
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setBulkCSVText(text || '');
        toast.success(`Loaded CSV content from ${file.name}`);
      };
      reader.onerror = () => {
        toast.error('Failed to read file.');
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadSampleCSV = () => {
    const headers = 'Name,Price,Category,Stock\n';
    const row1 = 'Premium Atlantic Halibut,24.50,Seafood,150\n';
    const row2 = 'Organic Free-Range Dozen Eggs,8.50,Poultry,20\n';
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + row1 + row2);
    
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'sample_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV download started!');
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCSVText.trim()) {
      toast.error('Please paste CSV text data.');
      return;
    }

    const rows = bulkCSVText.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    if (rows.length < 2) {
      toast.error('CSV data must contain at least a header row and one product row.');
      return;
    }

    // Parse header row
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const nameIndex = headers.findIndex(h => h === 'name' || h.includes('name') || h.includes('title') || h.includes('product'));
    const priceIndex = headers.findIndex(h => h === 'price' || h.includes('price') || h.includes('rate') || h.includes('cost') || h.includes('mrp'));
    const categoryIndex = headers.findIndex(h => h === 'category' || h.includes('category') || h.includes('type') || h.includes('group') || h.includes('cat'));
    const stockIndex = headers.findIndex(h => h === 'stock' || h.includes('stock') || h.includes('qty') || h.includes('quantity') || h.includes('count') || h === 'qnty');
    
    // Custom optional columns detection
    const idIndex = headers.findIndex(h => h === 'id' || h === 'sku' || h === 'code' || h === 'productid' || h === 'product id' || h === 'key' || h === 'itemid');
    const sciNameIndex = headers.findIndex(h => h.includes('scientific') || h.includes('sci') || h.includes('type') || h.includes('model') || h.includes('fit'));
    const originIndex = headers.findIndex(h => h.includes('origin') || h.includes('source') || h.includes('made') || h.includes('location') || h.includes('from'));
    const sustainabilityIndex = headers.findIndex(h => h.includes('sustain') || h.includes('cert') || h.includes('environ') || h.includes('eco') || h.includes('green') || h.includes('ethics'));
    const descIndex = headers.findIndex(h => h === 'description' || h.includes('desc') || h.includes('detail') || h.includes('info') || h.includes('about') || h.includes('text'));
    const unitColIndex = headers.findIndex(h => h === 'unit' || h.includes('measure') || h.includes('pack') || h.includes('qty unit'));
    const imageIndex = headers.findIndex(h => h.includes('image') || h.includes('img') || h.includes('pic') || h.includes('photo'));

    if (nameIndex === -1 || priceIndex === -1 || stockIndex === -1) {
      toast.error('CSV headers must include "Name", "Price", and "Stock" columns.');
      return;
    }

    let successCount = 0;
    const errors: string[] = [];

    // Clone the product items array to modify it locally and bulk upsert
    const currentProducts = [...products];

    for (let i = 1; i < rows.length; i++) {
      const colValues = [];
      let currentVal = '';
      let insideQuotes = false;

      // Handle quotes with commas inside values
      const line = rows[i];
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          colValues.push(currentVal.trim().replace(/^"|"$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      colValues.push(currentVal.trim().replace(/^"|"$/g, ''));

      if (colValues.length < Math.max(nameIndex, priceIndex, stockIndex) + 1) {
        errors.push(`Row ${i + 1}: Insufficient column values.`);
        continue;
      }

      const pName = colValues[nameIndex];
      const pPrice = Number(colValues[priceIndex]);
      const pCategory = categoryIndex !== -1 && colValues[categoryIndex] ? colValues[categoryIndex] : (storeConfig.categories[0] || 'Saltwater');
      const pStock = Number(colValues[stockIndex]);

      if (!pName || isNaN(pPrice) || isNaN(pStock)) {
        errors.push(`Row ${i + 1}: Name cannot be empty, and Price and Stock must be valid numbers.`);
        continue;
      }

      // Extract optional fields from the columns
      const rawId = idIndex !== -1 && colValues[idIndex] ? colValues[idIndex].trim() : '';
      const generatedId = rawId 
        ? rawId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
        : pName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + `-${Math.floor(100 + Math.random() * 900)}`;

      const pSciName = sciNameIndex !== -1 && colValues[sciNameIndex] ? colValues[sciNameIndex].trim() : '';
      const pOrigin = originIndex !== -1 && colValues[originIndex] ? colValues[originIndex].trim() : '';
      const pSustainability = sustainabilityIndex !== -1 && colValues[sustainabilityIndex] ? colValues[sustainabilityIndex].trim() : '';
      const pDesc = descIndex !== -1 && colValues[descIndex] ? colValues[descIndex].trim() : '';
      const pUnit = unitColIndex !== -1 && colValues[unitColIndex] ? colValues[unitColIndex].trim() : (storeConfig.unit || 'pcs');
      const pImage = imageIndex !== -1 && colValues[imageIndex] ? colValues[imageIndex].trim() : '';

      const newProd: FishItem = {
        id: generatedId,
        name: pName,
        scientificName: pSciName,
        category: pCategory,
        pricePerKg: pPrice,
        origin: pOrigin,
        stock: pStock,
        image: pImage,
        description: pDesc,
        tasteProfile: [],
        texture: '',
        sustainability: pSustainability,
        prepTime: '',
        difficulty: '',
        unit: pUnit
      };

      currentProducts.push(newProd);
      successCount++;
    }

    try {
      await saveProducts(currentProducts, activeStoreId);
      const updated = await getProducts(activeStoreId);
      setProducts(updated);
      setBulkCSVText('');
      setIsBulkModalOpen(false);

      if (errors.length > 0) {
        toast.warning(`Uploaded ${successCount} products, with some errors:`, {
          description: errors.slice(0, 3).join(' | ')
        });
      } else {
        toast.success(`Successfully uploaded ${successCount} products!`);
      }
    } catch (saveErr) {
      console.error(saveErr);
      toast.error('Failed to save bulk uploaded products.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    console.log("handleDeleteProduct triggered for product ID:", id);
    try {
      const productToDelete = products.find(p => p.id === id);
      if (!productToDelete) {
        console.warn("Product not found in products state array. Performing backend database fallback lookup for ID:", id);
        const backendProducts = await getProducts(activeStoreId);
        const fallbackProduct = backendProducts.find(p => p.id === id);
        if (!fallbackProduct) {
          console.error("Product could not be resolved in backend inventory either.");
          toast.error("Deletion Failed", { description: "The product could not be found." });
          return;
        }
        await deleteProduct(id, activeStoreId);
        const updated = await getProducts(activeStoreId);
        setProducts(updated);
        toast(`Product "${fallbackProduct.name}" has been deleted`);
        return;
      }

      await deleteProduct(id, activeStoreId);
      const prods = await getProducts(activeStoreId);
      setProducts(prods);
      console.log("Successfully deleted product and updated state.");

      toast(`Product "${productToDelete.name}" has been deleted`, {
        description: `Removed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}`,
        action: {
          label: "Undo",
          onClick: async () => {
            console.log("Undo triggered for product restore:", productToDelete.name);
            try {
              await addProduct(productToDelete, activeStoreId);
              const restoredProds = await getProducts(activeStoreId);
              setProducts(restoredProds);
              toast.success(`Restored product "${productToDelete.name}" successfully!`);
            } catch (restoreErr) {
              console.error("Failed to restore product on Undo action:", restoreErr);
              toast.error("Failed to restore product");
            }
          },
        },
      });
    } catch (err) {
      console.error("Error encountered in handleDeleteProduct:", err);
      toast.error("An error occurred while deleting the product.");
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
      id: editingCatalogId || `cat-proposal-${Math.floor(100000 + Math.random() * 900000)}`,
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

    const wasEditing = Boolean(editingCatalogId);
    if (editingCatalogId) {
      const updatedCatalogs = customCatalogs.some((cat) => cat.id === editingCatalogId)
        ? customCatalogs.map((cat) => cat.id === editingCatalogId ? newCatalog : cat)
        : [newCatalog, ...customCatalogs];
      await saveCustomCatalogs(updatedCatalogs, activeStoreId);
      setCustomCatalogs(updatedCatalogs);
    } else {
      await addCustomCatalog(newCatalog, activeStoreId);
      const cats = await getCustomCatalogs(activeStoreId);
      setCustomCatalogs(cats);
    }

    // Reset form fields
    setEditingCatalogId(null);
    setShowGenerator(false);
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
    toast.success(wasEditing ? 'Catalogue Updated' : 'Catalogue Generated', {
      description: `${wasEditing ? 'Updated' : 'Generated'} successfully on ${new Date().toLocaleString()}`
    });
  };

  const handleEditCustomCatalog = (catalog: CustomCatalog) => {
    setEditingCatalogId(catalog.id);
    setCatMarket(catalog.marketName);
    setCatNotes(catalog.notes);
    setCatDiscount(catalog.globalDiscount || 0);
    setCatDelivery(catalog.globalDelivery || 0);

    const nextOverrides: typeof catOverrides = {};
    products.forEach((product) => {
      const override = catalog.overrides[product.id];
      nextOverrides[product.id] = {
        price: override?.customPrice ?? product.pricePerKg,
        stock: override?.customStock ?? product.stock,
        discount: override?.customDiscount ?? 0,
        threshold: override?.customVolumeThreshold ?? 0,
        volumeDiscount: override?.customVolumeDiscount ?? 0,
        included: override?.included ?? false
      };
    });
    setCatOverrides(nextOverrides);
    setAdminTab('catalogs');
    setShowGenerator(true);
    toast.info(`Editing catalogue link for ${catalog.marketName}`);
  };

  const handleDeleteCustomCatalog = async (id: string) => {
    console.log("handleDeleteCustomCatalog triggered for proposal ID:", id);
    try {
      const catalogToDelete = customCatalogs.find(c => c.id === id);
      if (!catalogToDelete) {
        console.warn("Proposal catalog not found in customCatalogs state. Performing backend database fallback lookup for ID:", id);
        const backendCatalogs = await getCustomCatalogs(activeStoreId);
        const fallbackCatalog = backendCatalogs.find(c => c.id === id);
        if (!fallbackCatalog) {
          console.error("Catalogue proposal could not be resolved in backend records.");
          toast.error("Deletion Failed", { description: "The proposal could not be found." });
          return;
        }
        await deleteCustomCatalog(id, activeStoreId);
        const updated = await getCustomCatalogs(activeStoreId);
        setCustomCatalogs(updated);
        toast(`Catalogue proposal for "${fallbackCatalog.marketName}" has been deleted`);
        return;
      }

      await deleteCustomCatalog(id, activeStoreId);
      const cats = await getCustomCatalogs(activeStoreId);
      setCustomCatalogs(cats);
      console.log("Successfully deleted catalogue proposal and updated state.");

      toast(`Catalogue proposal for "${catalogToDelete.marketName}" has been deleted`, {
        description: `Removed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}`,
        action: {
          label: "Undo",
          onClick: async () => {
            console.log("Undo triggered for custom catalog restore:", catalogToDelete.marketName);
            try {
              await addCustomCatalog(catalogToDelete, activeStoreId);
              const restoredCats = await getCustomCatalogs(activeStoreId);
              setCustomCatalogs(restoredCats);
              toast.success(`Restored custom catalogue proposal for "${catalogToDelete.marketName}" successfully!`);
            } catch (restoreErr) {
              console.error("Failed to restore catalogue proposal on Undo action:", restoreErr);
              toast.error("Failed to restore catalogue proposal");
            }
          },
        },
      });
    } catch (err) {
      console.error("Error encountered in handleDeleteCustomCatalog:", err);
      toast.error("An error occurred while deleting the proposal.");
    }
  };

  const getGeneralCatalogLink = () => {
    if (typeof window === 'undefined') return '/catalogue/view';
    const protocol = window.location.protocol;
    const host = window.location.host;
    let domain = host;
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    const cleanStoreId = activeStoreId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `${protocol}//${cleanStoreId}.${domain}/catalogue/view`;
  };

  const getProposalShareLink = (cat: CustomCatalog) => {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    let domain = host;
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    const cleanStoreId = activeStoreId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const dataObj = {
      id: cat.id,
      marketName: cat.marketName,
      notes: cat.notes,
      globalDiscount: cat.globalDiscount,
      globalDelivery: cat.globalDelivery,
      createdDate: cat.createdDate,
      overrides: cat.overrides
    };
    const serializedData = btoa(unescape(encodeURIComponent(JSON.stringify(dataObj))));
    return `${protocol}//${cleanStoreId}.${domain}/catalogue/${cat.id}?p=${serializedData}`;
  };

  const handleCopyCatalogLink = (id: string) => {
    const catalog = customCatalogs.find((c) => c.id === id);
    if (!catalog) return;
    const link = getProposalShareLink(catalog);
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





  const renderBuyerDashboard = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>Buyer Sourcing Dashboard</h2>
        <p className={styles.merchantSubtitle}>Welcome back. Sourcing hub status is operational.</p>
        
        <div className={styles.lightMetricGrid}>
          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>SOURCED QUANTITY</span>
              <Package size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue}>{totalWeightSourced} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{storeConfig.unit}</span></h3>
            <span className={styles.lightCardFooter} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Premium {storeConfig.storeType === 'seafood' ? 'marine species' : 'products'}
            </span>
          </div>

          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>SOURCING INVESTMENT</span>
              <DollarSign size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue}>${totalSourcingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className={styles.lightCardFooter} style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total catalog investment
            </span>
          </div>

          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>SUSTAINABILITY PROFILE</span>
              <Activity size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue}>{sustainabilityScore}</h3>
            <span className={styles.lightCardFooter} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ethical sourcing commitment
            </span>
          </div>

          <div className={styles.lightCard} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>ACCOUNT TIER</span>
              <ShieldCheck size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue} style={{ fontSize: '1.4rem', marginTop: '8px', fontWeight: 700, color: '#0f172a' }}>
              {totalSourcingValue > 1000 ? 'Elite Member' : totalSourcingValue > 500 ? 'Preferred Partner' : 'General Partner'}
            </h3>
            <span className={styles.lightCardFooter} style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Active partner tier
            </span>
          </div>
        </div>

        <div className={styles.splitLayout} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '24px' }}>
          <div className={styles.lightPanelCard}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Sourcing Trends</h4>
            <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>You are actively sourcing from Tsukiji and North Atlantic hubs. Keep up your sustainability commitment to unlock tier upgrades.</p>
              <button 
                onClick={() => router.push('/')} 
                className={styles.btnMerchantSecondary} 
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                Go to Public Catalog
              </button>
            </div>
          </div>

          <div className={styles.lightPanelCard}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Quick Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#64748b' }}>
              <div><strong>Port Duty Officer:</strong> +1 (555) 019-2834</div>
              <div><strong>License Plate:</strong> LIC-928374-B</div>
              <div><strong>Fulfillment Agent:</strong> Tsukiji Sourcing Hub</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBuyerOrders = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>Sourcing & Delivery History</h2>
        <p className={styles.merchantSubtitle}>Reservations and direct deliveries requested under your buyer account.</p>
        
        {chefOrders.length === 0 ? (
          <div className={styles.lightPanelCard} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>📦</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>No Sourced Items Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Submit a procurement reservation in our public catalog.</p>
            <button onClick={() => router.push('/')} className={styles.btnMerchantSecondary}>
              Explore Sourcing Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {chefOrders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{order.id}</span>
                    <span style={{ color: '#94a3b8', margin: '0 8px' }}>&bull;</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{order.date}</span>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: order.status === 'Pending' ? '#fffbeb' : order.status === 'Dispatched' ? '#eff6ff' : '#f0fdf4',
                    color: order.status === 'Pending' ? '#d97706' : order.status === 'Dispatched' ? '#2563eb' : '#16a34a'
                  }}>
                    {order.status}
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                    <div><strong>ETA Delivery:</strong> {order.deliveryDate}</div>
                    <div><strong>Delivery Address:</strong> {order.address}</div>
                  </div>

                  <table className={styles.productsTable} style={{ border: 'none', background: 'transparent' }}>
                    <thead>
                      <tr style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ color: '#64748b', paddingBottom: '8px' }}>Product Item</th>
                        <th style={{ textAlign: 'right', color: '#64748b', paddingBottom: '8px' }}>Quantity</th>
                        <th style={{ textAlign: 'right', color: '#64748b', paddingBottom: '8px' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', color: '#64748b', paddingBottom: '8px' }}>Sourced Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                            <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{item.quantity} {storeConfig.unit}</td>
                          <td style={{ textAlign: 'right', color: '#475569' }}>${item.price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    Reservation Amount: ${order.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBuyerProfile = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>My Buyer Profile</h2>
        <p className={styles.merchantSubtitle}>Manage license verification and sustainable sourcing configurations.</p>
        
        <div className={styles.lightPanelCard} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '2.2rem',
            fontWeight: 700,
            margin: '0 auto 20px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{user.name}</h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '24px' }}>{user.email}</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Sourcing Authorization</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Port License No</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>LIC-928374-B</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Establishment Tier</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Fine Dining / Michelin</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0' }}>
              <span style={{ color: '#64748b' }}>Sustainability Commits</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>100% Sourced</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMerchantDashboard = () => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const activeEnquiriesCount = sourcingRequests.length;
    const productSales = orders.flatMap((order) => order.items).reduce<Record<string, number>>((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {});
    const topProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No sales yet';
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesByDay = dayLabels.map((label) => ({ label, total: 0 }));
    orders.forEach((order) => {
      const parsedDate = new Date(order.date);
      const day = parsedDate.getDay();
      const index = day === 0 ? 6 : day - 1;
      if (!Number.isNaN(parsedDate.getTime()) && salesByDay[index]) {
        salesByDay[index].total += order.totalPrice;
      }
    });
    const maxSalesDay = Math.max(...salesByDay.map((day) => day.total), 0);
    
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>Merchant Dashboard</h2>
        <p className={styles.merchantSubtitle}>System status is operational. {activeEnquiriesCount} new enquiries require attention.</p>
        
        <div className={styles.lightMetricGrid}>
          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>TOTAL REVENUE</span>
              <DollarSign size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>ACTIVE ENQUIRIES</span>
              <MessageSquare size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue}>{activeEnquiriesCount}</h3>
          </div>

          <div className={styles.lightCard}>
            <div className={styles.lightCardHeader}>
              <span className={styles.lightCardLabel}>TOP PRODUCT</span>
              <Star size={18} style={{ color: '#64748b' }} />
            </div>
            <h3 className={styles.lightCardValue} style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '14px' }}>
              {topProduct}
            </h3>
          </div>
        </div>

        <div className={styles.splitLayout}>
          <div className={styles.lightPanelCard}>
            <div className={styles.lightPanelHeader}>
              <h3 className={styles.lightPanelTitle}>Sales Volume Trends</h3>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                <button type="button" style={{ border: 'none', background: 'none', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Daily</button>
                <button type="button" style={{ border: 'none', background: '#ffffff', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, color: '#07162c', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}>Weekly</button>
              </div>
            </div>
            
            {maxSalesDay === 0 ? (
              <div className={styles.emptyChartState}>No sales recorded yet.</div>
            ) : (
              <div className={styles.trendsBarChart}>
                {salesByDay.map((day) => (
                  <div key={day.label} className={styles.trendsBarCol}>
                    <div
                      className={`${styles.trendsBarFill} ${day.total === maxSalesDay ? styles.trendsBarFillActive : ''}`}
                      style={{ height: `${Math.max(8, (day.total / maxSalesDay) * 100)}%` }}
                    />
                    <span className={styles.trendsBarLabel}>{day.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.lightPanelCard}>
            <div className={styles.lightPanelHeader}>
              <h3 className={styles.lightPanelTitle}>Recent Enquiries</h3>
              <span onClick={() => setAdminTab('enquiries')} className={styles.lightPanelLink}>View All</span>
            </div>
            
            <div className={styles.enquiryList}>
              <div className={styles.enquiryListHeader}>
                <span>Client</span>
                <span>Product</span>
                <span>Status</span>
              </div>
              
              {sourcingRequests.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No recent enquiries.
                </div>
              ) : (
                sourcingRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className={styles.enquiryRow}>
                    <div>
                      <div className={styles.enquiryClient}>{req.clientName}</div>
                      <div className={styles.enquiryTime}>
                        {req.date}
                      </div>
                    </div>
                    <span className={styles.enquiryProduct}>{req.productName}</span>
                    <span className={`${styles.enquiryStatusBadge} ${styles.badgeNew}`}>New</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMerchantCatalog = () => {
    return (
      <div className={styles.merchantContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 className={styles.merchantTitle}>Inventory & Catalog</h2>
            <p className={styles.merchantSubtitle} style={{ margin: '4px 0 0 0' }}>Manage your supply inventory and pricing.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className={styles.btnMerchantSecondary} onClick={exportCatalogToCSV}>Export CSV</button>
            <button type="button" className={styles.btnMerchantSecondary} style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }} onClick={() => setIsBulkModalOpen(true)}>
              📥 Bulk Upload
            </button>
            <button type="button" className={styles.btnMerchantPrimary} onClick={() => handleOpenProductModal(null)}>
              <Plus size={16} /> Add New Product
            </button>
          </div>
        </div>

        <div className={styles.catalogSplitLayout}>
          {/* Left Sidebar Filters */}
          <div className={styles.catalogFilterPanel}>
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Categories</h4>
              <div className={styles.checkboxList}>
                <label className={styles.checkboxItem} onClick={() => setCatSelectedCategory('All')} style={{ cursor: 'pointer' }}>
                  <div className={styles.checkboxLabelGroup}>
                    <input type="checkbox" checked={catSelectedCategory === 'All'} readOnly style={{ cursor: 'pointer' }} />
                    <span>All Items</span>
                  </div>
                  <span className={styles.checkboxCount}>{products.length}</span>
                </label>
                {storeConfig.categories.map((cat) => (
                  <label key={cat} className={styles.checkboxItem} onClick={() => setCatSelectedCategory(cat)} style={{ cursor: 'pointer' }}>
                    <div className={styles.checkboxLabelGroup}>
                      <input type="checkbox" checked={catSelectedCategory === cat} readOnly style={{ cursor: 'pointer' }} />
                      <span>{cat}</span>
                    </div>
                    <span className={styles.checkboxCount}>{products.filter(p => p.category === cat).length}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Stock Status</h4>
              <div className={styles.radioList}>
                <label className={styles.radioItem} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="stock-status" defaultChecked style={{ cursor: 'pointer' }} />
                  <span>All Stock</span>
                </label>
                <label className={styles.radioItem} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="stock-status" style={{ cursor: 'pointer' }} />
                  <span>In Stock</span>
                </label>
                <label className={styles.radioItem} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="stock-status" style={{ cursor: 'pointer' }} />
                  <span>Low Stock</span>
                </label>
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Catalogue Links</h4>
              <div className={styles.checkboxList}>
                {customCatalogs.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                    No client catalogue links yet.
                  </p>
                ) : (
                  customCatalogs.slice(0, 3).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCopyCatalogLink(cat.id)}
                      className={styles.catalogLinkButton}
                    >
                      <span>{cat.marketName}</span>
                      <small>Copy link</small>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setAdminTab('catalogs')}
                className={styles.btnMerchantSecondary}
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', fontSize: '0.8rem' }}
              >
                Manage Catalogue Links
              </button>
            </div>
          </div>

          {/* Right Product Grid */}
          <div className={styles.horizontalProductList}>
            {products
              .filter((p) => catSelectedCategory === 'All' || p.category === catSelectedCategory)
              .map((prod) => {
                const isLow = prod.stock < 10;
                const isOut = prod.stock <= 0;
                return (
                  <div key={prod.id} className={styles.horizontalCard}>
                    <img src={prod.image || IMAGE_PLACEHOLDER} alt={prod.name} className={styles.horizontalCardImg} />
                    <div className={styles.horizontalCardContent}>
                      <div className={styles.horizontalCardDetails}>
                        <div className={styles.horizontalSku}>SKU: {prod.id.slice(0, 10).toUpperCase()}</div>
                        <h4 className={styles.horizontalCardTitle}>{prod.name}</h4>
                        <p className={styles.horizontalCardSub}>{prod.category} &bull; Per {prod.unit || storeConfig.unit}</p>
                      </div>
                      
                      <div className={styles.horizontalPriceGroup}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Wholesale Price</div>
                        <div className={styles.horizontalPrice}>${prod.pricePerKg.toFixed(2)}</div>
                      </div>

                      <div className={styles.horizontalStockGroup}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Available Stock</div>
                        <div className={styles.horizontalStock} style={{ color: isOut ? '#ef4444' : isLow ? '#f97316' : '#0f172a' }}>
                          {prod.stock} {prod.unit || storeConfig.unit}
                        </div>
                        <span className={`${styles.stockStatusLabel} ${isOut ? styles.stockOutStock : isLow ? styles.stockLowStock : styles.stockInStock}`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      <button 
                        type="button"
                        onClick={() => handleOpenProductModal(prod)}
                        className={styles.btnMerchantSecondary}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className={styles.btnMerchantSecondary}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#fee2e2', color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            
            <div className={styles.quickAddCard} onClick={() => handleOpenProductModal(null)}>
              <div className={styles.quickAddIcon}>
                <Plus size={20} />
              </div>
              <h5 className={styles.quickAddTitle}>Quick Add Product</h5>
              <p className={styles.quickAddSub}>Add a single item to the current category</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMerchantEnquiries = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>🙋 Custom Sourcing Enquiries</h2>
        <p className={styles.merchantSubtitle}>Track partner sourcing requests, volume inquiries, and custom negotiations.</p>
        
        <div className={styles.lightPanelCard}>
          {sourcingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No custom sourcing requests recorded.
            </div>
          ) : (
            <div className={styles.tableResponsive} style={{ border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: 'none' }}>
              <table className={styles.table}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Client</th>
                    <th style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Product Required</th>
                    <th style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Target Quantity</th>
                    <th style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Notes / Requirements</th>
                    <th style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Date Received</th>
                  </tr>
                </thead>
                <tbody>
                  {sourcingRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{req.clientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.clientEmail}</div>
                      </td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#334155' }}>{req.productName}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: '#0f172a' }}>{req.requestedQuantity} {storeConfig.unit}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '0.85rem' }}>{req.notes || 'No special requirements.'}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                        {req.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMerchantPWA = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>⚡ Progressive Web Application (PWA) & Billing</h2>
        <p className={styles.merchantSubtitle}>Register direct sales, customize client billing names, and automatically deduct sourced quantities from active catalogue inventory stocks.</p>

        {pwaReceipt && (
          <div className="glassmorphism" style={{ border: '2px solid var(--accent-gold)', borderRadius: '16px', padding: '24px', marginBottom: '32px', background: 'rgba(226, 183, 68, 0.03)', position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setPwaReceipt(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              &times;
            </button>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', fontFamily: 'var(--font-playfair), serif', margin: '0 0 4px 0' }}>{storeConfig.storeName}</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Official Billing Invoice</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Invoice ID:</span> <strong style={{ color: '#0f172a' }}>{pwaReceipt.id}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b' }}>Date:</span> <strong style={{ color: '#0f172a' }}>{pwaReceipt.date}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Client:</span> <strong style={{ color: '#0f172a' }}>{pwaReceipt.userName}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b' }}>Method:</span> <strong style={{ color: '#0f3057' }}>{pwaReceipt.address.replace('In-Store Sales (', '').replace(')', '')}</strong>
              </div>
            </div>

            <table className={styles.orderItemsTable} style={{ margin: '16px 0' }}>
              <thead>
                <tr>
                  <th style={{ color: '#64748b' }}>Item</th>
                  <th style={{ textAlign: 'right', color: '#64748b' }}>Qty</th>
                  <th style={{ textAlign: 'right', color: '#64748b' }}>Price</th>
                  <th style={{ textAlign: 'right', color: '#64748b' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {pwaReceipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#334155', whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'normal' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{item.quantity} {storeConfig.unit}</td>
                    <td style={{ textAlign: 'right', color: '#334155' }}>${item.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#0f3057', fontWeight: 'bold' }}>${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>{' '}
                <span style={{ color: '#0f172a', fontWeight: 600 }}>${pwaReceipt.totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Taxes & Levies:</span>{' '}
                <span style={{ color: '#22c55e', fontWeight: 600 }}>Included</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#07162c', marginTop: '8px' }}>
                <span>Total Bill Amount:</span>{' '}
                <span>${pwaReceipt.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                type="button"
                onClick={() => window.print()}
                className={styles.btnMerchantPrimary}
                style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Bill Invoice
              </button>
              <button 
                type="button"
                onClick={() => setPwaReceipt(null)}
                className={styles.btnMerchantSecondary}
                style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                Create New PWA Sale
              </button>
            </div>
          </div>
        )}

        {/* PWA Dashboard control panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Card 1: Network & Offline simulation */}
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Network Status</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold', 
                  color: pwaIsOffline ? '#ea580c' : '#16a34a',
                  background: pwaIsOffline ? 'rgba(234,88,12,0.1)' : 'rgba(22,163,74,0.1)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${pwaIsOffline ? 'rgba(234,88,12,0.2)' : 'rgba(22,163,74,0.2)'}`
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pwaIsOffline ? '#ea580c' : '#16a34a', display: 'inline-block' }}></span>
                  {pwaIsOffline ? 'Offline Mode' : 'Online'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 8px 0' }}>
                {pwaIsOffline ? '⚡ Simulated Offline POS' : '🌐 Connected to CataCloud'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                {pwaIsOffline 
                  ? 'Products and inventories are fetched from offline local cache. Sales are queued locally in browser.' 
                  : 'Syncing live products, inventories, and processing invoices in real-time with your cloud database.'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const newOffline = !pwaIsOffline;
                setPwaIsOffline(newOffline);
                if (!newOffline) {
                  syncOfflineOrders();
                } else {
                  toast.warning('Switched to Offline Mode', {
                    description: 'Simulating disconnected database state.'
                  });
                }
              }}
              className={styles.btnMerchantSecondary}
              style={{ marginTop: '14px', width: '100%', fontSize: '0.8rem', padding: '6px 12px', justifyContent: 'center' }}
            >
              {pwaIsOffline ? '🔌 Go Online & Sync' : '✈️ Simulate Offline Mode'}
            </button>
          </div>

          {/* Card 2: App Installation & Standalone */}
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Install Status</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold', 
                  color: (pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? '#0284c7' : '#ea580c',
                  background: (pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'rgba(2,132,199,0.1)' : 'rgba(234,88,12,0.1)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'rgba(2,132,199,0.2)' : 'rgba(234,88,12,0.2)'}`
                }}>
                  {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'Standalone Active' : 'Installable'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 8px 0' }}>
                {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? '📱 Standalone Native App' : '💻 Running in Browser'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches)
                  ? 'Running as a standalone native app on your desktop/mobile home screen with custom shell.' 
                  : 'Install CataCloud on your home screen or desktop taskbar to run offline with native app shell.'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (pwaInstallPrompt) {
                  pwaInstallPrompt.prompt();
                  pwaInstallPrompt.userChoice.then((choiceResult: any) => {
                    if (choiceResult.outcome === 'accepted') {
                      toast.success('Thank you for installing CataCloud!');
                      setPwaIsInstalled(true);
                    }
                    setPwaInstallPrompt(null);
                  });
                } else {
                  toast.info('How to install CataCloud PWA:', {
                    description: 'Click the Install icon ⊕ in your browser address bar or click "Add to Home Screen" in your browser menu.'
                  });
                }
              }}
              className={styles.btnMerchantPrimary}
              style={{ marginTop: '14px', width: '100%', fontSize: '0.8rem', padding: '6px 12px', justifyContent: 'center' }}
            >
              {pwaInstallPrompt ? '📥 Install Native App' : '📲 How to Install App'}
            </button>
          </div>

          {/* Card 3: Storage, Sync & Cache Stats */}
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Offline Storage</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold', 
                  color: pwaSyncQueue.length > 0 ? '#ef4444' : '#16a34a',
                  background: pwaSyncQueue.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${pwaSyncQueue.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`
                }}>
                  {pwaSyncQueue.length} Pending Sales
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 8px 0' }}>
                📦 Offline Cache & Storage Stats
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Products Cached: <strong>{products.length} items</strong></div>
                <div>Storage Usage: <strong>~{(JSON.stringify(products).length / 1024).toFixed(1)} KB</strong></div>
                <div>Sync Queue: <strong>{pwaSyncQueue.length} transactions</strong></div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={async () => {
                  toast.info('Refreshing local storage offline cache...');
                  const prods = await getProducts(activeStoreId);
                  setProducts(prods);
                  toast.success('Offline cache refreshed!', { description: `${prods.length} products cached.` });
                }}
                className={styles.btnMerchantSecondary}
                style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px', justifyContent: 'center' }}
              >
                🔄 Refresh Cache
              </button>
              
              <button
                type="button"
                onClick={() => syncOfflineOrders()}
                disabled={pwaSyncQueue.length === 0 || pwaIsOffline}
                className={styles.btnMerchantPrimary}
                style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px', justifyContent: 'center', opacity: (pwaSyncQueue.length === 0 || pwaIsOffline) ? 0.5 : 1 }}
              >
                ☁️ Sync Queue
              </button>
            </div>
          </div>

        </div>

        <div className={styles.catalogSplitLayout} style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
          {/* Left Column: PWA Catalog List */}
          <div className={styles.lightPanelCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input 
                type="text"
                value={pwaSearch}
                onChange={(e) => setPwaSearch(e.target.value)}
                placeholder="Search PWA items..."
                className={styles.lightInput}
                style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
              />
              <select 
                value={pwaCategory}
                onChange={(e) => setPwaCategory(e.target.value)}
                className={styles.lightSelect}
                style={{ width: '150px', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}
              >
                <option value="All">All Categories</option>
                {storeConfig.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No inventory available to sell. Go to <strong>Catalogue Inventory</strong> to add items.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                {products
                  .filter((p) => {
                    const matchCat = pwaCategory === 'All' || p.category === pwaCategory;
                    const matchSearch = p.name.toLowerCase().includes(pwaSearch.toLowerCase()) ||
                      p.scientificName.toLowerCase().includes(pwaSearch.toLowerCase());
                    return matchCat && matchSearch;
                  })
                  .map((p) => (
                    <div 
                      key={p.id} 
                      className={styles.lightPanelCard}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #e2e8f0', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        opacity: p.stock <= 0 ? 0.5 : 1
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                        <img src={p.image || IMAGE_PLACEHOLDER} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {p.stock <= 0 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Out of Stock
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0', wordBreak: 'normal', overflowWrap: 'normal' }}>{p.name}</h4>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', fontStyle: 'italic' }}>{p.scientificName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f3057' }}>
                          ${p.pricePerKg.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: p.stock < 10 ? '#ef4444' : '#64748b' }}>
                          Stock: <strong>{p.stock}</strong>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleAddToPwaCart(p)}
                        disabled={p.stock <= 0}
                        className={styles.btnMerchantPrimary}
                        style={{ width: '100%', marginTop: '10px', height: '28px', fontSize: '0.75rem', padding: '0', justifyContent: 'center' }}
                      >
                        + Add to Sale
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Right Column: PWA Cart Drawer Panel */}
          <div className={styles.lightPanelCard} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontWeight: 'bold' }}>
              Cart Bill Breakdown
            </h3>

            {pwaCart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span>🛒 PWA Cart is Empty</span>
                <span style={{ fontSize: '0.75rem' }}>Select products on the left to start a billing session.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
                {pwaCart.map((item) => (
                  <div key={item.fish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', wordBreak: 'normal', overflowWrap: 'normal' }}>{item.fish.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>${item.fish.pricePerKg.toFixed(2)} / {item.fish.unit || storeConfig.unit}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                      <button 
                        type="button"
                        onClick={() => handleUpdatePwaQuantity(item.fish.id, item.quantity - 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => handleUpdatePwaQuantity(item.fish.id, item.quantity + 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>${(item.fish.pricePerKg * item.quantity).toFixed(2)}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFromPwaCart(item.fish.id)}
                        style={{ fontSize: '0.7rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.formGroup} style={{ marginBottom: '4px' }}>
                <label className={styles.label} style={{ fontSize: '0.75rem' }}>Billing Client Name</label>
                <input 
                  type="text" 
                  value={pwaCustomerName}
                  onChange={(e) => setPwaCustomerName(e.target.value)}
                  className={styles.lightInput}
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
                      onClick={() => setPwaPaymentMethod(method)}
                      style={{
                        height: '32px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderColor: pwaPaymentMethod === method ? '#07162c' : '#cbd5e1',
                        color: pwaPaymentMethod === method ? '#ffffff' : '#64748b',
                        background: pwaPaymentMethod === method ? '#07162c' : '#ffffff'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Bill Amount:</span>
                <strong style={{ fontSize: '1.4rem', color: '#07162c' }}>
                  ${pwaCart.reduce((sum, item) => sum + item.fish.pricePerKg * item.quantity, 0).toFixed(2)}
                </strong>
              </div>

              <button 
                type="button"
                onClick={(e) => handleCompletePwaSale(e)}
                disabled={pwaCart.length === 0}
                className={styles.btnMerchantPrimary} 
                style={{ width: '100%', height: '40px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer', justifyContent: 'center' }}
              >
                🧾 Complete PWA Sale & Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMerchantCatalogs = () => {
    return (
      <div className={styles.merchantContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 className={styles.merchantTitle}>Custom Proposal Deals</h2>
            <p className={styles.merchantSubtitle} style={{ margin: '4px 0 0 0' }}>Configure special quotes and discounts for target clients.</p>
          </div>
          {!showGenerator ? (
            activeStoreId ? (
              <button
                type="button"
                className={styles.btnMerchantPrimary}
                onClick={() => {
                  setShowGenerator(true);
                  setEditingCatalogId(null);
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
                }}
              >
                + Generate Custom Catalogue
              </button>
            ) : null
          ) : (
            <button
              type="button"
              className={styles.btnMerchantSecondary}
              onClick={() => setShowGenerator(false)}
            >
              Back to List
            </button>
          )}
        </div>

        {showGenerator ? (
          <div className={`${styles.lightPanelCard} glassmorphism`} style={{ marginBottom: '24px' }}>
            <h3 className={styles.lightPanelTitle} style={{ marginBottom: '20px' }}>
              {editingCatalogId ? 'Edit Custom Catalogue Proposal' : 'Configure Custom Catalogue Proposal'}
            </h3>
            <form onSubmit={handleCatProposalSubmit}>
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
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={catDiscount}
                    onChange={(e) => setCatDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="luxury-input"
                    placeholder="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Global Logistics / Delivery Charge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={catDelivery}
                    onChange={(e) => setCatDelivery(Math.max(0, Number(e.target.value)))}
                    className="luxury-input"
                    placeholder="0.00"
                  />
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
                      placeholder="Search overrides by name..."
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

              <div style={{ marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                <table className={styles.table} style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '80px', textAlign: 'center', color: '#64748b' }}>Include</th>
                      <th style={{ color: '#64748b' }}>{storeConfig.attributes.specimenLabel} Name</th>
                      <th style={{ color: '#64748b' }}>Standard Price</th>
                      <th style={{ color: '#64748b' }}>Custom Proposal Price ($)</th>
                      <th style={{ color: '#64748b' }}>Proposal Discount (%)</th>
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
                              <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{p.scientificName}</span>
                            </td>
                            <td style={{ color: '#334155' }}>${p.pricePerKg.toFixed(2)}/{p.unit || storeConfig.unit}</td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={override.price}
                                onChange={(e) => handleOverridePriceChange(p.id, Number(e.target.value))}
                                className="luxury-input"
                                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100px', height: '32px' }}
                                disabled={!override.included}
                                required={override.included}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={override.discount || 0}
                                onChange={(e) => handleOverrideDiscountChange(p.id, Number(e.target.value))}
                                className="luxury-input"
                                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '80px', height: '32px' }}
                                disabled={!override.included}
                                required={override.included}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="submit" className={styles.btnMerchantPrimary}>
                  {editingCatalogId ? 'Save Proposal Deal' : 'Generate Custom Catalogue Proposal'}
                </button>
                <button
                  type="button"
                  className={styles.btnMerchantSecondary}
                  onClick={() => setShowGenerator(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.lightPanelCard}>
            {activeStoreId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                    🏪 Direct General Catalogue Link (All products at standard rates):
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No setup or proposal overrides required</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={getGeneralCatalogLink()}
                    style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', outline: 'none' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className={styles.btnMerchantPrimary}
                    style={{ padding: '0 16px', fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      const link = getGeneralCatalogLink();
                      navigator.clipboard.writeText(link).then(() => {
                        toast.success('General Catalogue link copied!');
                      });
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
                ⚠️ <strong>No active store established yet.</strong> Please establish a sourcing hub store to generate catalog links.
              </div>
            )}
            
            {customCatalogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📋</span>
                <strong>No custom client proposals generated yet.</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Click "+ Generate Custom Catalogue" at the top to configure custom quotes for target markets or buyers.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table className={styles.table}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ color: '#64748b' }}>Client / Target Market</th>
                      <th style={{ color: '#64748b' }}>Included Items</th>
                      <th style={{ color: '#64748b' }}>Global Discount</th>
                      <th style={{ color: '#64748b' }}>Delivery Fee</th>
                      <th style={{ color: '#64748b' }}>Notes</th>
                      <th style={{ color: '#64748b' }}>Created Date</th>
                      <th style={{ color: '#64748b', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customCatalogs.map(cat => {
                      const includedCount = Object.values(cat.overrides).filter(o => o.included).length;
                      return (
                        <tr key={cat.id}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{cat.marketName}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>ID: {cat.id}</span>
                          </td>
                          <td style={{ color: '#334155' }}>{includedCount} products</td>
                          <td style={{ color: cat.globalDiscount > 0 ? 'var(--accent-gold)' : '#64748b', fontWeight: 'bold' }}>
                            {cat.globalDiscount > 0 ? `${cat.globalDiscount}%` : 'Standard'}
                          </td>
                          <td style={{ color: '#334155' }}>
                            {cat.globalDelivery > 0 ? `$${cat.globalDelivery.toFixed(2)}` : 'Free'}
                          </td>
                          <td style={{ color: '#475569', fontSize: '0.85rem' }}>{cat.notes || '-'}</td>
                          <td style={{ color: '#64748b' }}>{cat.createdDate}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                type="button"
                                onClick={() => handleEditCustomCatalog(cat)}
                                className={styles.btnMerchantSecondary}
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleCopyCatalogLink(cat.id)}
                                className={styles.btnMerchantSecondary}
                                style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                              >
                                Copy Link
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteCustomCatalog(cat.id)}
                                className={styles.btnMerchantSecondary}
                                style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#fee2e2', color: '#ef4444' }}
                              >
                                Delete
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
          </div>
        )}
      </div>
    );
  };

  const renderMerchantSettings = () => {
    return (
      <div className={styles.merchantContainer}>
        <h2 className={styles.merchantTitle}>Store Customizer Settings</h2>
        <p className={styles.merchantSubtitle}>Configure your branding, categories, units, and custom spec labels.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
          {/* Left Panel: Form Settings */}
          <div className={styles.lightPanelCard}>
            <h3 className={styles.lightPanelTitle} style={{ marginBottom: '20px' }}>Customizer Configuration</h3>
            <form onSubmit={handleApplyConfig}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Business Store Name</label>
                  <input
                    type="text"
                    value={cfgStoreName}
                    onChange={(e) => setCfgStoreName(e.target.value)}
                    className={styles.lightInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tagline / Slogan</label>
                  <input
                    type="text"
                    value={cfgStoreTagline}
                    onChange={(e) => setCfgStoreTagline(e.target.value)}
                    className={styles.lightInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Primary Unit of Measurement</label>
                  <input
                    type="text"
                    value={cfgUnit}
                    onChange={(e) => setCfgUnit(e.target.value)}
                    className={styles.lightInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Niche Preset Type</label>
                  <select
                    value={cfgStoreType}
                    onChange={(e) => handlePresetChange(e.target.value as 'seafood' | 'egg' | 'generic' | 'clothing')}
                    className={styles.lightSelect}
                  >
                    <option value="seafood">Seafood Catch Niche</option>
                    <option value="egg">Poultry Egg Farm Niche</option>
                    <option value="clothing">Menswear Clothing Niche</option>
                    <option value="generic">General Bakery / Retail Niche</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Phone Number</label>
                  <input
                    type="text"
                    value={cfgStorePhone}
                    onChange={(e) => setCfgStorePhone(e.target.value)}
                    className={styles.lightInput}
                    placeholder="e.g. +1 555-0199"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Business Address</label>
                  <input
                    type="text"
                    value={cfgStoreAddress}
                    onChange={(e) => setCfgStoreAddress(e.target.value)}
                    className={styles.lightInput}
                    placeholder="e.g. Pier 17, Seattle, WA"
                  />
                </div>
              </div>

              {/* Dynamic Labels customizer */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '24px 0 12px 0', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>Catalog Field Label Overrides</h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Specimen/Item Name Label</label>
                  <input
                    type="text"
                    value={cfgSpecimenLabel}
                    onChange={(e) => setCfgSpecimenLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Scientific/Secondary Name Label</label>
                  <input
                    type="text"
                    value={cfgScientificNameLabel}
                    onChange={(e) => setCfgScientificNameLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Taste Profile/Spec 1 Label</label>
                  <input
                    type="text"
                    value={cfgTasteProfileLabel}
                    onChange={(e) => setCfgTasteProfileLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Texture/Spec 2 Label</label>
                  <input
                    type="text"
                    value={cfgTextureLabel}
                    onChange={(e) => setCfgTextureLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sustainability/Spec 3 Label</label>
                  <input
                    type="text"
                    value={cfgSustainabilityLabel}
                    onChange={(e) => setCfgSustainabilityLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Skill Level/Care Label</label>
                  <input
                    type="text"
                    value={cfgDifficultyLabel}
                    onChange={(e) => setCfgDifficultyLabel(e.target.value)}
                    className={styles.lightInput}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className={styles.btnMerchantPrimary}>
                  Save Settings & Update Layout
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Reseed & Proposals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Share Your Store Card removed */}

            <div className={styles.lightPanelCard}>
              <h3 className={styles.lightPanelTitle} style={{ color: '#ef4444' }}>Danger Zone</h3>

              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
                Deleting the store is permanent. This will erase the store configuration, all products inside the catalog, quote proposals, custom catalogs, customer orders, reviews, and enquiries.
              </p>
              <button 
                type="button" 
                onClick={handleDeleteStore} 
                className={styles.btnMerchantPrimary}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', width: '100%', justifyContent: 'center' }}
              >
                Delete Store
              </button>
            </div>

            <div className={styles.lightPanelCard}>
              <h3 className={styles.lightPanelTitle}>Custom Proposals ({customCatalogs.length})</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
                Configure specific quotes, discounts, and shareable catalog deals directly with your buyers.
              </p>
              <button 
                type="button"
                onClick={() => setAdminTab('catalogs')} 
                className={styles.btnMerchantSecondary}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Manage Proposal Deals
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  if (mounted && isAuthenticated && user) {
    return (
      <div className={styles.portalContainer}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.sidebarHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <img src="/logo-horizontal.svg" alt="CataCloud" style={{ height: '36px', display: 'block' }} />
              </div>
              <p className={styles.sidebarSubtitle}>
                {dashboardMode === 'buyer' ? 'Premium B2B Buyer Hub' : 'Premium B2B Merchant'}
              </p>
            </div>
            
            <nav className={styles.sidebarMenu}>
              {dashboardMode === 'buyer' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('dashboard'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'dashboard' ? styles.sidebarItemActive : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('orders'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'orders' ? styles.sidebarItemActive : ''}`}
                  >
                    <Package size={18} />
                    Order History
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('settings'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'settings' ? styles.sidebarItemActive : ''}`}
                  >
                    <Users size={18} />
                    My Profile
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('dashboard'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'dashboard' ? styles.sidebarItemActive : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('products'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'products' ? styles.sidebarItemActive : ''}`}
                  >
                    <Package size={18} />
                    Catalog
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('catalogs'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'catalogs' ? styles.sidebarItemActive : ''}`}
                  >
                    <FileText size={18} />
                    Catalogue Links
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('enquiries'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'enquiries' ? styles.sidebarItemActive : ''}`}
                  >
                    <MessageSquare size={18} />
                    Enquiries
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('pwa'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'pwa' ? styles.sidebarItemActive : ''}`}
                  >
                    <CreditCard size={18} />
                    PWA
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowStoreCreator(false); setAdminTab('settings'); }} 
                    className={`${styles.sidebarItem} ${adminTab === 'settings' ? styles.sidebarItemActive : ''}`}
                  >
                    <Settings size={18} />
                    Settings
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className={styles.sidebarFooter}>
            {user && user.avatar ? (
              <img src={user.avatar} alt={user.name} className={styles.sidebarAvatar} />
            ) : (
              <div className="h-10 w-10 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 border border-slate-600">
                {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className={styles.sidebarUserInfo}>
              <p className={styles.sidebarUserName}>{user ? user.name : 'Admin User'}</p>
              <p className={styles.sidebarUserRole}>
                {dashboardMode === 'buyer' 
                  ? 'CataCloud Buyer' 
                  : (user && user.role === 'admin' ? 'CataCloud Ops' : 'Verified Merchant')}
              </p>
            </div>
            <button 
              type="button" 
              onClick={handleLogout} 
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Right Content Panel */}
        <div className={styles.mainContent}>
          {/* Top Header */}
          <header className={styles.topHeader}>
            <div className={styles.topHeaderSearch}>
              <Search size={18} className={styles.topHeaderSearchIcon} />
              <input 
                type="text" 
                placeholder="Search transactions, products, or clients..." 
                className={styles.topHeaderInput}
              />
            </div>
            
            <div className={styles.topHeaderRight}>
              {/* Store Switcher Dropdown */}
              {userStores.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    id="store-select-portal"
                    value={activeStoreId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setActiveStoreId(newId);
                      localStorage.setItem(`catacloud_active_store_id_${user?.email || 'admin'}`, newId);
                      toast.info(`Switched active store context to "${userStores.find(s => s.id === newId)?.storeName}"`);
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
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
                type="button" 
                onClick={() => {
                  setDashboardMode('seller');
                  setShowStoreCreator(true);
                  toast.info('Opening Store Creation Wizard...');
                }} 
                className={styles.topHeaderBtn} 
                title="New Store"
              >
                <Plus size={18} />
              </button>
              
              <button 
                type="button" 
                onClick={() => toast.success('System Status', { description: 'All systems are fully operational. 4 new sourcing enquiries require attention.' })}
                className={styles.topHeaderBtn} 
                title="Notifications"
              >
                <Bell size={18} />
              </button>
              <button 
                type="button" 
                onClick={() => toast.info('Maritime Support Desk', { description: 'Tsukiji Sourcing support line: +1 (555) 019-2834. Port license: LIC-928374-B.' })}
                className={styles.topHeaderBtn} 
                title="Help"
              >
                <HelpCircle size={18} />
              </button>
              <div className={styles.topHeaderDivider} />
              <span className={styles.topHeaderPortalTitle}>CataCloud Portal</span>
              
              {/* Toggle dashboard mode */}
              {dashboardMode === 'buyer' ? (
                <button 
                  type="button"
                  onClick={() => {
                    setDashboardMode('seller');
                    setAdminTab('dashboard');
                  }}
                  className={styles.btnMerchantSecondary}
                  style={{ height: '34px', fontSize: '0.75rem', padding: '0 12px' }}
                >
                  💼 Store Manager
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setDashboardMode('buyer');
                    setAdminTab('dashboard');
                  }}
                  className={styles.btnMerchantSecondary}
                  style={{ height: '34px', fontSize: '0.75rem', padding: '0 12px' }}
                >
                  🛒 Buyer Panel
                </button>
              )}
            </div>
          </header>

          {/* Main Tab Renderings */}
          {dashboardMode === 'seller' ? (
            showStoreCreator ? (
              /* Onboarding Store Creator Wizard in Light Theme */
              <div className={styles.merchantContainer}>
                <h2 className={styles.merchantTitle}>Create Your Custom Store & Catalogues</h2>
                <p className={styles.merchantSubtitle}>Welcome! This platform allows you to build custom storefronts, manage inventories, and share private pricing lists.</p>
                
                <div className={styles.lightPanelCard} style={{ maxWidth: '640px', margin: '24px auto 0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <div>
                      <h4 style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, marginBottom: '4px' }}>🏪 1. Establish Your Store</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Create storefronts with custom measurement units.</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, marginBottom: '4px' }}>📦 2. Add Your Products</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Add products, track stock levels, and log offline sales.</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, marginBottom: '4px' }}>📄 3. Share Custom Catalogues</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Build targeted proposals for specific buyers.</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, marginBottom: '4px' }}>🙋 4. Receive Client Orders</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Buyers place orders or request custom volume quotes.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleCreateStore}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} htmlFor="onboard-name">Business Store Name</label>
                      <input
                        type="text"
                        id="onboard-name"
                        value={onboardName}
                        onChange={(e) => setOnboardName(e.target.value)}
                        placeholder="e.g. Sunrise Organic Eggs, Tsukiji Fresh Catch"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '0.9rem', marginTop: '6px' }}
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} htmlFor="onboard-tagline">Tagline / Slogan</label>
                      <input
                        type="text"
                        id="onboard-tagline"
                        value={onboardTagline}
                        onChange={(e) => setOnboardTagline(e.target.value)}
                        placeholder="e.g. Fresh Pasture-Raised Farm Goods"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '0.9rem', marginTop: '6px' }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} htmlFor="onboard-niche">Store Niche / Category Type</label>
                      <input
                        type="text"
                        id="onboard-niche"
                        value={onboardNiche}
                        onChange={(e) => setOnboardNiche(e.target.value)}
                        placeholder="e.g. Seafood, Eggs, Bakery, General"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '0.9rem', marginTop: '6px' }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }} htmlFor="onboard-unit">Primary Unit of Measurement</label>
                      <select
                        id="onboard-unit"
                        value={onboardUnit}
                        onChange={(e) => setOnboardUnit(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '0.9rem', marginTop: '6px' }}
                        required
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="box">box</option>
                        <option value="dozen">dozen</option>
                        <option value="pack">pack</option>
                        <option value="litres">litres</option>
                        <option value="meters">meters</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      {userStores.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowStoreCreator(false)}
                          className={styles.btnMerchantSecondary}
                          style={{ flex: 1, height: '42px', fontSize: '0.9rem' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={onboardSubmitting}
                        className={styles.btnMerchantSecondary}
                        style={{ flex: 2, height: '42px', fontSize: '0.9rem', background: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
                      >
                        {onboardSubmitting ? 'Establishing Hub...' : 'Establish Sourcing Hub'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <>
                {adminTab === 'dashboard' && renderMerchantDashboard()}
              {adminTab === 'products' && renderMerchantCatalog()}
              {adminTab === 'enquiries' && renderMerchantEnquiries()}
              {adminTab === 'pwa' && renderMerchantPWA()}
              {adminTab === 'settings' && renderMerchantSettings()}
              {adminTab === 'catalogs' && renderMerchantCatalogs()}
            </>
            )
          ) : (
            <>
              {adminTab === 'dashboard' && renderBuyerDashboard()}
              {adminTab === 'orders' && renderBuyerOrders()}
              {adminTab === 'settings' && renderBuyerProfile()}
            </>
          )}

          {/* Footer */}
          <footer className={styles.portalFooter}>
            <div>© 2026 CataCloud Maritime Systems. System Status: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Operational</span></div>
            <div className={styles.portalFooterLinks}>
              <a href="#support">Support</a>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </footer>
        </div>

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

              <form onSubmit={handleProductSubmit} id="portal-admin-product-form">
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-name">Name / Type</label>
                    <input
                      type="text"
                      id="portal-prod-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="luxury-input"
                      placeholder="e.g. Free-Range Large Brown Eggs"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-sci-name">{storeConfig.attributes.scientificNameLabel}</label>
                    <input
                      type="text"
                      id="portal-prod-sci-name"
                      value={formSciName}
                      onChange={(e) => setFormSciName(e.target.value)}
                      className="luxury-input"
                      placeholder="e.g. Grade AA Large"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-category">Category</label>
                    <select
                      id="portal-prod-category"
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
                    <label className={styles.label} htmlFor="portal-prod-unit">Unit of Measurement</label>
                    <select
                      id="portal-prod-unit"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="luxury-input"
                      style={{ appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="box">box</option>
                      <option value="dozen">dozen</option>
                      <option value="pack">pack</option>
                      <option value="litres">litres</option>
                      <option value="meters">meters</option>
                      <option value="g">g</option>
                      <option value="lbs">lbs</option>
                      <option value="ml">ml</option>
                      <option value="jar">jar</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-price">Price Per Unit ($ / {formUnit})</label>
                    <input
                      type="number"
                      step="0.01"
                      id="portal-prod-price"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="luxury-input"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-origin">Origin / Source</label>
                    <input
                      type="text"
                      id="portal-prod-origin"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      className="luxury-input"
                      placeholder="e.g. Sunshine Valley Farms"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="portal-prod-stock">Current Stock ({formUnit})</label>
                    <input
                      type="number"
                      id="portal-prod-stock"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="luxury-input"
                      required
                    />
                  </div>
                  <div className={`${styles.formGroup} styles.formGroupFull`}>
                    <label className={styles.label} htmlFor="portal-prod-image">Image Path or URL</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                      <input
                        type="text"
                        id="portal-prod-image"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className="luxury-input"
                        style={{ flex: 1 }}
                        placeholder="https://images.unsplash.com/... or /images/..."
                        required
                      />
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={isUploading}
                          style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {isUploading ? (
                            <>
                              <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                              Upload File
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${styles.formGroup} styles.formGroupFull`}>
                  <label className={styles.label} htmlFor="portal-prod-description">Description</label>
                  <textarea
                    id="portal-prod-description"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="luxury-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Enter detailed description..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="portal-prod-taste">{storeConfig.attributes.tasteProfileLabel} (Comma Separated)</label>
                  <input
                    type="text"
                    id="portal-prod-taste"
                    value={formTaste}
                    onChange={(e) => setFormTaste(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Pasture Raised, Organic Feed"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="portal-prod-texture">{storeConfig.attributes.textureLabel}</label>
                  <input
                    type="text"
                    id="portal-prod-texture"
                    value={formTexture}
                    onChange={(e) => setFormTexture(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Deep orange yolk"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="portal-prod-sustainability">{storeConfig.attributes.sustainabilityLabel}</label>
                  <input
                    type="text"
                    id="portal-prod-sustainability"
                    value={formSustainability}
                    onChange={(e) => setFormSustainability(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Free-Range"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="portal-prod-prep">
                    {storeConfig.storeType === 'seafood' ? 'Prep Time' : 'Handling / Storage'}
                  </label>
                  <input
                    type="text"
                    id="portal-prod-prep"
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Keep refrigerated (3-5°C)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="portal-prod-difficulty">
                    {storeConfig.storeType === 'seafood' ? 'Preparation Skill Level' : 'Care Level'}
                  </label>
                  <input
                    type="text"
                    id="portal-prod-difficulty"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="luxury-input"
                    placeholder="e.g. Easy"
                  />
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
                    id="portal-admin-product-submit-btn"
                  >
                    {editingProduct ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isBulkModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsBulkModalOpen(false)}>
            <div className={`${styles.modalContent} glassmorphism`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <header className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>📥 Bulk Upload Products</h2>
                <button className={styles.modalCloseBtn} onClick={() => setIsBulkModalOpen(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </header>

              <form onSubmit={handleBulkUpload}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className={styles.label} style={{ margin: 0 }}>Product List CSV</label>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCSV}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      📥 Download Sample CSV
                    </button>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                    <label
                      htmlFor="bulk-csv-file-input-portal"
                      className="btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        gap: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      📁 Choose CSV or Excel File
                    </label>
                    <input
                      type="file"
                      id="bulk-csv-file-input-portal"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      or paste the CSV/Excel data below
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px' }}>
                    💡 <strong>Example format:</strong><br />
                    <code>Name, Price, Category, Stock</code><br />
                    <code>Premium Atlantic Halibut, 24.50, Seafood, 150</code><br />
                    <code>Organic Free-Range Dozen Eggs, 8.50, Poultry, 20</code>
                  </div>

                  <textarea
                    value={bulkCSVText}
                    onChange={(e) => setBulkCSVText(e.target.value)}
                    className="luxury-input"
                    style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', padding: '12px' }}
                    placeholder="Name, Price, Category, Stock&#10;Product A, 19.99, Seafood, 25&#10;Product B, 45.00, Seafood, 10"
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    onClick={() => setIsBulkModalOpen(false)} 
                    className="btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                  >
                    Upload Products
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar
        cartCount={0}
        onCartToggle={() => {}}
        onLogout={handleLogout}
        storeId={activeStoreId || 'catacloud'}
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
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(5, 12, 26, 0.6)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setDashboardMode('buyer')}
              style={{
                background: (dashboardMode as string) === 'buyer' ? 'var(--gradient-gold)' : 'transparent',
                color: (dashboardMode as string) === 'buyer' ? '#030812' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-smooth)',
                boxShadow: (dashboardMode as string) === 'buyer' ? '0 2px 10px rgba(226, 183, 68, 0.2)' : 'none'
              }}
            >
              🛒 Buyer Panel
            </button>
            <button
              onClick={() => setDashboardMode('seller')}
              style={{
                background: (dashboardMode as string) === 'seller' ? 'var(--gradient-premium)' : 'transparent',
                color: (dashboardMode as string) === 'seller' ? '#030812' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-smooth)',
                boxShadow: (dashboardMode as string) === 'seller' ? '0 2px 10px rgba(0, 242, 254, 0.2)' : 'none'
              }}
            >
              💼 Store Manager
            </button>
          </div>
        </div>

        {/* Display Seller Dashboard or Onboarding Form */}
        {(dashboardMode as string) === 'seller' ? (
          showStoreCreator ? (
            /* Onboarding Store Creator Wizard */
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', width: '100%' }}>
              <div className="glassmorphism" style={{ maxWidth: '600px', width: '100%', padding: '32px', borderRadius: '16px', border: '1px solid var(--accent-gold)' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '12px', textAlign: 'center', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Create Your Custom Store & Catalogues
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Welcome! This platform allows you to build custom storefronts, manage inventories for any niche (e.g. Seafood, Eggs, Bakery, or general retail), and share private custom catalogues/pricing lists directly with your clients.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '6px' }}>🏪 1. Establish Your Store</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Create niche-specific storefronts with custom measurement units (kg, dozen, pcs) and labels.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '6px' }}>📦 2. Add Your Products</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Add products, track stock levels, and log offline sales via the PWA terminal.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '6px' }}>📄 3. Share Custom Catalogues</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Build targeted catalogs/proposals for specific buyers with custom discounts and minimum thresholds.</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '6px' }}>🙋 4. Receive Client Orders</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Buyers place orders or request custom volume quotes from your public page directly to your dashboard.</p>
                  </div>
                </div>
                
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
                    <select
                      id="onboard-unit"
                      value={onboardUnit}
                      onChange={(e) => setOnboardUnit(e.target.value)}
                      className="luxury-input"
                      required
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="box">box</option>
                      <option value="dozen">dozen</option>
                      <option value="pack">pack</option>
                      <option value="litres">litres</option>
                      <option value="meters">meters</option>
                    </select>
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
                          localStorage.setItem(`catacloud_active_store_id_${user.email}`, newId);
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

              {/* Platform Explanation Alert Panel */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
                <span style={{ fontSize: '1.5rem', marginTop: '-2px' }}>💡</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>B2B Store & Sourcing Hub Platform</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    This platform allows you to create niche-specific storefronts (like Seafood, Eggs, or general retail), add and manage inventory, and generate custom catalogs/proposals to share with your clients. Use the switcher at the top-right to create or switch between multiple business stores.
                  </p>
                </div>
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>{storeConfig.attributes.specimenLabel} Varieties</span>
                  <Target size={18} style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue}>{products.length}</span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Active in catalogue</span>
                </div>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Available Stock</span>
                  <Package size={18} style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue}>{adminTotalStock} <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>{storeConfig.unit}</span></span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>
                    {storeConfig.storeType === 'seafood' ? 'Across Tsukiji / North Atlantic ports' : 'Across regional distribution centers'}
                  </span>
                </div>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Active Shipments</span>
                  <Clock size={18} style={{ color: 'var(--accent-cyan)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>{adminActiveOrders}</span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Pending or Dispatched</span>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Total Sourced Value</span>
                  <DollarSign size={18} style={{ color: 'var(--accent-gold)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue} style={{ color: 'var(--accent-gold)' }}>${adminTotalRevenue.toFixed(2)}</span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Orders from all partner Buyers</span>
                </div>
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
                onClick={() => setAdminTab('pwa')}
                className={`${styles.tabBtn} ${adminTab === 'pwa' ? styles.tabBtnActive : ''}`}
                id="admin-tab-pwa"
              >
                ⚡ Sell Products (PWA)
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
                                    <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} className={styles.itemImage} />
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

            {/* PWA Point of Sale Section */}
            {adminTab === 'pwa' && (
              <section className={`${styles.sectionCard} glassmorphism`}>
                <h2 className={styles.sectionTitle}>⚡ Progressive Web Application (PWA) & Billing</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                  Register direct sales, customize client billing names, and automatically deduct sourced quantities from active catalogue inventory stocks.
                </p>

                {pwaReceipt && (
                  <div className="glassmorphism" style={{ border: '2px solid var(--accent-gold)', borderRadius: '16px', padding: '24px', marginBottom: '32px', background: 'rgba(226, 183, 68, 0.03)', position: 'relative' }}>
                    <button 
                      onClick={() => setPwaReceipt(null)}
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
                        <span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span> <strong style={{ color: 'var(--text-primary)' }}>{pwaReceipt.id}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Date:</span> <strong style={{ color: 'var(--text-primary)' }}>{pwaReceipt.date}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Client:</span> <strong style={{ color: 'var(--text-primary)' }}>{pwaReceipt.userName}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Method:</span> <strong style={{ color: 'var(--accent-cyan)' }}>{pwaReceipt.address.replace('In-Store Sales (', '').replace(')', '')}</strong>
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
                        {pwaReceipt.items.map((item, idx) => (
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
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${pwaReceipt.totalPrice.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Taxes & Levies:</span>{' '}
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>Included</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '8px' }}>
                        <span>Total Bill Amount:</span>{' '}
                        <span>${pwaReceipt.totalPrice.toFixed(2)}</span>
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
                        onClick={() => setPwaReceipt(null)}
                        className="btn-gold"
                        style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem' }}
                      >
                        Create New PWA Sale
                      </button>
                    </div>
                  </div>
                )}

                {/* PWA Dashboard control panel */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  
                  {/* Card 1: Network & Offline simulation */}
                  <div className="glassmorphism" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Network Status</span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: pwaIsOffline ? 'var(--accent-gold)' : 'var(--accent-success)',
                          background: pwaIsOffline ? 'rgba(226,183,68,0.1)' : 'rgba(34,197,94,0.1)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${pwaIsOffline ? 'rgba(226,183,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pwaIsOffline ? 'var(--accent-gold)' : 'var(--accent-success)', display: 'inline-block' }}></span>
                          {pwaIsOffline ? 'Offline Mode' : 'Online'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>
                        {pwaIsOffline ? '⚡ Simulated Offline POS' : '🌐 Connected to CataCloud'}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                        {pwaIsOffline 
                          ? 'Products and inventories are fetched from offline local cache. Sales are queued locally in browser.' 
                          : 'Syncing live products, inventories, and processing invoices in real-time with your cloud database.'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newOffline = !pwaIsOffline;
                        setPwaIsOffline(newOffline);
                        if (!newOffline) {
                          syncOfflineOrders();
                        } else {
                          toast.warning('Switched to Offline Mode', {
                            description: 'Simulating disconnected database state.'
                          });
                        }
                      }}
                      className="btn-secondary"
                      style={{ marginTop: '14px', width: '100%', fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      {pwaIsOffline ? '🔌 Go Online & Sync' : '✈️ Simulate Offline Mode'}
                    </button>
                  </div>

                  {/* Card 2: App Installation & Standalone */}
                  <div className="glassmorphism" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Install Status</span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: (pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'var(--accent-cyan)' : 'var(--accent-gold)',
                          background: (pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'rgba(0,180,216,0.1)' : 'rgba(226,183,68,0.1)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'rgba(0,180,216,0.2)' : 'rgba(226,183,68,0.2)'}`
                        }}>
                          {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? 'Standalone Active' : 'Installable'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>
                        {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ? '📱 Standalone Native App' : '💻 Running in Browser'}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                        {(pwaIsInstalled || typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches)
                          ? 'Running as a standalone native app on your desktop/mobile home screen with custom shell.' 
                          : 'Install CataCloud on your home screen or desktop taskbar to run offline with native app shell.'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (pwaInstallPrompt) {
                          pwaInstallPrompt.prompt();
                          pwaInstallPrompt.userChoice.then((choiceResult: any) => {
                            if (choiceResult.outcome === 'accepted') {
                              toast.success('Thank you for installing CataCloud!');
                              setPwaIsInstalled(true);
                            }
                            setPwaInstallPrompt(null);
                          });
                        } else {
                          toast.info('How to install CataCloud PWA:', {
                            description: 'Click the Install icon ⊕ in your browser address bar or click "Add to Home Screen" in your browser menu.'
                          });
                        }
                      }}
                      className="btn-primary"
                      style={{ marginTop: '14px', width: '100%', fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      {pwaInstallPrompt ? '📥 Install Native App' : '📲 How to Install App'}
                    </button>
                  </div>

                  {/* Card 3: Storage, Sync & Cache Stats */}
                  <div className="glassmorphism" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Offline Storage</span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: pwaSyncQueue.length > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
                          background: pwaSyncQueue.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${pwaSyncQueue.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                        }}>
                          {pwaSyncQueue.length} Pending Sales
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>
                        📦 Offline Cache & Storage Stats
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>Products Cached: <strong>{products.length} items</strong></div>
                        <div>Storage Usage: <strong>~{(JSON.stringify(products).length / 1024).toFixed(1)} KB</strong></div>
                        <div>Sync Queue: <strong>{pwaSyncQueue.length} transactions</strong></div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          toast.info('Refreshing local storage offline cache...');
                          const prods = await getProducts(activeStoreId);
                          setProducts(prods);
                          toast.success('Offline cache refreshed!', { description: `${prods.length} products cached.` });
                        }}
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        🔄 Refresh Cache
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => syncOfflineOrders()}
                        disabled={pwaSyncQueue.length === 0 || pwaIsOffline}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px', opacity: (pwaSyncQueue.length === 0 || pwaIsOffline) ? 0.5 : 1 }}
                      >
                        ☁️ Sync Queue
                      </button>
                    </div>
                  </div>

                </div>

                <div className={styles.splitLayout} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
                  {/* Left Column: PWA Catalog List */}
                  <div className="glassmorphism" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <input 
                        type="text"
                        value={pwaSearch}
                        onChange={(e) => setPwaSearch(e.target.value)}
                        placeholder="Search PWA items..."
                        className="luxury-input"
                        style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                      />
                      <select 
                        value={pwaCategory}
                        onChange={(e) => setPwaCategory(e.target.value)}
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
                            const matchCat = pwaCategory === 'All' || p.category === pwaCategory;
                            const matchSearch = p.name.toLowerCase().includes(pwaSearch.toLowerCase()) ||
                              p.scientificName.toLowerCase().includes(pwaSearch.toLowerCase());
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
                                <img src={p.image || IMAGE_PLACEHOLDER} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {p.stock <= 0 && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    Out of Stock
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0', wordBreak: 'normal', overflowWrap: 'normal' }}>{p.name}</h4>
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
                                onClick={() => handleAddToPwaCart(p)}
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

                  {/* Right Column: PWA Cart Drawer Panel */}
                  <div className="glassmorphism" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      Cart Bill Breakdown
                    </h3>

                    {pwaCart.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span>🛒 PWA Cart is Empty</span>
                        <span style={{ fontSize: '0.75rem' }}>Select products on the left to start a billing session.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
                        {pwaCart.map((item) => (
                          <div key={item.fish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.fish.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.fish.pricePerKg.toFixed(2)} / {item.fish.unit || storeConfig.unit}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                              <button 
                                type="button"
                                onClick={() => handleUpdatePwaQuantity(item.fish.id, item.quantity - 1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => handleUpdatePwaQuantity(item.fish.id, item.quantity + 1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                +
                              </button>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>${(item.fish.pricePerKg * item.quantity).toFixed(2)}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFromPwaCart(item.fish.id)}
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
                          value={pwaCustomerName}
                          onChange={(e) => setPwaCustomerName(e.target.value)}
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
                              onClick={() => setPwaPaymentMethod(method)}
                              style={{
                                height: '32px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderColor: pwaPaymentMethod === method ? 'var(--accent-cyan)' : 'var(--glass-border)',
                                color: pwaPaymentMethod === method ? '#030812' : 'var(--text-secondary)',
                                background: pwaPaymentMethod === method ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.01)'
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
                          ${pwaCart.reduce((sum, item) => sum + item.fish.pricePerKg * item.quantity, 0).toFixed(2)}
                        </strong>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => handleCompletePwaSale(e)}
                        disabled={pwaCart.length === 0}
                        className="btn-cyan" 
                        style={{ width: '100%', height: '40px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}
                      >
                        🧾 Complete PWA Sale & Bill
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
                              <img src={prod.image || IMAGE_PLACEHOLDER} alt={prod.name} className={styles.productImg} />
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

            {/* Custom Catalogues Section removed from here */}





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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Sourced Quantity</span>
                  <Package size={18} style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue}>{totalWeightSourced} <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>{storeConfig.unit}</span></span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>{storeConfig.storeType === 'seafood' ? 'Premium marine species' : 'Premium products'}</span>
                </div>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Sourcing Investment</span>
                  <DollarSign size={18} style={{ color: 'var(--accent-cyan)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue} style={{ color: 'var(--accent-cyan)' }}>${totalSourcingValue.toFixed(2)}</span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Total catalog investment</span>
                </div>
              </div>
              <div className={`${styles.statCard} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Sustainability Profile</span>
                  <Activity size={18} style={{ color: 'var(--accent-success)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue} style={{ color: 'var(--accent-success)' }}>{sustainabilityScore}</span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Ethical sourcing</span>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGold} glassmorphism`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.statLabel}>Account Tier</span>
                  <ShieldCheck size={18} style={{ color: 'var(--accent-gold)', opacity: 0.8 }} />
                </div>
                <div>
                  <span className={styles.statValue} style={{ color: 'var(--accent-gold)', fontSize: '1.6rem' }}>
                    {totalSourcingValue > 1000 ? 'Elite Member' : totalSourcingValue > 500 ? 'Preferred Partner' : 'General Partner'}
                  </span>
                  <span className={styles.statSubtext} style={{ display: 'block' }}>Account tier status</span>
                </div>
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
                                    <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} className={styles.itemImage} />
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
                  <select
                    id="prod-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="luxury-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="dozen">dozen</option>
                    <option value="pack">pack</option>
                    <option value="litres">litres</option>
                    <option value="meters">meters</option>
                    <option value="g">g</option>
                    <option value="lbs">lbs</option>
                    <option value="ml">ml</option>
                    <option value="jar">jar</option>
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
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                    <input
                      type="text"
                      id="prod-image"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="luxury-input"
                      style={{ flex: 1 }}
                      placeholder="https://images.unsplash.com/... or /images/..."
                      required
                    />
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={isUploading}
                        style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {isUploading ? (
                          <>
                            <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Upload File
                          </>
                        )}
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
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
      )}      {isBulkModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsBulkModalOpen(false)}>
          <div className={`${styles.modalContent} glassmorphism`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <header className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📥 Bulk Upload Products</h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsBulkModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleBulkUpload}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className={styles.label} style={{ margin: 0 }}>Product List CSV</label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    📥 Download Sample CSV
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                  <label
                    htmlFor="bulk-csv-file-input-fallback"
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      gap: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    📁 Choose CSV or Excel File
                  </label>
                  <input
                    type="file"
                    id="bulk-csv-file-input-fallback"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    or paste the CSV/Excel data below
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px' }}>
                  💡 <strong>Example format:</strong><br />
                  <code>Name, Price, Category, Stock</code><br />
                  <code>Premium Atlantic Halibut, 24.50, Seafood, 150</code><br />
                  <code>Organic Free-Range Dozen Eggs, 8.50, Poultry, 20</code>
                </div>

                <textarea
                  value={bulkCSVText}
                  onChange={(e) => setBulkCSVText(e.target.value)}
                  className="luxury-input"
                  style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', padding: '12px' }}
                  placeholder="Name, Price, Category, Stock&#10;Product A, 19.99, Seafood, 25&#10;Product B, 45.00, Seafood, 10"
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => setIsBulkModalOpen(false)} 
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Upload Products
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
