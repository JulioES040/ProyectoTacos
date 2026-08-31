import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Pick<Product, 'name' | 'description' | 'price' | 'category' | 'available'>;
let productsSocket: Socket | undefined;

function getSocket() {
  if (!productsSocket) {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');
    productsSocket = io(`${baseUrl}/products`, { transports: ['websocket', 'polling'] });
  }
  return productsSocket;
}

export function readProducts() { return api<Product[]>('/products'); }
export function createProduct(input: ProductInput) { return api<Product>('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); }
export function updateProduct(id: string, input: Partial<ProductInput>) { return api<Product>(`/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); }
export function deleteProduct(id: string) { return api<Product>(`/products/${id}`, { method: 'DELETE' }); }

export function subscribeToProducts(listener: () => void) {
  const socket = getSocket();
  const events = ['product.created', 'product.updated', 'product.deleted'];
  events.forEach((event) => socket.on(event, listener));
  return () => events.forEach((event) => socket.off(event, listener));
}
