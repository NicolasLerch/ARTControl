import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { appointmentCreateSchema, appointmentQuerySchema, appointmentStatusSchema, appointmentUpdateSchema } from '../../schemas/appointments.js';
import { endOfDay, startOfDay } from '../../lib/dates.js';

function serializeAppointment(
  appointment: {
    id: string;
    patientId: string;
    fecha: Date;
    hora: string;
    estado: 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO';
    observaciones: string | null;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    patient?: {
      id: string;
      nombre: string;
      apellido: string;
      dni: string;
      createdAt: Date;
      updatedAt: Date;
    };
  },
) {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    fecha: appointment.fecha.toISOString(),
    hora: appointment.hora,
    estado: appointment.estado,
    observaciones: appointment.observaciones,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
    patient: appointment.patient
      ? {
          id: appointment.patient.id,
          nombre: appointment.patient.nombre,
          apellido: appointment.patient.apellido,
          dni: appointment.patient.dni,
          createdAt: appointment.patient.createdAt.toISOString(),
          updatedAt: appointment.patient.updatedAt.toISOString(),
        }
      : undefined,
  };
}

export const appointmentsRouter = Router();

appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const query = appointmentQuerySchema.parse(req.query);
    const where: Record<string, unknown> = {};

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.status) {
      where.estado = query.status;
    }

    if (query.date) {
      where.fecha = {
        gte: startOfDay(new Date(query.date)),
        lte: endOfDay(new Date(query.date)),
      };
    } else if (query.from || query.to) {
      where.fecha = {
        ...(query.from ? { gte: startOfDay(new Date(query.from)) } : {}),
        ...(query.to ? { lte: endOfDay(new Date(query.to)) } : {}),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });

    res.json({
      items: appointments.map(serializeAppointment),
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const payload = appointmentCreateSchema.parse(req.body);
    const appointment = await prisma.appointment.create({
      data: {
        patientId: payload.patientId,
        fecha: new Date(payload.fecha),
        hora: payload.hora,
        observaciones: payload.observaciones ?? null,
      },
      include: {
        patient: true,
      },
    });

    res.status(201).json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: 'Turno no encontrado',
        code: 'APPOINTMENT_NOT_FOUND',
      });
    }

    res.json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const payload = appointmentUpdateSchema.parse(req.body);
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...(payload.patientId ? { patientId: payload.patientId } : {}),
        ...(payload.fecha ? { fecha: new Date(payload.fecha) } : {}),
        ...(payload.hora ? { hora: payload.hora } : {}),
        ...(payload.observaciones !== undefined ? { observaciones: payload.observaciones } : {}),
      },
      include: {
        patient: true,
      },
    });

    res.json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const payload = appointmentStatusSchema.parse(req.body);
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        estado: payload.estado,
        cancelledAt: payload.estado === 'CANCELADO' ? new Date() : null,
      },
      include: {
        patient: true,
      },
    });

    if (payload.estado === 'ASISTIO') {
      const existingAttendance = await prisma.attendance.findFirst({
        where: { appointmentId: appointment.id },
      });

      if (!existingAttendance) {
        await prisma.attendance.create({
          data: {
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            fechaAtencion: appointment.fecha,
            observaciones: appointment.observaciones,
          },
        });
      }
    }

    res.json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        estado: 'CANCELADO',
        cancelledAt: new Date(),
      },
    });

    res.json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    next(error);
  }
});
