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
  // Force disable Supabase on ANY error to ensure LocalStorage fallback works
  disableSupabase();
}

async function getTableColumns(tableName: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  if (columnsCache[tableName]) return columnsCache[tableName];

  let candidateColumns: string[] = [];
  if (tableName === 'products') {
    candidateColumns = ['id', 'name', 'scientificName', 'category', 'pricePerKg', 'origin', 'stock', 'image', 'description', 'tasteProfile', 'texture', 'sustainability', 'prepTime', 'difficulty', 'store_id'];
  } else if (tableName === 'store_config') {
    candidateColumns = ['id', 'owner_email', 'store_name', 'store_type', 'store_phone', 'store_address', 'categories', 'created_at', 'store_tagline', 'unit', 'attributes'];
  } else if (tableName === 'orders') {
    candidateColumns = ['id', 'userEmail', 'userName', 'date', 'deliveryDate', 'address', 'items', 'totalPrice', 'status', 'store_id'];
  } else if (tableName === 'custom_catalogs') {
    candidateColumns = ['id', 'marketName', 'notes', 'globalDiscount', 'globalDelivery', 'createdDate', 'overrides', 'store_id'];
  } else if (tableName === 'proposals') {
    candidateColumns = ['id', 'marketName', 'fishId', 'customPrice', 'discount', 'shippingCharge', 'notes', 'createdDate', 'volumeThreshold', 'volumeDiscount', 'store_id'];
  } else if (tableName === 'users') {
    candidateColumns = ['email', 'name', 'password', 'role', 'avatar'];
  } else {
    candidateColumns = ['id'];
  }

  let workingColumns = [...candidateColumns];
  while (workingColumns.length > 0) {
    try {
      const selectStr = workingColumns.join(',');
      const { error } = await supabase.from(tableName).select(selectStr).limit(0);
      if (!error) {
        columnsCache[tableName] = workingColumns;
        return workingColumns;
      }
      
      const msg = error.message || '';
      if (msg.includes('does not exist') || msg.includes('column')) {
        let foundAndRemoved = false;
        for (const col of workingColumns) {
          const regex = new RegExp('\\b' + col + '\\b');
          if (regex.test(msg)) {
            workingColumns = workingColumns.filter(c => c !== col);
            foundAndRemoved = true;
          }
        }
        if (!foundAndRemoved) {
          workingColumns.pop();
        }
      } else {
        // Other database error (like RLS or connection), we assume the base column (id/email) is supported
        const fallback = candidateColumns.includes('id') ? ['id'] : (candidateColumns.includes('email') ? ['email'] : []);
        columnsCache[tableName] = fallback;
        return fallback;
      }
    } catch (e) {
      workingColumns.pop();
    }
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
      if (key === 'storeName') dbKey = 'store_name';
      if (key === 'storeTagline') dbKey = 'store_tagline';
      if (key === 'storeType') dbKey = 'store_type';
      if (key === 'storePhone') dbKey = 'store_phone';
      if (key === 'storeAddress') dbKey = 'store_address';
      
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
  if ('store_name' in normalized && !normalized.storeName) {
    normalized.storeName = normalized.store_name;
  }
  if ('store_tagline' in normalized && !normalized.storeTagline) {
    normalized.storeTagline = normalized.store_tagline;
  }
  if ('store_type' in normalized && !normalized.storeType) {
    normalized.storeType = normalized.store_type;
  }
  if ('store_phone' in normalized && !normalized.storePhone) {
    normalized.storePhone = normalized.store_phone;
  }
  if ('store_address' in normalized && !normalized.storeAddress) {
    normalized.storeAddress = normalized.store_address;
  }

  // Extract serialized config from categories if present
  if (normalized.categories && Array.isArray(normalized.categories)) {
    const configIndex = normalized.categories.findIndex((c: string) => c.startsWith('__config__:'));
    if (configIndex !== -1) {
      try {
        const jsonStr = normalized.categories[configIndex].substring('__config__:'.length);
        const extra = JSON.parse(jsonStr);
        if (extra.storeTagline) normalized.storeTagline = extra.storeTagline;
        if (extra.unit) normalized.unit = extra.unit;
        if (extra.attributes) normalized.attributes = extra.attributes;
      } catch (e) {
        // ignore
      }
      // Filter it out so it's not shown as a category
      normalized.categories = normalized.categories.filter((c: string) => !c.startsWith('__config__:'));
    }
  }

  // Fallbacks for missing configurations
  if (!normalized.unit) normalized.unit = 'pcs';
  if (!normalized.attributes) {
    const preset = getPresetDefault(normalized.id || 'catacloud');
    normalized.attributes = preset.attributes;
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

export async function getStoreConfig(storeId: string = 'catacloud'): Promise<StoreConfig> {
  let dbConfig: StoreConfig | null = null;
  if (isSupabaseConfigured && await isTableSupported('store_config')) {
    try {
      const query = supabase.from('store_config').select('*');
      const { data, error } = await isColumnSupported('store_config', 'id')
        ? await query.eq('id', storeId).maybeSingle()
        : await query.limit(1).maybeSingle();
      if (!error && data) {
        dbConfig = normalizeStoreConfig(data);
      }
    } catch (e) {
      // fallback
    }
  }

  if (dbConfig) {
    if (isBrowser()) {
      localStorage.setItem(`catacloud_store_config_${storeId}`, JSON.stringify(dbConfig));
    }
    return dbConfig;
  }

  if (!isBrowser()) return getPresetDefault(storeId);
  const stored = localStorage.getItem(`catacloud_store_config_${storeId}`);
  if (!stored) {
    const preset = getPresetDefault(storeId);
    localStorage.setItem(`catacloud_store_config_${storeId}`, JSON.stringify(preset));
    if (isSupabaseConfigured) {
      saveStoreConfig(storeId, preset).catch(() => {});
    }
    return preset;
  }
  try {
    const localConfig = JSON.parse(stored) as StoreConfig;
    if (isSupabaseConfigured && localConfig) {
      saveStoreConfig(storeId, localConfig).catch(() => {});
    }
    return localConfig;
  } catch {
    return getPresetDefault(storeId);
  }
}

export async function saveStoreConfig(storeId: string, config: StoreConfig): Promise<void> {
  const configWithId = { id: storeId, ...config };
  if (isSupabaseConfigured && await isTableSupported('store_config')) {
    try {
      const hasStoreTagline = await isColumnSupported('store_config', 'store_tagline');
      let finalConfig = { ...configWithId };
      
      // If store_tagline is not supported, we serialize store_tagline, unit, and attributes into categories
      if (!hasStoreTagline) {
        const serialized = JSON.stringify({
          storeTagline: config.storeTagline,
          unit: config.unit,
          attributes: config.attributes
        });
        const cleanCategories = (config.categories || []).filter(c => !c.startsWith('__config__:'));
        finalConfig.categories = [...cleanCategories, `__config__:${serialized}`];
      }

      const sanitized = await sanitizePayload('store_config', finalConfig);
      const { error } = await supabase.from('store_config').upsert(sanitized);
      if (error) throw error;
    } catch (e: any) {
      handleSupabaseError(e);
    }
  }
  if (!isBrowser()) return;
  localStorage.setItem(`catacloud_store_config_${storeId}`, JSON.stringify(configWithId));
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
    if (key && key.startsWith('catacloud_store_config_')) {
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



export async function getProducts(storeId: string = 'catacloud'): Promise<FishItem[]> {
  const config = await getStoreConfig(storeId);
  const seed = getSeedData(config.storeType);

  let dbProducts: FishItem[] | null = null;
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      const query = supabase.from('products').select('*');
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
      
      if (data) {
        if (hasStoreId) {
          dbProducts = data as FishItem[];
        } else {
          const prefix = `${storeId}_`;
          const filtered = (data as any[]).filter(p => p.id && p.id.startsWith(prefix));
          dbProducts = filtered.map(p => ({
            ...p,
            id: p.id.substring(prefix.length)
          }));
        }
      }
    } catch (err: any) {
      console.warn('Error fetching products from Supabase, falling back to LocalStorage:', err.message || err);
    }
  }

  if (dbProducts && dbProducts.length > 0) {
    if (isBrowser()) {
      localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(dbProducts));
    }
    return dbProducts;
  }

  if (!isBrowser()) return seed;
  const stored = localStorage.getItem(`catacloud_products_${storeId}`);
  if (!stored) {
    const initialProducts = seed;
    localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(initialProducts));
    if (isSupabaseConfigured) {
      saveProducts(initialProducts, storeId).catch(() => {});
    }
    return initialProducts;
  }
  try {
    const localProducts = JSON.parse(stored);
    const hasCustomItems = Array.isArray(localProducts) && localProducts.length > 0;
    const finalProducts = hasCustomItems ? localProducts : seed;
    
    if (isSupabaseConfigured && hasCustomItems) {
      saveProducts(finalProducts, storeId).catch(() => {});
    }
    return finalProducts;
  } catch {
    return seed;
  }
}

export async function saveProducts(products: FishItem[], storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId) {
        const productsWithStore = products.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('products', productsWithStore);
        const { error } = await supabase.from('products').upsert(sanitized);
        if (error) throw error;
      } else {
        const prefixedProducts = products.map(item => ({
          ...item,
          id: `${storeId}_${item.id}`
        }));
        const sanitized = await sanitizePayload('products', prefixedProducts);
        const { error } = await supabase.from('products').upsert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error saving products to Supabase:', err.message || err);
      handleSupabaseError(err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(products));
}

export async function addProduct(product: FishItem, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId) {
        const productWithStore = { ...product, store_id: storeId };
        const sanitized = await sanitizePayload('products', productWithStore);
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) throw error;
      } else {
        const productWithPrefix = { ...product, id: `${storeId}_${product.id}` };
        const sanitized = await sanitizePayload('products', productWithPrefix);
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding product to Supabase:', err.message || err);
      handleSupabaseError(err);
    }
  }

  const products = await getProducts(storeId);
  if (!products.some(p => p.id === product.id)) {
    products.push(product);
    if (isBrowser()) {
      localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(products));
    }
  }
}

