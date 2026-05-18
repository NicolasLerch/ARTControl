import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const verifyTwoFactorSchema = z.object({
  challengeId: z.string().min(1),
  token: z.string().length(6).regex(/^\d{6}$/),
});

export const confirmTwoFactorSchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
});
