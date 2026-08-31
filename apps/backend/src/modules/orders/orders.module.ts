import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { OrdersService } from './application/orders.service';
import { OrderRepository } from './domain/repositories/order.repository';
import { OrderStateService } from './domain/services/order-state.service';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order.repository';
import { OrdersController, TrackingController } from './presentation/orders.controller';
import { OrdersGateway } from './presentation/orders.gateway';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController, TrackingController],
  providers: [
    OrdersService,
    OrdersGateway,
    OrderStateService,
    { provide: OrderRepository, useClass: InMemoryOrderRepository },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