export async function updateProduct(updatedProduct: FishItem, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId) {
        const productWithStore = { ...updatedProduct, store_id: storeId };
        const sanitized = await sanitizePayload('products', productWithStore);
        const { error } = await supabase.from('products').update(sanitized).eq('id', updatedProduct.id).eq('store_id', storeId);
        if (error) throw error;
      } else {
        const productWithPrefix = { ...updatedProduct, id: `${storeId}_${updatedProduct.id}` };
        const sanitized = await sanitizePayload('products', productWithPrefix);
        const { error } = await supabase.from('products').update(sanitized).eq('id', `${storeId}_${updatedProduct.id}`);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error updating product in Supabase:', err.message || err);
      handleSupabaseError(err);
    }
  }

  const products = await getProducts(storeId);
  const index = products.findIndex((p) => p.id === updatedProduct.id);
  if (index > -1) {
    products[index] = updatedProduct;
    if (isBrowser()) {
      localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(products));
    }
  }
}

export async function deleteProduct(id: string, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      const targetId = hasStoreId ? id : `${storeId}_${id}`;
      const query = supabase.from('products').delete().eq('id', targetId);
      const { error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
    } catch (err: any) {
      console.warn('Error deleting product in Supabase:', err.message || err);
      handleSupabaseError(err);
    }
  }

  const products = await getProducts(storeId);
  const filtered = products.filter((p) => p.id !== id);
  if (isBrowser()) {
    localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(filtered));
  }
}

