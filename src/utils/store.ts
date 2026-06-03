import { fishData, FishItem } from '@/data/fishData';
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
}

const PRODUCTS_KEY = 'bluefine_products';
const ORDERS_KEY = 'bluefine_orders';
const PROPOSALS_KEY = 'bluefine_proposals';
const CUSTOM_CATALOGS_KEY = 'bluefine_custom_catalogs';

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
      included: boolean;
    }
  };
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
}

// Check if we are running in the browser
const isBrowser = () => typeof window !== 'undefined';

export async function getProducts(): Promise<FishItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      
      // Automatic Seeding: Seed dynamic products on first run if database is empty
      if (!data || data.length === 0) {
        const { error: seedError } = await supabase.from('products').insert(fishData);
        if (seedError) console.error('Failed to seed products in Supabase:', seedError);
        return fishData;
      }
      return data as FishItem[];
    } catch (err) {
      console.error('Error fetching products from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return fishData;
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fishData));
    return fishData;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return fishData;
  }
}

export async function saveProducts(products: FishItem[]): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').upsert(products);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving products to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export async function addProduct(product: FishItem): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').insert(product);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error adding product to Supabase:', err);
    }
  }

  const products = await getProducts();
  products.push(product);
  await saveProducts(products);
}

export async function updateProduct(updatedProduct: FishItem): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', updatedProduct.id);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error updating product in Supabase:', err);
    }
  }

  const products = await getProducts();
  const index = products.findIndex((p) => p.id === updatedProduct.id);
  if (index > -1) {
    products[index] = updatedProduct;
    await saveProducts(products);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error deleting product in Supabase:', err);
    }
  }

  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);
  await saveProducts(filtered);
}

export async function getOrders(): Promise<Order[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      console.error('Error fetching orders from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('orders').upsert(orders);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving orders to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function addOrder(order: Order): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('orders').insert(order);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error adding order to Supabase:', err);
    }
  }

  const orders = await getOrders();
  orders.unshift(order);
  await saveOrders(orders);
}

export async function updateOrderStatus(orderId: string, status: 'Pending' | 'Dispatched' | 'Delivered'): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error updating order status in Supabase:', err);
    }
  }

  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index > -1) {
    orders[index].status = status;
    await saveOrders(orders);
  }
}

export async function getProposals(): Promise<Proposal[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('proposals').select('*');
      if (error) throw error;
      return (data || []) as Proposal[];
    } catch (err) {
      console.error('Error fetching proposals from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(PROPOSALS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveProposals(proposals: Proposal[]): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').upsert(proposals);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving proposals to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
}

export async function addProposal(proposal: Proposal): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').insert(proposal);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error adding proposal to Supabase:', err);
    }
  }

  const proposals = await getProposals();
  proposals.unshift(proposal);
  await saveProposals(proposals);
}

export async function getProposalById(id: string): Promise<Proposal | undefined> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? (data as Proposal) : undefined;
    } catch (err) {
      console.error('Error fetching proposal by ID from Supabase:', err);
    }
  }

  const proposals = await getProposals();
  return proposals.find((p) => p.id === id);
}

export async function deleteProposal(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error deleting proposal in Supabase:', err);
    }
  }

  const proposals = await getProposals();
  const filtered = proposals.filter((p) => p.id !== id);
  await saveProposals(filtered);
}

export async function getCustomCatalogs(): Promise<CustomCatalog[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('custom_catalogs').select('*');
      if (error) throw error;
      return (data || []) as CustomCatalog[];
    } catch (err) {
      console.error('Error fetching custom catalogs from Supabase, falling back to LocalStorage:', err);
    }
  }

  if (!isBrowser()) return [];
  const stored = localStorage.getItem(CUSTOM_CATALOGS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveCustomCatalogs(catalogs: CustomCatalog[]): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').upsert(catalogs);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error saving custom catalogs to Supabase:', err);
    }
  }

  if (!isBrowser()) return;
  localStorage.setItem(CUSTOM_CATALOGS_KEY, JSON.stringify(catalogs));
}

export async function addCustomCatalog(catalog: CustomCatalog): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').insert(catalog);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error adding custom catalog to Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs();
  catalogs.unshift(catalog);
  await saveCustomCatalogs(catalogs);
}

export async function getCustomCatalogById(id: string): Promise<CustomCatalog | undefined> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('custom_catalogs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? (data as CustomCatalog) : undefined;
    } catch (err) {
      console.error('Error fetching custom catalog by ID from Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs();
  return catalogs.find((c) => c.id === id);
}

export async function deleteCustomCatalog(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('custom_catalogs').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Error deleting custom catalog in Supabase:', err);
    }
  }

  const catalogs = await getCustomCatalogs();
  const filtered = catalogs.filter((c) => c.id !== id);
  await saveCustomCatalogs(filtered);
}
