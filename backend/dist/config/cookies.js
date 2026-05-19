import { env } from './env.js';
export const SESSION_COOKIE_NAME = 'artcontrol_session';
function getSameSitePolicy() {
    return env.COOKIE_SECURE ? 'none' : 'lax';
}
export function getSessionCookieOptions(expiresAt) {
    return {
        httpOnly: true,
        sameSite: getSameSitePolicy(),
        secure: env.COOKIE_SECURE,
        path: '/',
        expires: expiresAt,
    };
}
export function getClearSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: getSameSitePolicy(),
        secure: env.COOKIE_SECURE,
        path: '/',
    };
}
