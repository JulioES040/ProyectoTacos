import { OrderStatus } from '../enums/order-status.enum';

export type OrderType = 'dine-in' | 'takeaway';
export type OrderExtra = { id: string; name: string; price: number };
export type OrderLine = { id: string; productId: string; name: string; description: string; quantity: number; unitPrice: number; extras: OrderExtra[] };
export type OrderStatusEntry = { status: OrderStatus; changedAt: string };
export type Order = {
  id: string;
  orderNumber: string;
  publicToken: string;
  customer: string;
  orderType: OrderType;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  createdAt: string;
  updatedAt: string;
};
