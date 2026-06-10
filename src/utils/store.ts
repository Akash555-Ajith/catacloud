import { fishData, FishItem } from '@/data/fishData';
import { StoreConfig, SEAFOOD_PRESET, EGG_PRESET, GENERIC_PRESET, eggSeedData, genericSeedData, CLOTHING_PRESET, clothingSeedData } from '@/data/storeConfig';
import { supabase, isSupabaseConfigured, disableSupabase } from './supabaseClient';

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

let columnsCache: Record<string, string[]> = {};

function handleSupabaseError(error: any) {
  if (!error) return;
  console.warn('Supabase operation error encountered:', error.message || error);
  const isAuthOrConnectionError = 
    error.status === 401 ||
    error.status === 403 ||
    (error.message && (
      error.message.includes('API key') ||
      error.message.includes('apikey') ||
      error.message.includes('JWT') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('authorization') ||
      error.message.includes('No API key') ||
      error.message.includes('invalid')
    ));
  if (isAuthOrConnectionError) {
    disableSupabase();
  }
}

async function getTableColumns(tableName: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  if (columnsCache[tableName]) return columnsCache[tableName];
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      handleSupabaseError(error);
    }
    if (!error && data) {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      columnsCache[tableName] = columns;
      return columns;
    }
    // Check if table exists even if empty
    const queryKey = tableName === 'users' ? 'email' : 'id';
    const { error: idError } = await supabase.from(tableName).select(queryKey).limit(1);
    if (idError) {
      handleSupabaseError(idError);
    }
    if (!idError) {
      if (tableName === 'products') {
        columnsCache[tableName] = ['id', 'name', 'scientificName', 'category', 'pricePerKg', 'origin', 'stock', 'image', 'description', 'tasteProfile', 'texture', 'sustainability', 'prepTime', 'difficulty'];
      } else if (tableName === 'orders') {
        columnsCache[tableName] = ['id', 'userEmail', 'userName', 'date', 'deliveryDate', 'address', 'items', 'totalPrice', 'status'];
      } else if (tableName === 'custom_catalogs') {
        columnsCache[tableName] = ['id', 'marketName', 'notes', 'globalDiscount', 'globalDelivery', 'createdDate', 'overrides'];
      } else if (tableName === 'proposals') {
        columnsCache[tableName] = ['id', 'marketName', 'fishId', 'customPrice', 'discount', 'shippingCharge', 'notes', 'createdDate', 'volumeThreshold', 'volumeDiscount'];
      } else if (tableName === 'users') {
        columnsCache[tableName] = ['email', 'name', 'password', 'role', 'avatar'];
      } else {
        columnsCache[tableName] = ['id'];
      }
      return columnsCache[tableName];
    }
  } catch (e) {
    handleSupabaseError(e);
  }
  columnsCache[tableName] = [];
  return [];
}

async function isTableSupported(tableName: string): Promise<boolean> {
  const columns = await getTableColumns(tableName);
  return columns.length > 0;
}

async function isColumnSupported(tableName: string, columnName: string): Promise<boolean> {
  const columns = await getTableColumns(tableName);
  return columns.includes(columnName);
}

async function sanitizePayload(tableName: string, payload: any): Promise<any> {
  const columns = await getTableColumns(tableName);
  if (columns.length === 0) return payload;

  const sanitizeItem = (item: any) => {
    const sanitized: any = {};
    for (const key of Object.keys(item)) {
      let dbKey = key;
      if (key === 'storeId') dbKey = 'store_id';
      if (key === 'ownerEmail') dbKey = 'owner_email';
      
      if (columns.includes(dbKey)) {
        sanitized[dbKey] = item[key];
      } else if (columns.includes(key)) {
        sanitized[key] = item[key];
      }
    }
    return sanitized;
  };

  if (Array.isArray(payload)) {
    return payload.map(sanitizeItem);
  }
  return sanitizeItem(payload);
}

function getPresetDefault(storeId: string): StoreConfig {
  const cleanId = storeId.toLowerCase();
  if (cleanId.includes('egg')) {
    return { ...EGG_PRESET, id: storeId };
  }
  if (cleanId.includes('clothing') || cleanId.includes('apparel') || cleanId.includes('wear') || cleanId.includes('fashion') || cleanId.includes('threads') || cleanId.includes('garment') || cleanId.includes('boutique')) {
    return { ...CLOTHING_PRESET, id: storeId };
  }
  if (cleanId.includes('bakery') || cleanId.includes('bread') || cleanId.includes('shop') || cleanId.includes('niche')) {
    return { ...GENERIC_PRESET, id: storeId };
  }
  return { ...SEAFOOD_PRESET, id: storeId };
}

