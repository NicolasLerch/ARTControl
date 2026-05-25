import { z } from 'zod';
import { cuidSchema } from './common.js';

const textField = (label: string) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(200, `${label} no puede superar los 200 caracteres`);

export const pharmacyCoverageQuerySchema = z.object({
  q: z.string().trim().optional(),
  artId: cuidSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const pharmacyCoveragePayloadSchema = z.object({
  artNombre: textField('La ART'),
  pharmacyNombre: textField('La farmacia'),
  direccion: textField('La direccion'),
});

export const pharmacyCoverageCreateSchema = pharmacyCoveragePayloadSchema;

export const pharmacyCoverageUpdateSchema = pharmacyCoveragePayloadSchema;

export const pharmacyOptionsQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
