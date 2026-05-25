-- CreateTable
CREATE TABLE "Art" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Art_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyBranch" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtPharmacyCoverage" (
    "id" TEXT NOT NULL,
    "artId" TEXT NOT NULL,
    "pharmacyBranchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtPharmacyCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Art_nombre_key" ON "Art"("nombre");

-- CreateIndex
CREATE INDEX "Pharmacy_nombre_idx" ON "Pharmacy"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_nombre_key" ON "Pharmacy"("nombre");

-- CreateIndex
CREATE INDEX "PharmacyBranch_direccion_idx" ON "PharmacyBranch"("direccion");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyBranch_pharmacyId_direccion_key" ON "PharmacyBranch"("pharmacyId", "direccion");

-- CreateIndex
CREATE INDEX "ArtPharmacyCoverage_artId_idx" ON "ArtPharmacyCoverage"("artId");

-- CreateIndex
CREATE INDEX "ArtPharmacyCoverage_pharmacyBranchId_idx" ON "ArtPharmacyCoverage"("pharmacyBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtPharmacyCoverage_artId_pharmacyBranchId_key" ON "ArtPharmacyCoverage"("artId", "pharmacyBranchId");

-- AddForeignKey
ALTER TABLE "PharmacyBranch" ADD CONSTRAINT "PharmacyBranch_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtPharmacyCoverage" ADD CONSTRAINT "ArtPharmacyCoverage_artId_fkey" FOREIGN KEY ("artId") REFERENCES "Art"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtPharmacyCoverage" ADD CONSTRAINT "ArtPharmacyCoverage_pharmacyBranchId_fkey" FOREIGN KEY ("pharmacyBranchId") REFERENCES "PharmacyBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
