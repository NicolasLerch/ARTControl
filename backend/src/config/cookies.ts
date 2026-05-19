import type { CookieOptions } from 'express';
import { env } from './env.js';

export const SESSION_COOKIE_NAME = 'artcontrol_session';

function getSameSitePolicy(): CookieOptions['sameSite'] {
  return env.COOKIE_SECURE ? 'none' : 'lax';
}

export function getSessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: getSameSitePolicy(),
    secure: env.COOKIE_SECURE,
    path: '/',
    expires: expiresAt,
  };
}

export function getClearSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: getSameSitePolicy(),
    secure: env.COOKIE_SECURE,
    path: '/',
  };
}
