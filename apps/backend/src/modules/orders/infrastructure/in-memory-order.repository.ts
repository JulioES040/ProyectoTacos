import { Injectable } from '@nestjs/common';
import { Order } from '../domain/entities/order.entity';
import { OrderRepository } from '../domain/repositories/order.repository';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  private readonly idempotencyKeys = new Map<string, string>();
  private sequence = 5608;

  nextOrderNumber() { return String(this.sequence++); }
  save(order: Order, key?: string) { this.orders.set(order.id, order); if (key) this.idempotencyKeys.set(key, order.id); return order; }
  findAll() { return [...this.orders.values()]; }
  findById(id: string) { return this.orders.get(id); }
  findByPublicToken(token: string) { return this.findAll().find((order) => order.publicToken === token); }
  findByIdempotencyKey(key: string) { const id = this.idempotencyKeys.get(key); return id ? this.findById(id) : undefined; }
}
