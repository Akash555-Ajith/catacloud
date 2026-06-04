import { fishData, FishItem } from '@/data/fishData';
import { StoreConfig, SEAFOOD_PRESET, EGG_PRESET, GENERIC_PRESET, eggSeedData, genericSeedData } from '@/data/storeConfig';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface OrderItem {
  fishId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string; // e.g. BF-123456
  userEmail: string;
  userName: string;
  date: string;
  deliveryDate: string;
  address: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Dispatched' | 'Delivered';
  store_id?: string;
}

export interface CustomCatalog {
  id: string; // e.g. cat-quote-123456
  marketName: string;
  notes: string;
  createdDate: string;
  globalDiscount: number; // in %
  globalDelivery: number; // flat fee
  overrides: {
    [productId: string]: {
      customPrice: number;
      customStock: number;
      customDiscount: number; // in %
      customVolumeThreshold: number; // minimum quantity to trigger volume discount
      customVolumeDiscount: number; // volume discount percentage (in %)
      included: boolean;
    }
  };
  store_id?: string;
}

export interface Proposal {
  id: string;
  marketName: string;
  fishId: string;
  customPrice: number;
  discount: number; // in %
  shippingCharge: number;
  notes: string;
  createdDate: string;
  volumeThreshold: number; // volume discount threshold quantity
  volumeDiscount: number; // volume discount percentage (in %)
  store_id?: string;
}

// Check if we are running in the browser
const isBrowser = () => typeof window !== 'undefined';

function getPresetDefault(storeId: string): StoreConfig {
  const cleanId = storeId.toLowerCase();
  if (cleanId.includes('egg')) {
    return { ...EGG_PRESET, id: storeId };
  }
  if (cleanId.includes('bakery') || cleanId.includes('bread') || cleanId.includes('shop') || cleanId.includes('niche')) {
    return { ...GENERIC_PRESET, id: storeId };
  }
  return { ...SEAFOOD_PRESET, id: storeId };
}

export function getSeedData(type: string): FishItem[] {
  if (type === 'egg') return eggSeedData;
  if (type === 'generic') return genericSeedData;
  return fishData;
}

export async function getStoreConfig(storeId: string = 'bluefine'): Promise<StoreConfig> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('store_config').select('*').eq('id', storeId).maybeSingle();
      if (!error && data) {
        return data as StoreConfig;
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return getPresetDefault(storeId);
  const stored = localStorage.getItem(`bluefine_store_config_${storeId}`);
  if (!stored) {
    const preset = getPresetDefault(storeId);
    localStorage.setItem(`bluefine_store_config_${storeId}`, JSON.stringify(preset));
    return preset;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return getPresetDefault(storeId);
  }
}

