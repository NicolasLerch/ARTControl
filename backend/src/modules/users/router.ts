import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { userCreateSchema, userParamsSchema, userQuerySchema, userUpdateSchema } from '../../schemas/users.js';

function serializeUser(user: {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: 'ADMIN' | 'USER';
  totpEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function buildConflictError(field: string, message: string) {
  return {
    status: 409,
    body: {
      message,
      code: 'CONFLICT',
      fieldErrors: {
        [field]: [message],
      },
    },
  };
}

export const usersRouter = Router();

usersRouter.use(requireRole('ADMIN'));

usersRouter.get('/', async (req, res, next) => {
  try {
    const query = userQuerySchema.parse(req.query);
    const where = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.q
        ? {
            OR: [
              { nombre: { contains: query.q, mode: 'insensitive' as const } },
              { apellido: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
        { email: 'asc' },
      ],
    });

    res.json({
      items: users.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    const payload = userCreateSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      const conflict = buildConflictError('email', 'Ya existe un usuario con ese email');
      return res.status(conflict.status).json(conflict.body);
    }

    const user = await prisma.user.create({
      data: {
        nombre: payload.nombre,
        apellido: payload.apellido,
        email: normalizedEmail,
        passwordHash: await hashPassword(payload.password),
        role: payload.role,
      },
    });

    res.status(201).json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const { id } = userParamsSchema.parse(req.params);
    const payload = userUpdateSchema.parse(req.body);

    if (req.authUser?.id === id && payload.isActive === false) {
      return res.status(400).json({
        message: 'No puedes desactivarte a ti mismo',
        code: 'SELF_DEACTIVATION_FORBIDDEN',
        fieldErrors: {
          isActive: ['No puedes desactivarte a ti mismo'],
        },
      });
    }

    if (payload.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: payload.email.toLowerCase(),
          NOT: { id },
        },
        select: { id: true },
      });

      if (existingUser) {
        const conflict = buildConflictError('email', 'Ya existe un usuario con ese email');
        return res.status(conflict.status).json(conflict.body);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(payload.nombre ? { nombre: payload.nombre } : {}),
        ...(payload.apellido ? { apellido: payload.apellido } : {}),
        ...(payload.email ? { email: payload.email.toLowerCase() } : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });

    res.json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const { id } = userParamsSchema.parse(req.params);

    if (req.authUser?.id === id) {
      return res.status(400).json({
        message: 'No puedes eliminarte a ti mismo',
        code: 'SELF_DELETION_FORBIDDEN',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});
