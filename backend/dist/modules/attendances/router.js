import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { attendanceCreateSchema, attendanceQuerySchema, attendanceUpdateSchema } from '../../schemas/attendances.js';
import { endOfDay, startOfDay } from '../../lib/dates.js';
function serializeAttendance(attendance) {
    return {
        id: attendance.id,
        patientId: attendance.patientId,
        appointmentId: attendance.appointmentId,
        fechaAtencion: attendance.fechaAtencion.toISOString(),
        observaciones: attendance.observaciones,
        createdAt: attendance.createdAt.toISOString(),
        updatedAt: attendance.updatedAt.toISOString(),
        patient: attendance.patient,
    };
}
export const attendancesRouter = Router();
attendancesRouter.get('/', async (req, res, next) => {
    try {
        const query = attendanceQuerySchema.parse(req.query);
        const where = {};
        if (query.patientId) {
            where.patientId = query.patientId;
        }
        if (query.today) {
            where.fechaAtencion = {
                gte: startOfDay(new Date()),
                lte: endOfDay(new Date()),
            };
        }
        else if (query.date) {
            where.fechaAtencion = {
                gte: startOfDay(new Date(query.date)),
                lte: endOfDay(new Date(query.date)),
            };
        }
        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                    },
                },
            },
            orderBy: {
                fechaAtencion: 'desc',
            },
        });
        res.json({
            items: attendances.map(serializeAttendance),
        });
    }
    catch (error) {
        next(error);
    }
});
attendancesRouter.get('/today', async (_req, res, next) => {
    try {
        const attendances = await prisma.attendance.findMany({
            where: {
                fechaAtencion: {
                    gte: startOfDay(new Date()),
                    lte: endOfDay(new Date()),
                },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                    },
                },
            },
            orderBy: {
                fechaAtencion: 'asc',
            },
        });
        res.json({
            items: attendances.map(serializeAttendance),
        });
    }
    catch (error) {
        next(error);
    }
});
attendancesRouter.post('/', async (req, res, next) => {
    try {
        const payload = attendanceCreateSchema.parse(req.body);
        const attendance = await prisma.attendance.create({
            data: {
                patientId: payload.patientId,
                appointmentId: payload.appointmentId ?? null,
                fechaAtencion: new Date(payload.fechaAtencion),
                observaciones: payload.observaciones ?? null,
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                    },
                },
            },
        });
        res.status(201).json({
            attendance: serializeAttendance(attendance),
        });
    }
    catch (error) {
        next(error);
    }
});
attendancesRouter.patch('/:id', async (req, res, next) => {
    try {
        const payload = attendanceUpdateSchema.parse(req.body);
        const attendance = await prisma.attendance.update({
            where: { id: req.params.id },
            data: {
                ...(payload.fechaAtencion ? { fechaAtencion: new Date(payload.fechaAtencion) } : {}),
                ...(payload.observaciones !== undefined ? { observaciones: payload.observaciones } : {}),
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                    },
                },
            },
        });
        res.json({
            attendance: serializeAttendance(attendance),
        });
    }
    catch (error) {
        next(error);
    }
});
attendancesRouter.delete('/:id', async (req, res, next) => {
    try {
        const attendance = await prisma.attendance.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                appointmentId: true,
            },
        });
        if (!attendance) {
            return res.status(404).json({
                message: 'Atencion no encontrada',
                code: 'ATTENDANCE_NOT_FOUND',
            });
        }
        await prisma.$transaction(async (tx) => {
            await tx.attendance.delete({
                where: { id: attendance.id },
            });
            if (attendance.appointmentId) {
                await tx.appointment.update({
                    where: { id: attendance.appointmentId },
                    data: {
                        estado: 'PENDIENTE',
                        cancelledAt: null,
                    },
                });
            }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
