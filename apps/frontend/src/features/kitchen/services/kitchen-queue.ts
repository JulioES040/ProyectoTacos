import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

export type KitchenOrderStatus = 'QUEUED' | 'PREPARING' | 'READY' | 'DELIVERED';
export type KitchenOrderLine = { id: string; productId: string; name: string; description: string; quantity: number; unitPrice: number };
export type KitchenOrder = {
  id: string;
  orderNumber: string;
  publicToken: string;
  customer: string;
  orderType: 'dine-in' | 'takeaway';
  createdAt: string;
  updatedAt: string;
  lines: KitchenOrderLine[];
  total: number;
  status: KitchenOrderStatus;
};

export type TrackingOrder = Pick<KitchenOrder, 'orderNumber' | 'publicToken' | 'orderType' | 'createdAt' | 'status'>;
export type CreateOrderInput = {
  customer: string;
  orderType: KitchenOrder['orderType'];
  items: Array<{ productId: string; quantity: number }>;
};

let ordersSocket: Socket | undefined;

function getSocket() {
  if (!ordersSocket) {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');
    ordersSocket = io(`${baseUrl}/orders`, { transports: ['websocket', 'polling'] });
  }
  return ordersSocket;
}

export function createKitchenOrder(input: CreateOrderInput, idempotencyKey: string) {
  return api<KitchenOrder>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(input),
  });
}

export function readKitchenOrders() {
  return api<KitchenOrder[]>('/orders/kitchen');
}

export function updateKitchenOrderStatus(orderId: string, status: KitchenOrderStatus) {
  return api<KitchenOrder>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function deliverKitchenOrder(orderId: string) {
  return updateKitchenOrderStatus(orderId, 'DELIVERED');
}

export function readTrackingOrder(publicToken: string) {
  return api<TrackingOrder>(`/tracking/${encodeURIComponent(publicToken)}`);
}

export function subscribeToKitchenOrders(listener: () => void) {
  const socket = getSocket();
  socket.on('order.created', listener);
  socket.on('order.status.updated', listener);
  return () => {
    socket.off('order.created', listener);
    socket.off('order.status.updated', listener);
  };
}

export function subscribeToTrackedOrder(publicToken: string, listener: (order: TrackingOrder) => void) {
  const socket = getSocket();
  const join = () => socket.emit('order.track', { publicToken });
  socket.on('connect', join);
  socket.on('tracking.status.updated', listener);
  if (socket.connected) join();
  return () => {
    socket.off('connect', join);
    socket.off('tracking.status.updated', listener);
  };
}