export async function saveStoreConfig(storeId: string, config: StoreConfig): Promise<void> {
  const configWithId = { id: storeId, ...config };
  if (isSupabaseConfigured) {
    try {
      await supabase.from('store_config').upsert(configWithId);
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_store_config_${storeId}`, JSON.stringify(configWithId));
  window.dispatchEvent(new CustomEvent('store-config-updated', { detail: { storeId } }));
}

export async function getStoresOwnedByUser(email: string): Promise<StoreConfig[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .eq('owner_email', email.toLowerCase());
      if (!error && data) {
        return data as StoreConfig[];
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return [];
  const stores: StoreConfig[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('bluefine_store_config_')) {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const config = JSON.parse(val) as StoreConfig;
          if (config.ownerEmail?.toLowerCase() === email.toLowerCase()) {
            stores.push(config);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
  
  // Add default 'bluefine' if email is admin@gmail.com and it doesn't exist
  if (email.toLowerCase() === 'admin@gmail.com' && !stores.some(s => s.id === 'bluefine')) {
    const defaultStore = { ...SEAFOOD_PRESET, id: 'bluefine', ownerEmail: 'admin@gmail.com' };
    stores.unshift(defaultStore);
  }
  
  return stores;
}

export async function getProducts(storeId: string = 'bluefine'): Promise<FishItem[]> {
  const config = await getStoreConfig(storeId);
  const seed = getSeedData(config.storeType);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('store_id', storeId);
      if (error) throw error;
      
      // Automatic Seeding: Seed products on first run if database is empty for this store
      if (!data || data.length === 0) {
        const seedWithStore = seed.map(item => ({ ...item, store_id: storeId }));
        const { error: seedError } = await supabase.from('products').insert(seedWithStore);
        if (seedError) {
          if (seedError.code === 'PGRST204') {
            console.warn('Supabase products table is missing "unit" or "store_id" column. Retrying seed without "unit".');
            const { error: retryError } = await supabase
              .from('products')
              .insert(seedWithStore.map(({ unit, ...rest }) => rest));
            if (retryError) console.error('Failed to retry seed:', retryError);
          } else {
            console.warn('Failed to seed products in Supabase:', seedError);
          }
        }
        return seed;
      }
      return data as FishItem[];
    } catch (err) {
      console.warn('Error fetching products from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return seed;
  const stored = localStorage.getItem(`bluefine_products_${storeId}`);
  if (!stored) {
    localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return seed;
  }
}

export async function saveProducts(products: FishItem[], storeId: string = 'bluefine'): Promise<void> {
  const productsWithStore = products.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').upsert(productsWithStore);
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('Supabase products table is missing column. Retrying upsert without "unit".');
          const { error: retryError } = await supabase
            .from('products')
            .upsert(productsWithStore.map(({ unit, ...rest }) => rest));
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.warn('Error saving products to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(products));
}

export async function addProduct(product: FishItem, storeId: string = 'bluefine'): Promise<void> {
  const productWithStore = { ...product, store_id: storeId };
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').insert(productWithStore);
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('Supabase products table is missing column. Retrying insert without "unit".');
          const { unit, ...rest } = productWithStore;
          const { error: retryError } = await supabase.from('products').insert(rest);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.warn('Error adding product to Supabase:', err);
    }
  }

  const products = await getProducts(storeId);
  products.push(product);
  await saveProducts(products, storeId);
}

export async function updateProduct(updatedProduct: FishItem, storeId: string = 'bluefine'): Promise<void> {
  const productWithStore = { ...updatedProduct, store_id: storeId };
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('products')
        .update(productWithStore)
        .eq('id', updatedProduct.id)
        .eq('store_id', storeId);
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('Supabase products table is missing column. Retrying update without "unit".');
          const { unit, ...rest } = productWithStore;
          const { error: retryError } = await supabase
            .from('products')
            .update(rest)
            .eq('id', updatedProduct.id)
            .eq('store_id', storeId);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.warn('Error updating product in Supabase:', err);
    }
  }

  const products = await getProducts(storeId);
  const index = products.findIndex((p) => p.id === updatedProduct.id);
  if (index > -1) {
    products[index] = updatedProduct;
    await saveProducts(products, storeId);
  }
}

export async function deleteProduct(id: string, storeId: string = 'bluefine'): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('store_id', storeId);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error deleting product in Supabase:', err);
    }
  }

  const products = await getProducts(storeId);
  const filtered = products.filter((p) => p.id !== id);
  await saveProducts(filtered, storeId);
}

export async function getOrders(storeId: string = 'bluefine'): Promise<Order[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('store_id', storeId);
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      console.warn('Error fetching orders from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`bluefine_orders_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveOrders(orders: Order[], storeId: string = 'bluefine'): Promise<void> {
  const ordersWithStore = orders.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('orders').upsert(ordersWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error saving orders to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_orders_${storeId}`, JSON.stringify(orders));
}

export async function addOrder(order: Order, storeId: string = 'bluefine'): Promise<void> {
  const orderWithStore = { ...order, store_id: storeId };
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('orders').insert(orderWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error adding order to Supabase:', err);
    }
  }

  const orders = await getOrders(storeId);
  orders.unshift(order);
  await saveOrders(orders, storeId);
}

export async function getOrdersForBuyer(email: string): Promise<Order[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('userEmail', email.toLowerCase());
      if (!error && data) {
        return data as Order[];
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return [];
  const allOrders: Order[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('bluefine_orders_')) {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val) as Order[];
          parsed.forEach(o => {
            if (o.userEmail.toLowerCase() === email.toLowerCase()) {
              allOrders.push(o);
            }
          });
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return allOrders;
}

export async function updateOrderStatus(
  orderId: string, 
  status: 'Pending' | 'Dispatched' | 'Delivered', 
  storeId: string = 'bluefine'
): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .eq('store_id', storeId);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error updating order status in Supabase:', err);
    }
  }

  const orders = await getOrders(storeId);
  const index = orders.findIndex((o) => o.id === orderId);
  if (index > -1) {
    orders[index].status = status;
    await saveOrders(orders, storeId);
  }
}

export async function getProposals(storeId: string = 'bluefine'): Promise<Proposal[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('proposals').select('*').eq('store_id', storeId);
      if (error) throw error;
      return (data || []) as Proposal[];
    } catch (err) {
      console.warn('Error fetching proposals from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`bluefine_proposals_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveProposals(proposals: Proposal[], storeId: string = 'bluefine'): Promise<void> {
  const proposalsWithStore = proposals.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').upsert(proposalsWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error saving proposals to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_proposals_${storeId}`, JSON.stringify(proposals));
}

export async function addProposal(proposal: Proposal, storeId: string = 'bluefine'): Promise<void> {
  const proposalWithStore = { ...proposal, store_id: storeId };
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').insert(proposalWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error adding proposal to Supabase:', err);
    }
  }

  const proposals = await getProposals(storeId);
  proposals.unshift(proposalWithStore);
  await saveProposals(proposals, storeId);
}

export async function getProposalById(id: string, storeId: string = 'bluefine'): Promise<Proposal | undefined> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data ? (data as Proposal) : undefined;
    } catch (err) {
      console.warn('Error fetching proposal by ID from Supabase:', err);
    }
  }

  const proposals = await getProposals(storeId);
  return proposals.find((p) => p.id === id);
}

