import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { ProductsService } from './products.service';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('products')
@Roles(UserRole.CASHIER)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() @ApiOperation({ summary: 'Lista el catalogo utilizado por el POS' }) findAll() { return this.products.findAll(); }
  @Get('categories') @ApiOperation({ summary: 'Lista las categorias actuales del menu' }) categories() { return this.products.categories(); }
  @Get(':id') @ApiOperation({ summary: 'Obtiene un producto' }) findOne(@Param('id') id: string) { return this.products.findOne(id); }
  @Post() @ApiOperation({ summary: 'Crea un producto del menu' }) create(@Body() dto: CreateProductDto) { return this.products.create(dto); }
  @Patch(':id') @ApiOperation({ summary: 'Actualiza producto, precio o disponibilidad' }) update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Elimina un producto del menu' }) remove(@Param('id') id: string) { return this.products.remove(id); }
}
