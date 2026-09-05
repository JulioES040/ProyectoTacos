import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersService } from './application/orders.service';
import { OrderStateService } from './domain/services/order-state.service';
import { OrdersController, TrackingController } from './presentation/orders.controller';
import { OrdersGateway } from './presentation/orders.gateway';

@Module({
  imports: [ProductsModule, AuthModule],
  controllers: [OrdersController, TrackingController],
  providers: [
    OrdersService,
    OrdersGateway,
    OrderStateService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