export async function deleteProposal(id: string, storeId: string = 'bluefine'): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id).eq('store_id', storeId);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error deleting proposal in Supabase:', err);
    }
  }

  const proposals = await getProposals(storeId);
  const filtered = proposals.filter((p) => p.id !== id);
  await saveProposals(filtered, storeId);
}

export async function getCustomCatalogs(storeId: string = 'bluefine'): Promise<CustomCatalog[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('custom_catalogs').select('*').eq('store_id', storeId);
      if (error) throw error;
      return (data || []) as CustomCatalog[];
    } catch (err) {
      console.warn('Error fetching custom catalogs from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`bluefine_custom_catalogs_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveCustomCatalogs(catalogs: CustomCatalog[], storeId: string = 'bluefine'): Promise<void> {
  const catalogsWithStore = catalogs.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').upsert(catalogsWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error saving custom catalogs to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_custom_catalogs_${storeId}`, JSON.stringify(catalogs));
}

export async function addCustomCatalog(catalog: CustomCatalog, storeId: string = 'bluefine'): Promise<void> {
  const catalogWithStore = { ...catalog, store_id: storeId };
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').insert(catalogWithStore);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error adding custom catalog to Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  catalogs.unshift(catalogWithStore);
  await saveCustomCatalogs(catalogs, storeId);
}

export async function getCustomCatalogById(id: string, storeId: string = 'bluefine'): Promise<CustomCatalog | undefined> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('custom_catalogs')
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data ? (data as CustomCatalog) : undefined;
    } catch (err) {
      console.warn('Error fetching custom catalog by ID from Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  return catalogs.find((c) => c.id === id);
}

export async function deleteCustomCatalog(id: string, storeId: string = 'bluefine'): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').delete().eq('id', id).eq('store_id', storeId);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Error deleting custom catalog in Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  const filtered = catalogs.filter((c) => c.id !== id);
  await saveCustomCatalogs(filtered, storeId);
}

