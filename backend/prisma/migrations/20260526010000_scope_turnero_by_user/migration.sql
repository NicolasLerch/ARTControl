ALTER TABLE "Appointment"
ADD COLUMN "userId" TEXT;

ALTER TABLE "Attendance"
ADD COLUMN "userId" TEXT;

WITH first_user AS (
  SELECT id
  FROM "User"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
UPDATE "Appointment"
SET "userId" = first_user.id
FROM first_user
WHERE "Appointment"."userId" IS NULL;

WITH first_user AS (
  SELECT id
  FROM "User"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
UPDATE "Attendance"
SET "userId" = first_user.id
FROM first_user
WHERE "Attendance"."userId" IS NULL;

ALTER TABLE "Appointment"
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Attendance"
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");
CREATE INDEX "Appointment_userId_fecha_idx" ON "Appointment"("userId", "fecha");
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");
CREATE INDEX "Attendance_userId_fechaAtencion_idx" ON "Attendance"("userId", "fechaAtencion");