function normalizeStoreConfig(store: any): StoreConfig {
  if (!store) return store;
  const normalized = { ...store };
  if ('owner_email' in normalized && !normalized.ownerEmail) {
    normalized.ownerEmail = normalized.owner_email;
  }
  return normalized as StoreConfig;
}

function normalizeStoreConfigs(stores: any[]): StoreConfig[] {
  return (stores || []).map(normalizeStoreConfig);
}

export function getSeedData(type: string): FishItem[] {
  if (type === 'egg') return eggSeedData;
  if (type === 'generic') return genericSeedData;
  if (type === 'clothing') return clothingSeedData;
  return fishData;
}

export async function getStoreConfig(storeId: string = 'bluefine'): Promise<StoreConfig> {
  if (isSupabaseConfigured && await isTableSupported('store_config')) {
    try {
      const query = supabase.from('store_config').select('*');
      const { data, error } = await isColumnSupported('store_config', 'id')
        ? await query.eq('id', storeId).maybeSingle()
        : await query.limit(1).maybeSingle();
      if (!error && data) {
        return normalizeStoreConfig(data);
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
  if (isSupabaseConfigured && await isTableSupported('store_config')) {
    try {
      const sanitized = await sanitizePayload('store_config', configWithId);
      await supabase.from('store_config').upsert(sanitized);
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_store_config_${storeId}`, JSON.stringify(configWithId));
  window.dispatchEvent(new CustomEvent('store-config-updated', { detail: { storeId } }));
}

export async function getStoresOwnedByUser(email: string): Promise<StoreConfig[]> {
  if (isSupabaseConfigured && await isTableSupported('store_config') && await isColumnSupported('store_config', 'owner_email')) {
    try {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .eq('owner_email', email.toLowerCase());
      if (!error && data) {
        return normalizeStoreConfigs(data);
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
  return stores;
}



export async function getProducts(storeId: string = 'bluefine'): Promise<FishItem[]> {
  const config = await getStoreConfig(storeId);
  const seed = getSeedData(config.storeType);

  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('products').select('*');
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        
        if (!data || data.length === 0) {
          if (storeId === 'bluefine') {
            const seedWithStore = seed.map(item => ({ ...item, store_id: storeId }));
            const sanitized = await sanitizePayload('products', seedWithStore);
            const { error: seedError } = await supabase.from('products').insert(sanitized);
            if (seedError) {
              console.warn('Failed to seed products in Supabase:', seedError.message);
            }
            return seed;
          }
          return [];
        }
        return data as FishItem[];
      }
    } catch (err: any) {
      console.warn('Error fetching products from Supabase, falling back to LocalStorage:', err.message || err);
    }
  }

  if (!isBrowser()) return storeId === 'bluefine' ? seed : [];
  const stored = localStorage.getItem(`bluefine_products_${storeId}`);
  if (!stored) {
    const initialProducts = storeId === 'bluefine' ? seed : [];
    localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(initialProducts));
    return initialProducts;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return storeId === 'bluefine' ? seed : [];
  }
}

export async function saveProducts(products: FishItem[], storeId: string = 'bluefine'): Promise<void> {
  const productsWithStore = products.map(item => ({ ...item, store_id: storeId }));
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('products', productsWithStore);
        const { error } = await supabase.from('products').upsert(sanitized);
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error saving products to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(products));
}

export async function addProduct(product: FishItem, storeId: string = 'bluefine'): Promise<void> {
  const productWithStore = { ...product, store_id: storeId };
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('products', productWithStore);
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error adding product to Supabase:', err.message || err);
    }
  }

  const products = await getProducts(storeId);
  products.push(product);
  await saveProducts(products, storeId);
}

export async function updateProduct(updatedProduct: FishItem, storeId: string = 'bluefine'): Promise<void> {
  const productWithStore = { ...updatedProduct, store_id: storeId };
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('products', productWithStore);
        const query = supabase.from('products').update(sanitized).eq('id', updatedProduct.id);
        const { error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error updating product in Supabase:', err.message || err);
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
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('products').delete().eq('id', id);
        const { error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error deleting product in Supabase:', err.message || err);
    }
  }

  const products = await getProducts(storeId);
  const filtered = products.filter((p) => p.id !== id);
  await saveProducts(filtered, storeId);
}

export async function getOrders(storeId: string = 'bluefine'): Promise<Order[]> {
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('orders').select('*');
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        return (data || []) as Order[];
      }
    } catch (err: any) {
      console.warn('Error fetching orders from Supabase, falling back to LocalStorage:', err.message || err);
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
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('orders', ordersWithStore);
        const { error } = await supabase.from('orders').upsert(sanitized);
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error saving orders to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_orders_${storeId}`, JSON.stringify(orders));
}

export async function addOrder(order: Order, storeId: string = 'bluefine'): Promise<void> {
  const orderWithStore = { ...order, store_id: storeId };
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('orders', orderWithStore);
        const { error } = await supabase.from('orders').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding order to Supabase:', err.message || err);
    }
  }

  // Deduct product stock locally or on remote
  try {
    const products = await getProducts(storeId);
    let stockChanged = false;
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.fishId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        stockChanged = true;
      }
    });
    if (stockChanged) {
      await saveProducts(products, storeId);
      if (isBrowser()) {
        window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
      }
    }
  } catch (e) {
    console.error('Failed to deduct stock:', e);
  }

  if (isBrowser()) {
    const orders = await getOrders(storeId);
    orders.unshift(order);
    await saveOrders(orders, storeId);
  }
}


