import { z } from 'zod';
import { cuidSchema } from './common.js';

const roleSchema = z.enum(['ADMIN', 'USER']);

const nombreSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const apellidoSchema = z
  .string()
  .trim()
  .min(1, 'El apellido es obligatorio')
  .max(100, 'El apellido no puede superar los 100 caracteres');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'El email es obligatorio')
  .email('El email debe ser valido')
  .max(255, 'El email no puede superar los 255 caracteres');

const passwordSchema = z
  .string()
  .min(8, 'La password debe tener al menos 8 caracteres')
  .max(100, 'La password no puede superar los 100 caracteres');

export const userCreateSchema = z.object({
  nombre: nombreSchema,
  apellido: apellidoSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export const userUpdateSchema = z.object({
  nombre: nombreSchema.optional(),
  apellido: apellidoSchema.optional(),
  email: emailSchema.optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo');

export const userQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const userParamsSchema = z.object({
  id: cuidSchema,
});
