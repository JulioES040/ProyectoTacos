import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../enums/order-status.enum';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  CREATED: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.QUEUED, OrderStatus.CANCELLED],
  QUEUED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrderStateService {
  assertTransition(current: OrderStatus, next: OrderStatus): void {
    if (!transitions[current].includes(next)) {
      throw new BadRequestException(`Invalid order transition: ${current} -> ${next}`);
    }
  }
}
