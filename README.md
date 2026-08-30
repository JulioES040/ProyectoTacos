# Tacos Platform

Monorepo para POS, cocina, seguimiento de pedidos y reportes.

## Estructura

- `apps/frontend`: Next.js, App Router y arquitectura por funcionalidades.
- `apps/backend`: NestJS con monolito modular y capas ligeras de dominio, aplicación, infraestructura y presentación.
- `packages/contracts`: contratos TypeScript compartidos.
- `infra/nginx`: configuración de proxy para despliegue.

## Inicio local

1. Copia `.env.example` a `.env`.
2. Instala dependencias con `npm install`.
3. Inicia PostgreSQL con `docker compose up -d postgres`.
4. Ejecuta `npm run frontend` y `npm run backend` en terminales separadas.
