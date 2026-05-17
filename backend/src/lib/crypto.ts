import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(token)
    .digest('hex');
}

export function generateChallengeId() {
  return crypto.randomUUID();
}
