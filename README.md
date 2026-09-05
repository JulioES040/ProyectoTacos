# El Buen Taco

Monorepo para POS, cocina, seguimiento de pedidos y reportes.

## Estructura

- `apps/frontend`: Next.js, App Router y arquitectura por funcionalidades.
- `apps/backend`: NestJS con monolito modular y capas ligeras de dominio, aplicación, infraestructura y presentación.
- `packages/contracts`: contratos TypeScript compartidos.
- `infra/nginx`: configuración de proxy para despliegue.

## Inicio local

1. Copia `.env.example` a `.env`.
2. Instala dependencias con `npm.cmd install`.
3. Prepara PostgreSQL, Prisma, migraciones y datos iniciales con `npm.cmd run setup`.
4. Inicia frontend y backend juntos con `npm.cmd run dev`.

El backend requiere PostgreSQL. Prisma aplica las migraciones y el seed crea el catalogo inicial y los usuarios locales.

- Cajero: `cajero` / `cajero123`.
- Cocina: `cocina` / `cocina123`.

Estas contrasenas son solamente valores de desarrollo y deben sustituirse mediante variables de entorno en cualquier despliegue.

- Frontend: `http://localhost:3103` (o el puerto que indique Next.js).
- Control de menu: `http://localhost:3103/menu`.
- API: `http://localhost:3001/api`.
- Swagger: `http://localhost:3001/docs`.
- Documentacion tecnica: [`docs/backend-api.md`](docs/backend-api.md).
