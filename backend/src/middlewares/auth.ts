import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../config/cookies.js';
import { hashToken } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';

type AuthUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  totpEnabled: boolean;
};

export type AuthedRequest = Request & {
  authUser?: AuthUser;
  authSessionId?: string;
};

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

  if (!rawToken) {
    return res.status(401).json({
      message: 'No autenticado',
      code: 'UNAUTHORIZED',
    });
  }

  const tokenHash = hashToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({
      message: 'Sesión inválida',
      code: 'UNAUTHORIZED',
    });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  req.authSessionId = session.id;
  req.authUser = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    totpEnabled: session.user.totpEnabled,
  };

  next();
}

export function requireRole(role: 'ADMIN' | 'USER') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({
        message: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
    }

    if (req.authUser.role !== role) {
      return res.status(403).json({
        message: 'No autorizado',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
