import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './health.controller';
import { CategoriesModule } from './modules/categories/categories.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  controllers: [HealthController],
  imports: [
    EventEmitterModule.forRoot(),
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    KitchenModule,
    PaymentsModule,
    CashRegisterModule,
    TrackingModule,
    ReportsModule,
  ],
})
export class AppModule {}
