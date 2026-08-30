import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
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
