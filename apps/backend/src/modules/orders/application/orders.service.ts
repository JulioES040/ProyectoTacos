import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../../products/products.service';
import { Order, OrderLine } from '../domain/entities/order.entity';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderRepository } from '../domain/repositories/order.repository';
import { OrderStateService } from '../domain/services/order-state.service';
import { OrdersGateway } from '../presentation/orders.gateway';

const orderExtras = [
  { id: 'cheese', name: 'Queso extra', price: 5 },
  { id: 'avocado', name: 'Aguacate', price: 7 },
] as const;

@Injectable()
export class OrdersService {
  constructor(private readonly repository: OrderRepository, private readonly state: OrderStateService, private readonly gateway: OrdersGateway, private readonly products: ProductsService) {}

  create(dto: CreateOrderDto, idempotencyKey?: string) {
    const existing = idempotencyKey ? this.repository.findByIdempotencyKey(idempotencyKey) : undefined;
    if (existing) return existing;

    const lines: OrderLine[] = dto.items.map((item) => {
      const product = this.products.findOne(item.productId);
      if (!product.available) throw new BadRequestException(`${product.name} is not available`);
      const extras = (item.extras ?? []).map((extraId) => {
        const extra = orderExtras.find((candidate) => candidate.id === extraId);
        if (!extra) throw new BadRequestException(`Extra ${extraId} is not available`);
        return { ...extra };
      });
      if (new Set(extras.map((extra) => extra.id)).size !== extras.length) throw new BadRequestException('An extra can only be added once per line');
      return { id: product.id, productId: product.id, name: product.name, description: product.description, quantity: item.quantity, unitPrice: product.price, extras };
    });
    const total = lines.reduce((sum, item) => sum + (item.unitPrice + item.extras.reduce((extrasTotal, extra) => extrasTotal + extra.price, 0)) * item.quantity, 0);
    const order = new Order(this.repository.nextOrderNumber(), dto.customer.trim(), dto.orderType, lines, total);
    this.transition(order, OrderStatus.PAID);
    this.transition(order, OrderStatus.QUEUED);
    this.repository.save(order, idempotencyKey);
    this.gateway.emitCreated(order);
    return order;
  }

  findAll(status?: OrderStatus) {
    return this.sortFifo(this.repository.findAll().filter((order) => !status || order.status === status));
  }

  findKitchenQueue() {
    const active = new Set([OrderStatus.QUEUED, OrderStatus.PREPARING, OrderStatus.READY]);
    return this.sortFifo(this.repository.findAll().filter((order) => active.has(order.status)));
  }

  findOne(id: string) {
    const order = this.repository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findTracking(publicToken: string) {
    const order = this.repository.findByPublicToken(publicToken);
    if (!order) throw new NotFoundException('Order not found');
    return { orderNumber: order.orderNumber, publicToken: order.publicToken, orderType: order.orderType, createdAt: order.createdAt, status: order.status };
  }

  updateStatus(id: string, status: OrderStatus) {
    const order = this.findOne(id);
    if (order.status === OrderStatus.QUEUED && status === OrderStatus.PREPARING) {
      const next = this.findKitchenQueue().find((candidate) => candidate.status === OrderStatus.QUEUED);
      if (next?.id !== order.id) throw new ConflictException(`Order ${next?.orderNumber} must be prepared first (FIFO)`);
    }
    this.transition(order, status);
    this.repository.save(order);
    this.gateway.emitUpdated(order);
    return order;
  }

  private transition(order: Order, status: OrderStatus) {
    this.state.assertTransition(order.status, status);
    order.changeStatus(status);
  }

  private sortFifo(orders: Order[]) {
    return [...orders].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }
}
