import { z } from 'zod';
import { cuidSchema, dateStringSchema, timeStringSchema } from './common.js';

const appointmentStatusEnum = z.enum(['PENDIENTE', 'ASISTIO', 'NO_ASISTIO', 'CANCELADO']);

export const appointmentCreateSchema = z.object({
  patientId: cuidSchema,
  fecha: dateStringSchema,
  hora: timeStringSchema,
  observaciones: z.string().trim().max(1000).optional().nullable(),
});

export const appointmentUpdateSchema = z.object({
  patientId: cuidSchema.optional(),
  fecha: dateStringSchema.optional(),
  hora: timeStringSchema.optional(),
  observaciones: z.string().trim().max(1000).optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');

export const appointmentStatusSchema = z.object({
  estado: appointmentStatusEnum,
});

export const appointmentQuerySchema = z.object({
  date: dateStringSchema.optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  status: appointmentStatusEnum.optional(),
  patientId: cuidSchema.optional(),
});
