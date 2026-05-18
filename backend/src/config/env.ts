import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  FRONTEND_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(4000),
});

export const env = envSchema.parse(process.env);
