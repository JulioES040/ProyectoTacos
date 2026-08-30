import { Module } from '@nestjs/common';
import { OrdersGateway } from './presentation/orders.gateway';

@Module({ providers: [OrdersGateway] })
export class OrdersModule {}
