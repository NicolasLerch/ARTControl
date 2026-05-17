import { z } from 'zod';
export const patientCreateSchema = z.object({
    nombre: z.string().trim().min(1).max(100),
    apellido: z.string().trim().min(1).max(100),
    dni: z.string().trim().min(7).max(20),
});
export const patientUpdateSchema = patientCreateSchema.partial().refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const patientQuerySchema = z.object({
    q: z.string().trim().optional(),
    dni: z.string().trim().optional(),
    apellido: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
