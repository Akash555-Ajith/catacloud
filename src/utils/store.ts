import { fishData, FishItem } from '@/data/fishData';

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

export function getProducts(): FishItem[] {
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

export function saveProducts(products: FishItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product: FishItem) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

export function updateProduct(updatedProduct: FishItem) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === updatedProduct.id);
  if (index > -1) {
    products[index] = updatedProduct;
    saveProducts(products);
  }
}

export function deleteProduct(id: string) {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveProducts(filtered);
}

export function getOrders(): Order[] {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (!isBrowser()) return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function addOrder(order: Order) {
  const orders = getOrders();
  orders.unshift(order); // Put newest orders first
  saveOrders(orders);
}

export function updateOrderStatus(orderId: string, status: 'Pending' | 'Dispatched' | 'Delivered') {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index > -1) {
    orders[index].status = status;
    saveOrders(orders);
  }
}

export function getProposals(): Proposal[] {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(PROPOSALS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveProposals(proposals: Proposal[]) {
  if (!isBrowser()) return;
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
}

export function addProposal(proposal: Proposal) {
  const proposals = getProposals();
  proposals.unshift(proposal); // Put newest proposals first
  saveProposals(proposals);
}

export function getProposalById(id: string): Proposal | undefined {
  const proposals = getProposals();
  return proposals.find((p) => p.id === id);
}

export function deleteProposal(id: string) {
  const proposals = getProposals();
  const filtered = proposals.filter((p) => p.id !== id);
  saveProposals(filtered);
}
