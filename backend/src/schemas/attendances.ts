import { z } from 'zod';
import { cuidSchema, dateStringSchema } from './common.js';

const attendanceDateTimeSchema = z.string().trim().refine((value) => {
  if (!value) return false;

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}, 'Fecha de atención inválida');

export const attendanceCreateSchema = z.object({
  patientId: cuidSchema,
  appointmentId: cuidSchema.optional().nullable(),
  fechaAtencion: attendanceDateTimeSchema,
  observaciones: z.string().trim().max(2000).optional().nullable(),
});

export const attendanceUpdateSchema = z.object({
  patientId: cuidSchema.optional(),
  fechaAtencion: attendanceDateTimeSchema.optional(),
  observaciones: z.string().trim().max(2000).optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');

export const attendanceQuerySchema = z.object({
  date: dateStringSchema.optional(),
  patientId: cuidSchema.optional(),
  today: z.coerce.boolean().optional(),
});
