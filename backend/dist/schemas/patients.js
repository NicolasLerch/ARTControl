import { z } from 'zod';
const dniSchema = z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 numeros, sin puntos ni guiones');
export const patientCreateSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
    apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'El apellido no puede superar los 100 caracteres'),
    dni: dniSchema,
});
export const patientUpdateSchema = patientCreateSchema.partial().refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const patientQuerySchema = z.object({
    q: z.string().trim().optional(),
    dni: z.string().trim().optional(),
    apellido: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
