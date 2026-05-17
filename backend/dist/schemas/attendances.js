import { z } from 'zod';
import { cuidSchema, dateStringSchema } from './common.js';
export const attendanceCreateSchema = z.object({
    patientId: cuidSchema,
    appointmentId: cuidSchema.optional().nullable(),
    fechaAtencion: dateStringSchema,
    observaciones: z.string().trim().max(2000).optional().nullable(),
});
export const attendanceUpdateSchema = z.object({
    fechaAtencion: dateStringSchema.optional(),
    observaciones: z.string().trim().max(2000).optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const attendanceQuerySchema = z.object({
    date: dateStringSchema.optional(),
    patientId: cuidSchema.optional(),
    today: z.coerce.boolean().optional(),
});
