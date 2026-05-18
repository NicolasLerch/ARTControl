import crypto from 'node:crypto';
import { env } from '../config/env.js';
export function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}
export function hashToken(token) {
    return crypto
        .createHmac('sha256', env.SESSION_SECRET)
        .update(token)
        .digest('hex');
}
export function generateChallengeId() {
    return crypto.randomUUID();
}
export function signPayload(payload) {
    return crypto
        .createHmac('sha256', env.SESSION_SECRET)
        .update(payload)
        .digest('hex');
}
export function createChallengeToken(userId, expiresAt) {
    const payload = JSON.stringify({ userId, expiresAt });
    const signature = signPayload(payload);
    return Buffer.from(`${payload}.${signature}`).toString('base64url');
}
export function verifyChallengeToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const separatorIndex = decoded.lastIndexOf('.');
        if (separatorIndex === -1) {
            return null;
        }
        const payload = decoded.slice(0, separatorIndex);
        const signature = decoded.slice(separatorIndex + 1);
        if (signPayload(payload) !== signature) {
            return null;
        }
        return JSON.parse(payload);
    }
    catch {
        return null;
    }
}
