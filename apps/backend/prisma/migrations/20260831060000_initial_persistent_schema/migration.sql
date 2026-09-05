-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CASHIER', 'KITCHEN');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'QUEUED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "nameNormalized" VARCHAR(80) NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extra" (
    "id" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "publicToken" VARCHAR(32) NOT NULL,
    "customer" VARCHAR(100) NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "total" DECIMAL(12,2) NOT NULL,
    "idempotencyKey" VARCHAR(100),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" VARCHAR(64) NOT NULL,
    "productName" VARCHAR(80) NOT NULL,
    "productDescription" VARCHAR(160) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemExtra" (
    "id" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "extraId" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItemExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "idx_users_role_active" ON "User"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Product_nameNormalized_key" ON "Product"("nameNormalized");

-- CreateIndex
CREATE INDEX "idx_products_catalog" ON "Product"("deletedAt", "available", "category");

-- CreateIndex
CREATE INDEX "idx_products_category_name" ON "Product"("category", "name");

-- CreateIndex
CREATE INDEX "idx_extras_available" ON "Extra"("available");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "idx_orders_status_fifo" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_orders_recent" ON "Order"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_cashier_recent" ON "Order"("createdById", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_items_order" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "idx_order_items_product" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "idx_order_item_extras_extra" ON "OrderItemExtra"("extraId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_item_extra" ON "OrderItemExtra"("orderItemId", "extraId");

-- CreateIndex
CREATE INDEX "idx_order_status_history" ON "OrderStatusHistory"("orderId", "changedAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemExtra" ADD CONSTRAINT "OrderItemExtra_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemExtra" ADD CONSTRAINT "OrderItemExtra_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "Extra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Atomic, database-owned ticket numbering.
CREATE SEQUENCE "order_number_seq" START WITH 5608 INCREMENT BY 1 NO CYCLE;

-- Partial indexes keep the hot operational queries small as history grows.
CREATE INDEX "idx_orders_kitchen_fifo" ON "Order" ("createdAt", "id") WHERE "status" IN ('QUEUED', 'PREPARING', 'READY');
CREATE INDEX "idx_orders_ready_recent" ON "Order" ("updatedAt" DESC) WHERE "status" = 'READY';
CREATE INDEX "idx_products_available_category" ON "Product" ("category", "name") WHERE "deletedAt" IS NULL AND "available" = true;
