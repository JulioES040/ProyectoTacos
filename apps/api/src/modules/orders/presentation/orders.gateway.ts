import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({ cors: true, namespace: '/orders' })
export class OrdersGateway {}
