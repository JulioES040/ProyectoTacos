import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('El Taquero API')
    .setDescription('API del punto de venta, cola FIFO de cocina y seguimiento publico de pedidos.')
    .setVersion('0.1.0')
    .addTag('health', 'Estado del servicio')
    .addTag('orders', 'Creacion y operacion de pedidos')
    .addTag('products', 'Administracion del menu y catalogo del POS')
    .addTag('tracking', 'Consulta publica mediante el token del QR')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