export async function getOrders(storeId: string = 'catacloud'): Promise<Order[]> {
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      const query = supabase.from('orders').select('*');
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
      
      if (data) {
        if (hasStoreId) {
          return data as Order[];
        } else {
          const prefix = `${storeId}_`;
          const filtered = (data as any[]).filter(o => o.id && o.id.startsWith(prefix));
          return filtered.map(o => ({
            ...o,
            id: o.id.substring(prefix.length)
          })) as Order[];
        }
      }
    } catch (err: any) {
      console.warn('Error fetching orders from Supabase, falling back to LocalStorage:', err.message || err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`catacloud_orders_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveOrders(orders: Order[], storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId) {
        const ordersWithStore = orders.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('orders', ordersWithStore);
        const { error } = await supabase.from('orders').upsert(sanitized);
        if (error) throw error;
        return;
      } else {
        const prefixedOrders = orders.map(item => ({
          ...item,
          id: `${storeId}_${item.id}`
        }));
        const sanitized = await sanitizePayload('orders', prefixedOrders);
        const { error } = await supabase.from('orders').upsert(sanitized);
        if (error) throw error;
        return;
      }
    } catch (err: any) {
      console.warn('Error saving orders to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`catacloud_orders_${storeId}`, JSON.stringify(orders));
}

export async function addOrder(order: Order, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      if (hasStoreId) {
        const orderWithStore = { ...order, store_id: storeId };
        const sanitized = await sanitizePayload('orders', orderWithStore);
        const { error } = await supabase.from('orders').insert(sanitized);
        if (error) throw error;
      } else {
        const orderWithPrefix = { ...order, id: `${storeId}_${order.id}` };
        const sanitized = await sanitizePayload('orders', orderWithPrefix);
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
        return (data as any[]).map(o => {
          let cleanId = o.id;
          if (o.id && o.id.includes('_')) {
            const parts = o.id.split('_');
            cleanId = parts.slice(1).join('_');
          }
          return {
            ...o,
            id: cleanId
          };
        }) as Order[];
      }
    } catch (e) {
      // fallback
    }
  }
  if (!isBrowser()) return [];
  const allOrders: Order[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('catacloud_orders_')) {
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
  storeId: string = 'catacloud'
): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('orders')) {
    try {
      const hasStoreId = await isColumnSupported('orders', 'store_id');
      const targetId = hasStoreId ? orderId : `${storeId}_${orderId}`;
      const query = supabase.from('orders').update({ status }).eq('id', targetId);
      const { error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
      return;
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

export async function getProposals(storeId: string = 'catacloud'): Promise<Proposal[]> {
  let dbProposals: Proposal[] | null = null;
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      const query = supabase.from('proposals').select('*');
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
      if (data) {
        if (hasStoreId) {
          dbProposals = data as Proposal[];
        } else {
          const prefix = `${storeId}_`;
          const filtered = (data as any[]).filter(p => p.id && p.id.startsWith(prefix));
          dbProposals = filtered.map(p => ({
            ...p,
            id: p.id.substring(prefix.length)
          })) as Proposal[];
        }
      }
    } catch (err: any) {
      console.warn('Error fetching proposals from Supabase, falling back to LocalStorage:', err.message || err);
    }
  }

  if (dbProposals && dbProposals.length > 0) {
    if (isBrowser()) {
      localStorage.setItem(`catacloud_proposals_${storeId}`, JSON.stringify(dbProposals));
    }
    return dbProposals;
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`catacloud_proposals_${storeId}`);
  if (!stored) return [];
  try {
    const localProposals = JSON.parse(stored);
    const hasCustomItems = Array.isArray(localProposals) && localProposals.length > 0;
    if (isSupabaseConfigured && hasCustomItems) {
      saveProposals(localProposals, storeId).catch(() => {});
    }
    return localProposals;
  } catch {
    return [];
  }
}

export async function saveProposals(proposals: Proposal[], storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId) {
        const proposalsWithStore = proposals.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('proposals', proposalsWithStore);
        const { error } = await supabase.from('proposals').upsert(sanitized);
        if (error) throw error;
      } else {
        const prefixedProposals = proposals.map(item => ({
          ...item,
          id: `${storeId}_${item.id}`
        }));
        const sanitized = await sanitizePayload('proposals', prefixedProposals);
        const { error } = await supabase.from('proposals').upsert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error saving proposals to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`catacloud_proposals_${storeId}`, JSON.stringify(proposals));
}

export async function addProposal(proposal: Proposal, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      if (hasStoreId) {
        const proposalWithStore = { ...proposal, store_id: storeId };
        const sanitized = await sanitizePayload('proposals', proposalWithStore);
        const { error } = await supabase.from('proposals').insert(sanitized);
        if (error) throw error;
      } else {
        const proposalWithPrefix = { ...proposal, id: `${storeId}_${proposal.id}` };
        const sanitized = await sanitizePayload('proposals', proposalWithPrefix);
        const { error } = await supabase.from('proposals').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding proposal to Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  if (!proposals.some(p => p.id === proposal.id)) {
    proposals.unshift(proposal);
    if (isBrowser()) {
      localStorage.setItem(`catacloud_proposals_${storeId}`, JSON.stringify(proposals));
    }
  }
}

export async function getProposalById(id: string, storeId: string = 'catacloud'): Promise<Proposal | undefined> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      const targetId = hasStoreId ? id : `${storeId}_${id}`;
      const query = supabase.from('proposals').select('*').eq('id', targetId);
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId).maybeSingle()
        : await query.maybeSingle();
      if (error) throw error;
      if (data) {
        if (hasStoreId) {
          return data as Proposal;
        } else {
          return {
            ...data,
            id: (data as any).id.substring(`${storeId}_`.length)
          } as Proposal;
        }
      }
    } catch (err: any) {
      console.warn('Error fetching proposal by ID from Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  return proposals.find((p) => p.id === id);
}

export async function deleteProposal(id: string, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('proposals')) {
    try {
      const hasStoreId = await isColumnSupported('proposals', 'store_id');
      const targetId = hasStoreId ? id : `${storeId}_${id}`;
      const query = supabase.from('proposals').delete().eq('id', targetId);
      const { error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
    } catch (err: any) {
      console.warn('Error deleting proposal in Supabase:', err.message || err);
    }
  }

  const proposals = await getProposals(storeId);
  const filtered = proposals.filter((p) => p.id !== id);
  if (isBrowser()) {
    localStorage.setItem(`catacloud_proposals_${storeId}`, JSON.stringify(filtered));
  }
}

export async function getCustomCatalogs(storeId: string = 'catacloud'): Promise<CustomCatalog[]> {
  let dbCatalogs: CustomCatalog[] | null = null;
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      const query = supabase.from('custom_catalogs').select('*');
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
      if (data) {
        if (hasStoreId) {
          dbCatalogs = data as CustomCatalog[];
        } else {
          const prefix = `${storeId}_`;
          const filtered = (data as any[]).filter(c => c.id && c.id.startsWith(prefix));
          dbCatalogs = filtered.map(c => ({
            ...c,
            id: c.id.substring(prefix.length)
          })) as CustomCatalog[];
        }
      }
    } catch (err: any) {
      console.warn('Error fetching custom catalogs from Supabase, falling back to LocalStorage:', err.message || err);
    }
  }

  if (dbCatalogs && dbCatalogs.length > 0) {
    if (isBrowser()) {
      localStorage.setItem(`catacloud_custom_catalogs_${storeId}`, JSON.stringify(dbCatalogs));
    }
    return dbCatalogs;
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(`catacloud_custom_catalogs_${storeId}`);
  if (!stored) return [];
  try {
    const localCatalogs = JSON.parse(stored);
    const hasCustomItems = Array.isArray(localCatalogs) && localCatalogs.length > 0;
    if (isSupabaseConfigured && hasCustomItems) {
      saveCustomCatalogs(localCatalogs, storeId).catch(() => {});
    }
    return localCatalogs;
  } catch {
    return [];
  }
}

export async function saveCustomCatalogs(catalogs: CustomCatalog[], storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId) {
        const catalogsWithStore = catalogs.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('custom_catalogs', catalogsWithStore);
        const { error } = await supabase.from('custom_catalogs').upsert(sanitized);
        if (error) throw error;
      } else {
        const prefixedCatalogs = catalogs.map(item => ({
          ...item,
          id: `${storeId}_${item.id}`
        }));
        const sanitized = await sanitizePayload('custom_catalogs', prefixedCatalogs);
        const { error } = await supabase.from('custom_catalogs').upsert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error saving custom catalogs to Supabase:', err.message || err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(`catacloud_custom_catalogs_${storeId}`, JSON.stringify(catalogs));
}

export async function addCustomCatalog(catalog: CustomCatalog, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      if (hasStoreId) {
        const catalogWithStore = { ...catalog, store_id: storeId };
        const sanitized = await sanitizePayload('custom_catalogs', catalogWithStore);
        const { error } = await supabase.from('custom_catalogs').insert(sanitized);
        if (error) throw error;
      } else {
        const catalogWithPrefix = { ...catalog, id: `${storeId}_${catalog.id}` };
        const sanitized = await sanitizePayload('custom_catalogs', catalogWithPrefix);
        const { error } = await supabase.from('custom_catalogs').insert(sanitized);
        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error adding custom catalog to Supabase:', err.message || err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  if (!catalogs.some(c => c.id === catalog.id)) {
    catalogs.unshift(catalog);
    if (isBrowser()) {
      localStorage.setItem(`catacloud_custom_catalogs_${storeId}`, JSON.stringify(catalogs));
    }
  }
}

export async function getCustomCatalogById(id: string, storeId: string = 'catacloud'): Promise<CustomCatalog | undefined> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      const targetId = hasStoreId ? id : `${storeId}_${id}`;
      const query = supabase.from('custom_catalogs').select('*').eq('id', targetId);
      const { data, error } = hasStoreId 
        ? await query.eq('store_id', storeId).maybeSingle()
        : await query.maybeSingle();
      if (error) throw error;
      if (data) {
        if (hasStoreId) {
          return data as CustomCatalog;
        } else {
          return {
            ...data,
            id: (data as any).id.substring(`${storeId}_`.length)
          } as CustomCatalog;
        }
      }
    } catch (err: any) {
      console.warn('Error fetching custom catalog by ID from Supabase:', err.message || err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  return catalogs.find((c) => c.id === id);
}

export async function deleteCustomCatalog(id: string, storeId: string = 'catacloud'): Promise<void> {
  if (isSupabaseConfigured && await isTableSupported('custom_catalogs')) {
    try {
      const hasStoreId = await isColumnSupported('custom_catalogs', 'store_id');
      const targetId = hasStoreId ? id : `${storeId}_${id}`;
      const query = supabase.from('custom_catalogs').delete().eq('id', targetId);
      const { error } = hasStoreId 
        ? await query.eq('store_id', storeId)
        : await query;
      if (error) throw error;
    } catch (err: any) {
      console.warn('Error deleting custom catalog in Supabase:', err.message || err);
    }
  }

  const catalogs = await getCustomCatalogs(storeId);
  const filtered = catalogs.filter((c) => c.id !== id);
  if (isBrowser()) {
    localStorage.setItem(`catacloud_custom_catalogs_${storeId}`, JSON.stringify(filtered));
  }
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

export async function reseedProducts(storeType: 'seafood' | 'egg' | 'generic' | 'clothing', storeId: string = 'catacloud'): Promise<FishItem[]> {
  const seed = getSeedData(storeType);
  
  if (isSupabaseConfigured && await isTableSupported('products')) {
    try {
      const hasStoreId = await isColumnSupported('products', 'store_id');
      if (hasStoreId) {
        const seedWithStore = seed.map(item => ({ ...item, store_id: storeId }));
        const sanitized = await sanitizePayload('products', seedWithStore);
        await supabase.from('products').delete().eq('store_id', storeId);
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) {
          console.warn('Failed to seed products in Supabase:', error.message);
        } else {
          window.dispatchEvent(new CustomEvent('products-updated', { detail: { storeId } }));
          return seed;
        }
      } else {
        const prefix = `${storeId}_`;
        const { data: allProds } = await supabase.from('products').select('id');
        const idsToDelete = allProds 
          ? (allProds as any[]).filter(p => p.id && p.id.startsWith(prefix)).map(p => p.id)
          : [];
        
        if (idsToDelete.length > 0) {
          await supabase.from('products').delete().in('id', idsToDelete);
        }
        
        const seedWithPrefix = seed.map(item => ({ ...item, id: `${prefix}${item.id}` }));
        const sanitized = await sanitizePayload('products', seedWithPrefix);
        const { error } = await supabase.from('products').insert(sanitized);
        if (error) {
          console.warn('Failed to seed products in Supabase with prefix:', error.message);
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
    localStorage.setItem(`catacloud_products_${storeId}`, JSON.stringify(seed));
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

export async function getReviews(storeId: string = 'catacloud'): Promise<ProductReview[]> {
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
  const stored = localStorage.getItem(`catacloud_reviews_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function addReview(review: ProductReview, storeId: string = 'catacloud'): Promise<void> {
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
    localStorage.setItem(`catacloud_reviews_${storeId}`, JSON.stringify(reviews));
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

export async function getSourcingRequests(storeId: string = 'catacloud'): Promise<CustomSourcingRequest[]> {
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
  const stored = localStorage.getItem(`catacloud_sourcing_requests_${storeId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function addSourcingRequest(request: CustomSourcingRequest, storeId: string = 'catacloud'): Promise<void> {
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
    localStorage.setItem(`catacloud_sourcing_requests_${storeId}`, JSON.stringify(requests));
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
  const stored = localStorage.getItem('catacloud_user_accounts');
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
  const stored = localStorage.getItem('catacloud_user_accounts');
  const accounts: DBUser[] = stored ? JSON.parse(stored) : [];
  const index = accounts.findIndex(a => a.email.toLowerCase() === cleanUser.email);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...cleanUser };
  } else {
    accounts.push(cleanUser);
  }
  localStorage.setItem('catacloud_user_accounts', JSON.stringify(accounts));
}

export async function deleteStore(storeId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      if (await isTableSupported('store_config')) {
        await supabase.from('store_config').delete().eq('id', storeId);
      }
      
      const tablesWithPrefix = ['products', 'orders', 'custom_catalogs', 'proposals'];
      for (const table of tablesWithPrefix) {
        if (await isTableSupported(table)) {
          const hasStoreId = await isColumnSupported(table, 'store_id');
          if (hasStoreId) {
            await supabase.from(table).delete().eq('store_id', storeId);
          } else {
            const prefix = `${storeId}_`;
            const { data } = await supabase.from(table).select('id');
            const idsToDelete = data 
              ? (data as any[]).filter(row => row.id && row.id.startsWith(prefix)).map(row => row.id)
              : [];
            if (idsToDelete.length > 0) {
              await supabase.from(table).delete().in('id', idsToDelete);
            }
          }
        }
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
  localStorage.removeItem(`catacloud_store_config_${storeId}`);
  localStorage.removeItem(`catacloud_products_${storeId}`);
  localStorage.removeItem(`catacloud_orders_${storeId}`);
  localStorage.removeItem(`catacloud_proposals_${storeId}`);
  localStorage.removeItem(`catacloud_custom_catalogs_${storeId}`);
  localStorage.removeItem(`catacloud_sourcing_requests_${storeId}`);
  localStorage.removeItem(`catacloud_reviews_${storeId}`);

  window.dispatchEvent(new CustomEvent('store-deleted', { detail: { storeId } }));
}



