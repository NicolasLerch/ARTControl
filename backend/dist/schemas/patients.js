import { z } from 'zod';
const dniSchema = z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 numeros, sin puntos ni guiones');
const patientCaseBaseSchema = z.object({
    art: z.string().trim().min(1, 'La ART es obligatoria').max(120, 'La ART no puede superar los 120 caracteres'),
    numeroSiniestro: z.string().trim().min(1, 'El numero de siniestro es obligatorio').max(120, 'El numero de siniestro no puede superar los 120 caracteres'),
});
export const patientCreateSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
    apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'El apellido no puede superar los 100 caracteres'),
    dni: dniSchema,
    initialCase: patientCaseBaseSchema,
});
export const patientUpdateSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres').optional(),
    apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'El apellido no puede superar los 100 caracteres').optional(),
    dni: dniSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const patientCaseCreateSchema = patientCaseBaseSchema;
export const patientCaseUpdateSchema = patientCaseBaseSchema.partial().refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');
export const prescriptionPreviewSchema = z.object({
    patientCaseId: z.string().trim().min(1, 'El caso es obligatorio'),
    texto: z.string().trim().min(1, 'El texto de la receta es obligatorio').max(4000, 'El texto de la receta no puede superar los 4000 caracteres'),
});
export const patientQuerySchema = z.object({
    q: z.string().trim().optional(),
    dni: z.string().trim().optional(),
    apellido: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
