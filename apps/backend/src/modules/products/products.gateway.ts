import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Product } from './product.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/products' })
export class ProductsGateway {
  @WebSocketServer() private server!: Server;
  created(product: Product) { this.server.emit('product.created', product); }
  updated(product: Product) { this.server.emit('product.updated', product); }
  deleted(id: string) { this.server.emit('product.deleted', { id }); }
}
