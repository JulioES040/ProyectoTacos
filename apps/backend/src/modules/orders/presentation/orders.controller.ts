import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from '../application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../application/dto/update-order-status.dto';
import { OrdersService } from '../application/orders.service';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { Public } from '../../auth/public.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Cobra, crea y envia una orden a la cola FIFO' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Evita ordenes duplicadas si caja reintenta el cobro.' })
  create(@Body() dto: CreateOrderDto, @Headers('idempotency-key') key?: string) { return this.orders.create(dto, key); }

  @Get()
  @ApiOperation({ summary: 'Lista ordenes, opcionalmente por estado' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  findAll(@Query('status') status?: OrderStatus) { return this.orders.findAll(status); }

  @Get('kitchen')
  @ApiOperation({ summary: 'Lista la cola activa de cocina en orden FIFO' })
  kitchen() { return this.orders.findKitchenQueue(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle interno de una orden' })
  findOne(@Param('id') id: string) { return this.orders.findOne(id); }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Avanza el estado de una orden validando la transicion' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.orders.updateStatus(id, dto.status); }
}

@ApiTags('tracking')
@Public()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly orders: OrdersService) {}

  @Get(':publicToken')
  @ApiOperation({ summary: 'Consulta publica y limitada para el QR del ticket' })
  @ApiParam({ name: 'publicToken', example: 'EBT-A1B2C3D4' })
  find(@Param('publicToken') publicToken: string) { return this.orders.findTracking(publicToken); }
}
