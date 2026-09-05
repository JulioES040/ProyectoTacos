import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password';

const prisma = new PrismaClient();

const products = [
  ['pastor', 'Taco al pastor', 'Pastor marinado', 38, 'Tacos clasicos', true],
  ['carnitas', 'Taco carnitas', 'Carnitas de cerdo', 38, 'Tacos clasicos', true],
  ['pibil', 'Taco pollo pibil', 'Pollo achiote', 38, 'Tacos clasicos', true],
  ['cachete', 'Taco cachete', 'Cachete de res', 38, 'Tacos clasicos', true],
  ['culotte', 'Taco culotte', 'Culotte premium', 50, 'Tacos premium', true],
  ['camaron', 'Taco camaron', 'Camaron al ajo', 50, 'Tacos premium', true],
  ['pulpo', 'Taco pulpo', 'Pulpo a las brasas', 50, 'Tacos premium', false],
  ['lengua', 'Taco lengua', 'Lengua de res', 50, 'Tacos premium', true],
  ['gringa-pastor', 'Gringa al pastor', 'Pastor y queso', 40, 'Gringas clasicas', true],
  ['gringa-carnitas', 'Gringa carnitas', 'Carnitas y queso', 40, 'Gringas clasicas', true],
  ['gringa-pibil', 'Gringa pollo pibil', 'Pollo y queso Oaxaca', 40, 'Gringas clasicas', true],
  ['gringa-culotte', 'Gringa culotte', 'Culotte y queso', 55, 'Gringas premium', true],
  ['birria', 'Taquesos de birria', 'Birria y queso', 48, 'Taquesos', true],
  ['agua', 'Agua fresca', 'Jamaica, horchata o limon', 18, 'Bebidas', true],
  ['cocacola', 'Coca-Cola', 'Gaseosa', 10, 'Bebidas', true],
] as const;

async function seedUser(username: string, password: string, role: UserRole) {
  const passwordHash = hashPassword(password);
  await prisma.user.upsert({ where: { username }, update: { passwordHash, role, active: true }, create: { username, passwordHash, role } });
}

async function main() {
  const cashierPassword = process.env.SEED_CASHIER_PASSWORD ?? 'cajero123';
  const kitchenPassword = process.env.SEED_KITCHEN_PASSWORD ?? 'cocina123';
  if (process.env.NODE_ENV === 'production' && (!process.env.SEED_CASHIER_PASSWORD || !process.env.SEED_KITCHEN_PASSWORD)) throw new Error('Seed passwords are required in production');

  await seedUser('cajero', cashierPassword, UserRole.CASHIER);
  await seedUser('cocina', kitchenPassword, UserRole.KITCHEN);
  await prisma.extra.upsert({ where: { id: 'cheese' }, update: {}, create: { id: 'cheese', name: 'Queso extra', price: 5 } });
  await prisma.extra.upsert({ where: { id: 'avocado' }, update: {}, create: { id: 'avocado', name: 'Aguacate', price: 7 } });

  for (const [id, name, description, price, category, available] of products) {
    const data = { name, nameNormalized: name.toLowerCase(), description, price, category, available, deletedAt: null };
    await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
}

main().finally(() => prisma.$disconnect());
