import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '../../config/cookies.js';
import { buildTotpEnrollment, createTotpSecret, verifyTotpToken } from '../../lib/totp.js';
import { prisma } from '../../lib/prisma.js';
import { hashToken, createChallengeToken, verifyChallengeToken, generateSessionToken } from '../../lib/crypto.js';
import { loginSchema, verifyTwoFactorSchema, confirmTwoFactorSchema } from '../../schemas/auth.js';
import { verifyPassword } from '../../lib/password.js';
import { requireAuth } from '../../middlewares/auth.js';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
function serializeAuthUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        totpEnabled: user.totpEnabled,
    };
}
async function createPersistentSession(req, userId) {
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            ip: req.ip,
            userAgent: req.get('user-agent') ?? null,
        },
    });
    return {
        token,
        expiresAt,
    };
}
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Demasiados intentos de login',
        code: 'RATE_LIMITED',
    },
});
const verifyTwoFactorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Demasiados intentos de verificación 2FA',
        code: 'RATE_LIMITED',
    },
});
export const authRouter = Router();
authRouter.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const payload = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email: payload.email.toLowerCase() },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS',
            });
        }
        const passwordOk = await verifyPassword(user.passwordHash, payload.password);
        if (!passwordOk) {
            return res.status(401).json({
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS',
            });
        }
        if (user.totpEnabled && user.totpSecret) {
            const expiresAt = Date.now() + 1000 * 60 * 10;
            const challengeId = createChallengeToken(user.id, expiresAt);
            return res.json({
                requires2fa: true,
                challengeId,
            });
        }
        const session = await createPersistentSession(req, user.id);
        res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions(session.expiresAt));
        return res.json({
            user: serializeAuthUser(user),
        });
    }
    catch (error) {
        next(error);
    }
});
authRouter.post('/verify-2fa', verifyTwoFactorLimiter, async (req, res, next) => {
    try {
        const payload = verifyTwoFactorSchema.parse(req.body);
        const challenge = verifyChallengeToken(payload.challengeId);
        if (!challenge || challenge.expiresAt < Date.now()) {
            return res.status(401).json({
                message: 'Desafío expirado',
                code: 'INVALID_CHALLENGE',
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: challenge.userId },
        });
        if (!user || !user.totpEnabled || !user.totpSecret) {
            return res.status(401).json({
                message: '2FA no disponible',
                code: 'INVALID_CHALLENGE',
            });
        }
        const tokenOk = verifyTotpToken(user.totpSecret, payload.token);
        if (!tokenOk) {
            return res.status(401).json({
                message: 'Código inválido',
                code: 'INVALID_2FA_TOKEN',
            });
        }
        const session = await createPersistentSession(req, user.id);
        res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions(session.expiresAt));
        return res.json({
            user: serializeAuthUser(user),
        });
    }
    catch (error) {
        next(error);
    }
});
authRouter.post('/logout', requireAuth, async (req, res, next) => {
    try {
        if (req.authSessionId) {
            await prisma.session.deleteMany({
                where: { id: req.authSessionId },
            });
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
authRouter.get('/me', requireAuth, async (req, res) => {
    res.json({
        user: req.authUser,
    });
});
authRouter.post('/setup-2fa', requireAuth, async (req, res, next) => {
    try {
        const secret = createTotpSecret();
        await prisma.user.update({
            where: { id: req.authUser.id },
            data: {
                totpSecret: secret,
                totpEnabled: false,
            },
        });
        const enrollment = await buildTotpEnrollment(req.authUser.email, secret);
        res.json(enrollment);
    }
    catch (error) {
        next(error);
    }
});
authRouter.post('/confirm-2fa', requireAuth, async (req, res, next) => {
    try {
        const payload = confirmTwoFactorSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: req.authUser.id },
        });
        if (!user?.totpSecret) {
            return res.status(400).json({
                message: 'Debe generar el secreto primero',
                code: 'TOTP_NOT_INITIALIZED',
            });
        }
        const tokenOk = verifyTotpToken(user.totpSecret, payload.token);
        if (!tokenOk) {
            return res.status(401).json({
                message: 'Código inválido',
                code: 'INVALID_2FA_TOKEN',
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { totpEnabled: true },
        });
        res.json({
            user: serializeAuthUser({
                ...user,
                totpEnabled: true,
            }),
        });
    }
    catch (error) {
        next(error);
    }
});
