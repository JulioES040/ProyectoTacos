# El Buen Taco

Monorepo para POS, cocina, seguimiento de pedidos y reportes.

## Estructura

- `apps/frontend`: Next.js, App Router y arquitectura por funcionalidades.
- `apps/backend`: NestJS con monolito modular y capas ligeras de dominio, aplicación, infraestructura y presentación.
- `packages/contracts`: contratos TypeScript compartidos.
- `infra/nginx`: configuración de proxy para despliegue.

## Inicio local

1. Copia `.env.example` a `.env`.
2. Instala dependencias con `npm install`.
3. Ejecuta `npm run backend` en una terminal.
4. Ejecuta `npm run frontend` en otra terminal.

El backend usa almacenamiento en memoria en esta etapa. No requiere base de datos y las ordenes se eliminan al reiniciar el proceso.

- Frontend: `http://localhost:3103` (o el puerto que indique Next.js).
- Control de menu: `http://localhost:3103/menu`.
- API: `http://localhost:3001/api`.
- Swagger: `http://localhost:3001/docs`.
- Documentacion tecnica: [`docs/backend-api.md`](docs/backend-api.md).
