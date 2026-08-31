import { randomUUID } from 'node:crypto';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderType = 'dine-in' | 'takeaway';
export type OrderExtra = { id: string; name: string; price: number };
export type OrderLine = { id: string; productId: string; name: string; description: string; quantity: number; unitPrice: number; extras: OrderExtra[] };
export type OrderStatusEntry = { status: OrderStatus; changedAt: string };

export class Order {
  readonly id = randomUUID();
  readonly publicToken = `EBT-${randomUUID().slice(0, 8).toUpperCase()}`;
  readonly createdAt = new Date().toISOString();
  updatedAt = this.createdAt;
  status = OrderStatus.CREATED;
  readonly statusHistory: OrderStatusEntry[] = [{ status: this.status, changedAt: this.createdAt }];

  constructor(readonly orderNumber: string, readonly customer: string, readonly orderType: OrderType, readonly lines: OrderLine[], readonly total: number) {}

  changeStatus(status: OrderStatus) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
    this.statusHistory.push({ status, changedAt: this.updatedAt });
  }
}
