import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Order } from '../domain/entities/order.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('order.track')
  trackOrder(@ConnectedSocket() socket: Socket, @MessageBody() body: { publicToken?: string }) {
    if (body.publicToken) socket.join(this.room(body.publicToken));
    return { event: 'order.tracked', data: { publicToken: body.publicToken } };
  }

  emitCreated(order: Order) {
    this.server.emit('order.created', order);
  }

  emitUpdated(order: Order) {
    this.server.emit('order.status.updated', order);
    this.server.to(this.room(order.publicToken)).emit('tracking.status.updated', this.toTracking(order));
  }

  private room(publicToken: string) {
    return `order:${publicToken}`;
  }

  private toTracking(order: Order) {
    return { orderNumber: order.orderNumber, publicToken: order.publicToken, orderType: order.orderType, createdAt: order.createdAt, status: order.status };
  }
}