export async function getOrdersForBuyer(email: string): Promise<Order[]> {
  if (isSupabaseConfigured && await isTableSupported('orders') && await isColumnSupported('orders', 'userEmail')) {
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
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('orders').update({ status }).eq('id', orderId);
        const { error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error updating order status in Supabase:', err.message || err);
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
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('proposals').select('*');
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        if (data && data.length > 0) {
          return data as Proposal[];
        }
      }
    } catch (err: any) {
      console.warn('Error fetching proposals from Supabase, falling back to LocalStorage:', err.message || err);
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
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('proposals', proposalsWithStore);
        const { error } = await supabase.from('proposals').upsert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error saving proposals to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_proposals_${storeId}`, JSON.stringify(proposals));
}

export async function addProposal(proposal: Proposal, storeId: string = 'bluefine'): Promise<void> {
  const proposalWithStore = { ...proposal, store_id: storeId };
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('proposals', proposalWithStore);
        const { error } = await supabase.from('proposals').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding proposal to Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  if (!proposals.some(p => p.id === proposal.id)) {
    proposals.unshift(proposalWithStore);
    await saveProposals(proposals, storeId);
  }
}

export async function getProposalById(id: string, storeId: string = 'bluefine'): Promise<Proposal | undefined> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('proposals').select('*').eq('id', id);
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId).maybeSingle()
          : await query.maybeSingle();
        if (error) throw error;
        if (data) return data as Proposal;
      }
    } catch (err: any) {
      console.warn('Error fetching proposal by ID from Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  return proposals.find((p) => p.id === id);
}

export async function deleteProposal(id: string, storeId: string = 'bluefine'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('proposals').delete().eq('id', id);
        const { error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error deleting proposal in Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  const filtered = proposals.filter((p) => p.id !== id);
  await saveProposals(filtered, storeId);
}

export async function getCustomCatalogs(storeId: string = 'bluefine'): Promise<CustomCatalog[]> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('custom_catalogs').select('*');
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
        if (data && data.length > 0) {
          return data as CustomCatalog[];
        }
      }
    } catch (err: any) {
      console.warn('Error fetching custom catalogs from Supabase, falling back to LocalStorage:', err.message || err);
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
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('custom_catalogs', catalogsWithStore);
        const { error } = await supabase.from('custom_catalogs').upsert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error saving custom catalogs to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`bluefine_custom_catalogs_${storeId}`, JSON.stringify(catalogs));
}

export async function addCustomCatalog(catalog: CustomCatalog, storeId: string = 'bluefine'): Promise<void> {
  const catalogWithStore = { ...catalog, store_id: storeId };
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const sanitized = await sanitizePayload('custom_catalogs', catalogWithStore);
        const { error } = await supabase.from('custom_catalogs').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding custom catalog to Supabase:', err.message || err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  if (!catalogs.some(c => c.id === catalog.id)) {
    catalogs.unshift(catalogWithStore);
    await saveCustomCatalogs(catalogs, storeId);
  }
}

export async function getCustomCatalogById(id: string, storeId: string = 'bluefine'): Promise<CustomCatalog | undefined> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('custom_catalogs').select('*').eq('id', id);
        const { data, error } = hasStoreId 
          ? await query.eq('store_id', storeId).maybeSingle()
          : await query.maybeSingle();
        if (error) throw error;
        if (data) return data as CustomCatalog;
      }
    } catch (err: any) {
      console.warn('Error fetching custom catalog by ID from Supabase:', err.message || err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  return catalogs.find((c) => c.id === id);
}

export async function deleteCustomCatalog(id: string, storeId: string = 'bluefine'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const query = supabase.from('custom_catalogs').delete().eq('id', id);
        const { error } = hasStoreId 
          ? await query.eq('store_id', storeId)
          : await query;
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error deleting custom catalog in Supabase:', err.message || err);
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

export async function reseedProducts(storeType: 'seafood' | 'egg' | 'generic' | 'clothing', storeId: string = 'bluefine'): Promise<FishItem[]> {
  const seed = getSeedData(storeType);
  
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId || storeId === 'bluefine') {
        const seedWithStore = seed.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('products', seedWithStore);
        
        if (hasStoreId) {
          await supabase.from('products').delete().eq('store_id', storeId);
        } else {
          await supabase.from('products').delete().neq('id', 'dummy_non_existent');
        }
        
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) {
          console.warn('Failed to seed products in Supabase:', error.message);
        } else {
          window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
          return seed;
        }
      }
    } catch (e: any) {
      console.warn('Error reseeding products in Supabase:', e.message || e);
    }
  }
  if (isBrowser()) {
    localStorage.setItem(`bluefine_products_${storeId}`, JSON.stringify(seed));
    window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
  }
  return seed;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  clientName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  storeId: string;
}

export async function getReviews(storeId: string = 'bluefine'): Promise<ProductReview[]> {
  if (isSupabaseConfigured && await isTableSupported('reviews')) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('store_id', storeId);
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          storeId: item.store_id,
          productId: item.product_id,
          productName: item.product_name,
          clientName: item.client_name
        })) as ProductReview[];
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`bluefine_reviews_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function addReview(review: ProductReview, storeId: string = 'bluefine'): Promise<void> {
  const reviewWithStore = { 
    ...review, 
    store_id: storeId,
    product_id: review.productId,
    product_name: review.productName,
    client_name: review.clientName
  };
  if (isSupabaseConfigured && await isTableSupported('reviews')) {
    try {
      const sanitized = await sanitizePayload('reviews', reviewWithStore);
      const { error } = await supabase.from('reviews').insert(sanitized);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Error adding review to Supabase:', err.message || err);
    }
  }

  const reviews = await getReviews(storeId);
  reviews.unshift(review);
  if (isBrowser()) {
    localStorage.setItem(`bluefine_reviews_${storeId}`, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('reviews-updated', { detail: { storeId } }));
  }
}

export interface CustomSourcingRequest {
  id: string;
  storeId: string;
  clientName: string;
  clientEmail: string;
  productId?: string;
  productName: string;
  requestedQuantity: number;
  notes: string;
  date: string;
}

export async function getSourcingRequests(storeId: string = 'bluefine'): Promise<CustomSourcingRequest[]> {
  if (isSupabaseConfigured && await isTableSupported('sourcing_requests')) {
    try {
      const { data, error } = await supabase
        .from('sourcing_requests')
        .select('*')
        .eq('store_id', storeId);
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          storeId: item.store_id,
          clientName: item.client_name,
          clientEmail: item.client_email,
          productId: item.product_id,
          productName: item.product_name,
          requestedQuantity: item.requested_quantity
        })) as CustomSourcingRequest[];
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`bluefine_sourcing_requests_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function addSourcingRequest(request: CustomSourcingRequest, storeId: string = 'bluefine'): Promise<void> {
  const requestWithStore = {
    ...request,
    store_id: storeId,
    client_name: request.clientName,
    client_email: request.clientEmail,
    product_id: request.productId,
    product_name: request.productName,
    requested_quantity: request.requestedQuantity
  };
  if (isSupabaseConfigured && await isTableSupported('sourcing_requests')) {
    try {
      const sanitized = await sanitizePayload('sourcing_requests', requestWithStore);
      const { error } = await supabase.from('sourcing_requests').insert(sanitized);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Error adding sourcing request to Supabase:', err.message || err);
    }
  }

  const requests = await getSourcingRequests(storeId);
  requests.unshift(request);
  if (isBrowser()) {
    localStorage.setItem(`bluefine_sourcing_requests_${storeId}`, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('sourcing-requests-updated', { detail: { storeId } }));
  }
}

export interface DBUser {
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export async function dbGetUsers(): Promise<DBUser[]> {
  if (isSupabaseConfigured && await isTableSupported('users')) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) return data as DBUser[];
    } catch (e) {
      console.warn('Failed to fetch users from DB:', e);
    }
  }
  if (!isBrowser()) return [];
  const stored = localStorage.getItem('bluefine_user_accounts');
  return stored ? JSON.parse(stored) : [];
}

export async function dbGetUser(email: string): Promise<DBUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (isSupabaseConfigured && await isTableSupported('users')) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      if (!error && data) return data as DBUser;
    } catch (e) {
      console.warn('Failed to fetch user from DB:', e);
    }
  }
  const users = await dbGetUsers();
  return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

export async function dbSaveUser(user: DBUser): Promise<void> {
  const cleanUser = {
    ...user,
    email: user.email.toLowerCase().trim()
  };
  if (isSupabaseConfigured && await isTableSupported('users')) {
    try {
      const sanitized = await sanitizePayload('users', cleanUser);
      const { error } = await supabase.from('users').upsert(sanitized);
      if (error) throw error;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Error saving user to Supabase:', errMsg);
    }
  }
  
  if (!isBrowser()) return;
  const stored = localStorage.getItem('bluefine_user_accounts');
  const accounts: DBUser[] = stored ? JSON.parse(stored) : [];
  const index = accounts.findIndex(a => a.email.toLowerCase() === cleanUser.email);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...cleanUser };
  } else {
    accounts.push(cleanUser);
  }
  localStorage.setItem('bluefine_user_accounts', JSON.stringify(accounts));
}

export async function deleteStore(storeId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      if (await isTableSupported('store_config')) {
        await supabase.from('store_config').delete().eq('id', storeId);
      }
      if (await isTableSupported('products') && await isColumnSupported('products', 'store_id')) {
        await supabase.from('products').delete().eq('store_id', storeId);
      }
      if (await isTableSupported('orders') && await isColumnSupported('orders', 'store_id')) {
        await supabase.from('orders').delete().eq('store_id', storeId);
      }
      if (await isTableSupported('custom_catalogs') && await isColumnSupported('custom_catalogs', 'store_id')) {
        await supabase.from('custom_catalogs').delete().eq('store_id', storeId);
      }
      if (await isTableSupported('proposals') && await isColumnSupported('proposals', 'store_id')) {
        await supabase.from('proposals').delete().eq('store_id', storeId);
      }
      if (await isTableSupported('reviews') && await isColumnSupported('reviews', 'store_id')) {
        await supabase.from('reviews').delete().eq('store_id', storeId);
      }
      if (await isTableSupported('sourcing_requests') && await isColumnSupported('sourcing_requests', 'store_id')) {
        await supabase.from('sourcing_requests').delete().eq('store_id', storeId);
      }
    } catch (e) {
      console.warn('Failed to delete store from Supabase:', e);
    }
  }

  if (!isBrowser()) return;
  localStorage.removeItem(`bluefine_store_config_${storeId}`);
  localStorage.removeItem(`bluefine_products_${storeId}`);
  localStorage.removeItem(`bluefine_orders_${storeId}`);
  localStorage.removeItem(`bluefine_proposals_${storeId}`);
  localStorage.removeItem(`bluefine_custom_catalogs_${storeId}`);
  localStorage.removeItem(`bluefine_sourcing_requests_${storeId}`);
  localStorage.removeItem(`bluefine_reviews_${storeId}`);

  window.dispatchEvent(new CustomEvent('store-deleted', { detail: { storeId } }));
}



