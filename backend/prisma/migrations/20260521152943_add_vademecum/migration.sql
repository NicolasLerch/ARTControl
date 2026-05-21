-- CreateEnum
CREATE TYPE "VademecumItemType" AS ENUM ('MEDICAMENTO', 'INSUMO', 'KIT', 'OTRO');

-- CreateTable
CREATE TABLE "VademecumItem" (
    "id" TEXT NOT NULL,
    "type" "VademecumItemType" NOT NULL DEFAULT 'MEDICAMENTO',
    "drug" TEXT,
    "commercialName" TEXT NOT NULL,
    "dose" TEXT,
    "lab" TEXT,
    "presentation" TEXT,
    "description" TEXT,
    "components" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VademecumItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VademecumItem_commercialName_idx" ON "VademecumItem"("commercialName");

-- CreateIndex
CREATE INDEX "VademecumItem_drug_idx" ON "VademecumItem"("drug");

-- CreateIndex
CREATE INDEX "VademecumItem_lab_idx" ON "VademecumItem"("lab");

-- CreateIndex
CREATE INDEX "VademecumItem_type_isActive_idx" ON "VademecumItem"("type", "isActive");
