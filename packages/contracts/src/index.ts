export type OrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'QUEUED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderStatusUpdatedEvent {
  orderId: string;
  publicToken: string;
  status: OrderStatus;
}
