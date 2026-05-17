import { z } from 'zod';

export const cuidSchema = z.string().cuid();
export const dateStringSchema = z.string().date();
export const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
