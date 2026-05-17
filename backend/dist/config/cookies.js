import { env } from './env.js';
export const SESSION_COOKIE_NAME = 'artcontrol_session';
export function getSessionCookieOptions(expiresAt) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.COOKIE_SECURE,
        path: '/',
        expires: expiresAt,
    };
}