export interface ETAPrediction {
  totalDays: number;
  transitDays: number;
  stockDelayDays: number;
  explanation: string;
  targetDateString: string; // YYYY-MM-DD
}

export function calculateSourcingETA(
  origin: string,
  destination: string,
  requestedQty: number,
  availableStock: number
): ETAPrediction {
  const cleanOrigin = (origin || '').toLowerCase();
  const cleanDest = (destination || '').toLowerCase();

  let transitDays = 8; // default transit
  let explanation = '';

  if (cleanDest.length > 0) {
    if (cleanDest.includes('japan') || cleanDest.includes('tokyo') || cleanDest.includes('tsukiji') || cleanDest.includes('hokkaido')) {
      if (cleanOrigin.includes('japan') || cleanOrigin.includes('hokkaido')) {
        transitDays = 4;
        explanation = 'Local Sea-Transit (3-5 days)';
      } else if (cleanOrigin.includes('usa') || cleanOrigin.includes('alaska') || cleanOrigin.includes('maine') || cleanOrigin.includes('mexico')) {
        transitDays = 12;
        explanation = 'Cross-Pacific Air Cargo (10-14 days)';
      } else {
        transitDays = 15;
        explanation = 'Intercontinental Sea-Freight (14-16 days)';
      }
    } else if (
      cleanDest.includes('usa') ||
      cleanDest.includes('united states') ||
      cleanDest.includes('america') ||
      cleanDest.includes('new york') ||
      cleanDest.includes('ny') ||
      cleanDest.includes('alaska') ||
      cleanDest.includes('maine') ||
      cleanDest.includes('texas') ||
      cleanDest.includes('california')
    ) {
      if (cleanOrigin.includes('usa') || cleanOrigin.includes('alaska') || cleanOrigin.includes('maine') || cleanOrigin.includes('mexico')) {
        transitDays = 5;
        explanation = 'Domestic Freight (4-6 days)';
      } else if (cleanOrigin.includes('japan') || cleanOrigin.includes('hokkaido')) {
        transitDays = 13;
        explanation = 'Cross-Pacific Air Cargo (12-14 days)';
      } else {
        transitDays = 14;
        explanation = 'Cross-Atlantic Sea-Freight (12-15 days)';
      }
    } else {
      transitDays = 9;
      explanation = 'Standard International Cargo (8-10 days)';
    }
  } else {
    transitDays = 8;
    explanation = 'Pending address input...';
  }

  const stockDelayDays = (requestedQty > availableStock || requestedQty <= 0 || availableStock <= 0) ? 14 : 0;
  const totalDays = transitDays + stockDelayDays;

  if (stockDelayDays > 0) {
    explanation += ` + Sourcing Delay (+14 days due to stock shortfall: requested/allocated ${requestedQty} but only ${availableStock} in stock)`;
  } else {
    explanation += ' + Sourced from Available Stock (No delay)';
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + totalDays);
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const targetDateString = `${year}-${month}-${day}`;

  return {
    totalDays,
    transitDays,
    stockDelayDays,
    explanation,
    targetDateString
  };
}

export async function reseedProducts(storeType: 'seafood' | 'egg' | 'generic', storeId: string = 'bluefine'): Promise<FishItem[]> {
  const seed = getSeedData(storeType);
  const seedWithStore = seed.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured) {
    try {
      await supabase.from('products').delete().eq('store_id', storeId);
      const { error } = await supabase.from('products').insert(seedWithStore);
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('Supabase products table is missing "unit" or "store_id" column. Retrying reseed without "unit".');
          const { error: retryError } = await supabase
            .from('products')
            .insert(seedWithStore.map(({ unit, ...rest }) => rest));
          if (retryError) {
            console.error('Failed to retry reseed:', retryError);
          } else {
            window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
            return seed;
          }
        } else {
          console.error('Failed to reseed products in Supabase:', error);
        }
      } else {
        window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
        return seed;
      }
    } catch (e) {
      // fallback
    }
  }
  if (isBrowser()) {
    localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(seed));
    window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
  }
  return seed;
}
