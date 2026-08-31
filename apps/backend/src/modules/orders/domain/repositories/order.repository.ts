import { Order } from '../entities/order.entity';

export abstract class OrderRepository {
  abstract nextOrderNumber(): string;
  abstract save(order: Order, idempotencyKey?: string): Order;
  abstract findAll(): Order[];
  abstract findById(id: string): Order | undefined;
  abstract findByPublicToken(publicToken: string): Order | undefined;
  abstract findByIdempotencyKey(key: string): Order | undefined;
}
