import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus as DbOrderStatus, OrderType as DbOrderType, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '../domain/entities/order.entity';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderStateService } from '../domain/services/order-state.service';
import { OrdersGateway } from '../presentation/orders.gateway';

const orderInclude = {
  items: { include: { extras: true }, orderBy: { id: 'asc' as const } },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;
type PersistedOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly state: OrderStateService, private readonly gateway: OrdersGateway) {}

  async create(dto: CreateOrderDto, createdById: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
      if (existing) return this.toOrder(existing);
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const extraIds = [...new Set(dto.items.flatMap((item) => item.extras ?? []))];
    const [products, extras] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds }, deletedAt: null } }),
      this.prisma.extra.findMany({ where: { id: { in: extraIds }, available: true } }),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const extraById = new Map(extras.map((extra) => [extra.id, extra]));

    const lines = dto.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} does not exist`);
      if (!product.available) throw new BadRequestException(`${product.name} is not available`);
      const requestedIds = item.extras ?? [];
      if (new Set(requestedIds).size !== requestedIds.length) throw new BadRequestException('An extra can only be added once per line');
      if (requestedIds.length && !this.supportsExtras(product.category)) throw new BadRequestException('Extras are only available for tacos and gringas');
      const selectedExtras = requestedIds.map((extraId) => {
        const extra = extraById.get(extraId);
        if (!extra) throw new BadRequestException(`Extra ${extraId} is not available`);
        return extra;
      });
      const unitTotal = Number(product.price) + selectedExtras.reduce((sum, extra) => sum + Number(extra.price), 0);
      return { product, quantity: item.quantity, extras: selectedExtras, unitTotal };
    });
    const total = lines.reduce((sum, line) => sum + line.unitTotal * line.quantity, 0);

    try {
      const persisted = await this.prisma.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
          if (existing) return existing;
        }
        const [sequence] = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT nextval('order_number_seq') AS value`;
        const now = new Date();
        return tx.order.create({
          data: {
            orderNumber: Number(sequence.value),
            publicToken: `EBT-${randomUUID().slice(0, 8).toUpperCase()}`,
            customer: dto.customer.trim(),
            orderType: dto.orderType === 'dine-in' ? DbOrderType.DINE_IN : DbOrderType.TAKEAWAY,
            status: DbOrderStatus.QUEUED,
            total: new Prisma.Decimal(total),
            idempotencyKey,
            createdById,
            statusHistory: { create: [{ status: DbOrderStatus.CREATED, changedAt: now }, { status: DbOrderStatus.PAID, changedAt: now }, { status: DbOrderStatus.QUEUED, changedAt: now }] },
            items: { create: lines.map(({ product, quantity, extras: selectedExtras }) => ({
              productId: product.id,
              productName: product.name,
              productDescription: product.description,
              quantity,
              unitPrice: product.price,
              extras: { create: selectedExtras.map((extra) => ({ extraId: extra.id, name: extra.name, price: extra.price })) },
            })) },
          },
          include: orderInclude,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      const order = this.toOrder(persisted);
      this.gateway.emitCreated(order);
      return order;
    } catch (error) {
      if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
        if (existing) return this.toOrder(existing);
      }
      throw error;
    }
  }

  async findAll(status?: OrderStatus) {
    const orders = await this.prisma.order.findMany({ where: status ? { status: status as DbOrderStatus } : undefined, include: orderInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    return orders.map((order) => this.toOrder(order));
  }

  async findKitchenQueue() {
    const orders = await this.prisma.order.findMany({ where: { status: { in: [DbOrderStatus.QUEUED, DbOrderStatus.PREPARING, DbOrderStatus.READY] } }, include: orderInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    return orders.map((order) => this.toOrder(order));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundException('Order not found');
    return this.toOrder(order);
  }

  async findTracking(publicToken: string) {
    const order = await this.prisma.order.findUnique({ where: { publicToken }, select: { orderNumber: true, publicToken: true, orderType: true, createdAt: true, status: true } });
    if (!order) throw new NotFoundException('Order not found');
    return { orderNumber: String(order.orderNumber), publicToken: order.publicToken, orderType: order.orderType === DbOrderType.DINE_IN ? 'dine-in' : 'takeaway', createdAt: order.createdAt.toISOString(), status: order.status as OrderStatus };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const persisted = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: orderInclude });
      if (!current) throw new NotFoundException('Order not found');
      this.state.assertTransition(current.status as OrderStatus, status);
      if (current.status === DbOrderStatus.QUEUED && status === OrderStatus.PREPARING) {
        const next = await tx.order.findFirst({ where: { status: DbOrderStatus.QUEUED }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
        if (next?.id !== current.id) throw new ConflictException(`Order ${next?.orderNumber} must be prepared first (FIFO)`);
      }
      return tx.order.update({ where: { id }, data: { status: status as DbOrderStatus, statusHistory: { create: { status: status as DbOrderStatus } } }, include: orderInclude });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    const order = this.toOrder(persisted);
    this.gateway.emitUpdated(order);
    return order;
  }

  private supportsExtras(category: string) { return category.startsWith('Tacos') || category.startsWith('Gringas'); }

  private toOrder(order: PersistedOrder): Order {
    return {
      id: order.id,
      orderNumber: String(order.orderNumber),
      publicToken: order.publicToken,
      customer: order.customer,
      orderType: order.orderType === DbOrderType.DINE_IN ? 'dine-in' : 'takeaway',
      status: order.status as OrderStatus,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      lines: order.items.map((item) => ({ id: item.id, productId: item.productId, name: item.productName, description: item.productDescription, quantity: item.quantity, unitPrice: Number(item.unitPrice), extras: item.extras.map((extra) => ({ id: extra.extraId, name: extra.name, price: Number(extra.price) })) })),
      statusHistory: order.statusHistory.map((entry) => ({ status: entry.status as OrderStatus, changedAt: entry.changedAt.toISOString() })),
    };
  }
}
