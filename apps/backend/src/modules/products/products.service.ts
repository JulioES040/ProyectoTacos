import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { Product } from './product.entity';
import { ProductsGateway } from './products.gateway';

const seed: Array<Omit<Product, 'createdAt' | 'updatedAt'>> = [
  { id: 'pastor', name: 'Taco al pastor', description: 'Pastor marinado', price: 38, category: 'Tacos clasicos', available: true },
  { id: 'carnitas', name: 'Taco carnitas', description: 'Carnitas de cerdo', price: 38, category: 'Tacos clasicos', available: true },
  { id: 'pibil', name: 'Taco pollo pibil', description: 'Pollo achiote', price: 38, category: 'Tacos clasicos', available: true },
  { id: 'cachete', name: 'Taco cachete', description: 'Cachete de res', price: 38, category: 'Tacos clasicos', available: true },
  { id: 'culotte', name: 'Taco culotte', description: 'Culotte premium', price: 50, category: 'Tacos premium', available: true },
  { id: 'camaron', name: 'Taco camaron', description: 'Camaron al ajo', price: 50, category: 'Tacos premium', available: true },
  { id: 'pulpo', name: 'Taco pulpo', description: 'Pulpo a las brasas', price: 50, category: 'Tacos premium', available: false },
  { id: 'lengua', name: 'Taco lengua', description: 'Lengua de res', price: 50, category: 'Tacos premium', available: true },
  { id: 'gringa-pastor', name: 'Gringa al pastor', description: 'Pastor y queso', price: 40, category: 'Gringas clasicas', available: true },
  { id: 'gringa-carnitas', name: 'Gringa carnitas', description: 'Carnitas y queso', price: 40, category: 'Gringas clasicas', available: true },
  { id: 'gringa-pibil', name: 'Gringa pollo pibil', description: 'Pollo y queso Oaxaca', price: 40, category: 'Gringas clasicas', available: true },
  { id: 'gringa-culotte', name: 'Gringa culotte', description: 'Culotte y queso', price: 55, category: 'Gringas premium', available: true },
  { id: 'birria', name: 'Taquesos de birria', description: 'Birria y queso', price: 48, category: 'Taquesos', available: true },
  { id: 'agua', name: 'Agua fresca', description: 'Jamaica, horchata o limon', price: 18, category: 'Bebidas', available: true },
];

@Injectable()
export class ProductsService {
  private readonly products = new Map<string, Product>();

  constructor(private readonly gateway: ProductsGateway) {
    const now = new Date().toISOString();
    seed.forEach((product) => this.products.set(product.id, { ...product, createdAt: now, updatedAt: now }));
  }

  findAll() { return [...this.products.values()].sort((a, b) => a.name.localeCompare(b.name)); }
  categories() { return [...new Set(this.findAll().map((product) => product.category))].sort(); }
  findOne(id: string) { const product = this.products.get(id); if (!product) throw new NotFoundException('Product not found'); return product; }

  create(dto: CreateProductDto) {
    this.assertUniqueName(dto.name);
    const now = new Date().toISOString();
    const product: Product = { id: randomUUID(), ...this.clean(dto), createdAt: now, updatedAt: now };
    this.products.set(product.id, product);
    this.gateway.created(product);
    return product;
  }

  update(id: string, dto: UpdateProductDto) {
    const current = this.findOne(id);
    if (dto.name && dto.name.trim().toLowerCase() !== current.name.toLowerCase()) this.assertUniqueName(dto.name);
    const product = { ...current, ...this.clean(dto), updatedAt: new Date().toISOString() };
    this.products.set(id, product);
    this.gateway.updated(product);
    return product;
  }

  remove(id: string) { const product = this.findOne(id); this.products.delete(id); this.gateway.deleted(id); return product; }

  private assertUniqueName(name: string) {
    if (this.findAll().some((product) => product.name.toLowerCase() === name.trim().toLowerCase())) throw new ConflictException('A product with this name already exists');
  }

  private clean<T extends CreateProductDto | UpdateProductDto>(dto: T): T {
    return { ...dto, ...(dto.name !== undefined && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() }), ...(dto.category !== undefined && { category: dto.category.trim() }) };
  }
}
