-- CreateTable
CREATE TABLE "PatientCase" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "numeroSiniestro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientCase_patientId_idx" ON "PatientCase"("patientId");

-- CreateIndex
CREATE INDEX "PatientCase_patientId_createdAt_idx" ON "PatientCase"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "PatientCase" ADD CONSTRAINT "PatientCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
