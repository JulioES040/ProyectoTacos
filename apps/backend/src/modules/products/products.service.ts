import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { Product } from './product.entity';
import { ProductsGateway } from './products.gateway';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly gateway: ProductsGateway) {}

  async findAll() {
    const products = await this.prisma.product.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    return products.map(this.toProduct);
  }

  async categories() {
    const products = await this.prisma.product.findMany({ where: { deletedAt: null }, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
    return products.map(({ category }) => category);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    return this.toProduct(product);
  }

  async create(dto: CreateProductDto) {
    const clean = this.clean(dto);
    try {
      const product = this.toProduct(await this.prisma.product.create({ data: { id: randomUUID(), ...clean, nameNormalized: this.normalize(clean.name) } }));
      this.gateway.created(product);
      return product;
    } catch (error) { this.rethrowUnique(error); }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const clean = this.clean(dto);
    try {
      const product = this.toProduct(await this.prisma.product.update({ where: { id }, data: { ...clean, ...(clean.name && { nameNormalized: this.normalize(clean.name) }) } }));
      this.gateway.updated(product);
      return product;
    } catch (error) { this.rethrowUnique(error); }
  }

  async remove(id: string) {
    const current = await this.findOne(id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), available: false } });
    this.gateway.deleted(id);
    return current;
  }

  private readonly toProduct = (product: { id: string; name: string; description: string; price: Prisma.Decimal; category: string; available: boolean; createdAt: Date; updatedAt: Date }): Product => ({
    ...product,
    price: Number(product.price),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  });

  private normalize(value: string) { return value.trim().toLocaleLowerCase('es'); }

  private clean<T extends CreateProductDto | UpdateProductDto>(dto: T): T {
    return { ...dto, ...(dto.name !== undefined && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() }), ...(dto.category !== undefined && { category: dto.category.trim() }) };
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A product with this name already exists');
    throw error;
  }
}
