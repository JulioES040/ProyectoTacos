# Backend API

## Alcance actual

El backend es un monolito modular en NestJS 11. La primera implementacion cubre el cobro del POS, la cola FIFO de cocina, la entrega y el seguimiento publico del QR.

La persistencia utiliza PostgreSQL mediante Prisma. Las ordenes, sus articulos, extras, historial de estados, usuarios y catalogo sobreviven a reinicios del backend.

## Tecnologias

- NestJS 11 para HTTP, validacion y organizacion modular.
- `class-validator` y `class-transformer` para validar entradas.
- Swagger/OpenAPI en `/docs`.
- Socket.IO, namespace `/orders`, para sincronizacion en tiempo real.
- PostgreSQL y Prisma para persistencia, migraciones e indices.

URL local base: `http://localhost:3001/api`.

## Flujo de estados

`CREATED -> PAID -> QUEUED -> PREPARING -> READY -> DELIVERED`

Una orden tambien puede cancelarse desde `CREATED`, `PAID` o `QUEUED`. El endpoint rechaza saltos y retrocesos. Al pasar de `QUEUED` a `PREPARING`, el servidor comprueba que sea la orden pendiente mas antigua.

## Endpoints

### Sesion administrativa

`POST /api/auth/login` recibe `username` y `password`, valida un hash `scrypt` almacenado en PostgreSQL y crea una cookie HTTP-only con un JWT HS256 que expira en ocho horas. El token valida firma, emisor y audiencia. `GET /api/auth/session` verifica la sesion y `POST /api/auth/logout` la elimina. El rol `CASHIER` puede operar todo el sistema; `KITCHEN` solo consulta la cola y cambia estados. El seguimiento del QR permanece publico.

### Salud

`GET /api/health`

Comprueba la conexion con PostgreSQL e indica `storage: postgresql`.

### Crear y cobrar una orden

`POST /api/orders`

Header recomendado: `Idempotency-Key: <uuid>`. Repetir la solicitud con la misma clave devuelve la orden original y evita duplicar el cobro.

```json
{
  "customer": "Cliente mostrador",
  "orderType": "dine-in",
  "items": [
    {
      "productId": "pastor",
      "quantity": 2,
      "extras": ["cheese", "avocado"]
    }
  ]
}
```

El servidor obtiene nombre, descripcion y precio desde su catalogo, calcula `total`, genera `id`, `orderNumber` y `publicToken`, registra internamente pago y encola la orden. Cada linea puede recibir los extras `cheese` (Q5) y `avocado` (Q7), que se aplican a cada unidad y se incluyen en el ticket y la vista de cocina. Los productos agotados no pueden agregarse a una orden.

### Administrar el menu

- `GET /api/products`: lista el catalogo que consume el POS.
- `GET /api/products/categories`: lista las categorias existentes.
- `GET /api/products/:id`: consulta un producto.
- `POST /api/products`: crea un producto con `name`, `description`, `price`, `category` y `available`.
- `PATCH /api/products/:id`: modifica cualquiera de esos campos.
- `DELETE /api/products/:id`: elimina el producto del menu.

El namespace Socket.IO `/products` emite `product.created`, `product.updated` y `product.deleted`. La vista de administracion y el POS se actualizan al recibirlos.

### Consultar ordenes

- `GET /api/orders`: detalle interno de todas las ordenes.
- `GET /api/orders?status=READY`: filtro opcional por estado.
- `GET /api/orders/kitchen`: ordenes `QUEUED`, `PREPARING` y `READY`, ordenadas por llegada.
- `GET /api/orders/:id`: detalle interno de una orden.

### Cambiar estado

`PATCH /api/orders/:id/status`

```json
{ "status": "PREPARING" }
```

Responde `400` para una transicion invalida, `404` si la orden no existe y `409` si se intenta comenzar una orden fuera del orden FIFO.

### Seguimiento publico

`GET /api/tracking/:publicToken`

Es el endpoint utilizado por la pagina enlazada en el QR. Expone solamente `orderNumber`, `publicToken`, `orderType`, `createdAt` y `status`; no entrega el nombre del cliente, precios ni detalle interno.

## Eventos Socket.IO

Conexion: `http://localhost:3001/orders`.

- `order.created`: nueva orden disponible para cocina y caja.
- `order.status.updated`: orden interna actualizada para cocina y caja.
- `order.track` (cliente a servidor): `{ "publicToken": "EBT-A1B2C3D4" }` suscribe la pantalla publica a una orden.
- `tracking.status.updated`: estado publico limitado, emitido solo a la sala del token suscrito.

REST sigue siendo la fuente de verdad. Los eventos indican a las interfaces que deben actualizarse o entregan el nuevo estado publico.

## Variables de entorno

- `PORT`: puerto HTTP del backend; predeterminado `3001`.
- `DATABASE_URL`: conexion PostgreSQL utilizada por Prisma.
- `SESSION_SECRET`: secreto para firmar JWT; en produccion debe contener al menos 32 caracteres aleatorios.
- `SEED_CASHIER_PASSWORD` y `SEED_KITCHEN_PASSWORD`: contrasenas creadas o rotadas por el seed.
- `FRONTEND_ORIGIN`: origen CORS permitido. Acepta varios valores separados por coma.
- `NEXT_PUBLIC_API_URL`: URL `/api` consumida por Next.js.
- `NEXT_PUBLIC_SOCKET_URL`: origen de Socket.IO sin `/api`.
- `NEXT_PUBLIC_APP_URL`: origen publico incluido en el QR.

Para probar desde otras tablets de la misma red, estas tres variables publicas deben usar la IP LAN del equipo servidor en lugar de `localhost`.

## Limitaciones deliberadas

- Sin integracion real con terminal de pago.
- El despliegue debe configurar respaldo y monitoreo de PostgreSQL.
- Para produccion deben reemplazarse todos los secretos y contrasenas de desarrollo.

Estas limitaciones deben resolverse antes de un despliegue productivo.
