import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsGateway } from './products.gateway';
import { ProductsService } from './products.service';

@Module({ controllers: [ProductsController], providers: [ProductsService, ProductsGateway], exports: [ProductsService] })
export class ProductsModule {}
