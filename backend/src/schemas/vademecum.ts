import { z } from 'zod';

const vademecumItemTypeSchema = z.enum(['MEDICAMENTO', 'INSUMO', 'KIT', 'OTRO']);

function normalizeVademecumInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const input = value as Record<string, unknown>;

  return {
    ...input,
    type: input.type,
    drug: input.drug ?? input.droga,
    commercialName: input.commercialName ?? input.nombreComercial,
    dose: input.dose ?? input.dosis,
    lab: input.lab ?? input.laboratorio,
    presentation: input.presentation ?? input.presentacion,
    description: input.description ?? input.indicaciones,
    components: input.components,
    notes: input.notes,
    isActive: input.isActive,
  };
}

const optionalNullableText = (max: number) => z.string().trim().max(max).optional().nullable();

const vademecumBaseSchema = z.object({
  type: vademecumItemTypeSchema.default('MEDICAMENTO'),
  drug: optionalNullableText(200),
  commercialName: z.string().trim().min(1, 'El nombre comercial es obligatorio').max(200),
  dose: optionalNullableText(100),
  lab: optionalNullableText(200),
  presentation: optionalNullableText(200),
  description: optionalNullableText(2000),
  components: optionalNullableText(2000),
  notes: optionalNullableText(2000),
  isActive: z.boolean().default(true),
});

export const vademecumCreateSchema = z.preprocess(
  normalizeVademecumInput,
  vademecumBaseSchema,
);

export const vademecumUpdateSchema = z.preprocess(
  normalizeVademecumInput,
  vademecumBaseSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo'),
);

export const vademecumQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: vademecumItemTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
