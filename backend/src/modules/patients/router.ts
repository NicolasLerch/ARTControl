import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { patientCreateSchema, patientQuerySchema, patientUpdateSchema } from '../../schemas/patients.js';
import { toTimelineDateTime } from '../../lib/dates.js';

function serializePatient(patient: {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...patient,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}

export const patientsRouter = Router();

patientsRouter.get('/', async (req, res, next) => {
  try {
    const query = patientQuerySchema.parse(req.query);
    const where = {
      AND: [
        query.dni ? { dni: { contains: query.dni } } : {},
        query.apellido ? { apellido: { contains: query.apellido } } : {},
        query.q
          ? {
              OR: [
                { nombre: { contains: query.q } },
                { apellido: { contains: query.q } },
                { dni: { contains: query.q } },
              ],
            }
          : {},
      ],
    };

    const [total, items] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      }),
    ]);

    res.json({
      items: items.map(serializePatient),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

patientsRouter.post('/', async (req, res, next) => {
  try {
    const payload = patientCreateSchema.parse(req.body);
    const patient = await prisma.patient.create({
      data: {
        ...payload,
        dni: payload.dni.trim(),
      },
    });

    res.status(201).json({
      patient: serializePatient(patient),
    });
  } catch (error) {
    next(error);
  }
});

patientsRouter.get('/:id', async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: true,
        attendances: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    const timeline = [
      ...patient.appointments.map((appointment: typeof patient.appointments[number]) => ({
        id: appointment.id,
        type: 'appointment' as const,
        dateTime: toTimelineDateTime(appointment.fecha, appointment.hora),
        title: appointment.estado,
        observaciones: appointment.observaciones,
        estado: appointment.estado,
        fecha: appointment.fecha.toISOString(),
        hora: appointment.hora,
      })),
      ...patient.attendances.map((attendance: typeof patient.attendances[number]) => ({
        id: attendance.id,
        type: 'attendance' as const,
        dateTime: attendance.fechaAtencion.toISOString(),
        title: 'ATENCION',
        observaciones: attendance.observaciones,
        fechaAtencion: attendance.fechaAtencion.toISOString(),
        appointmentId: attendance.appointmentId,
      })),
    ].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    res.json({
      patient: serializePatient(patient),
      timeline,
    });
  } catch (error) {
    next(error);
  }
});

patientsRouter.patch('/:id', async (req, res, next) => {
  try {
    const payload = patientUpdateSchema.parse(req.body);
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: payload,
    });

    res.json({
      patient: serializePatient(patient),
    });
  } catch (error) {
    next(error);
  }
});

patientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const related = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: { select: { id: true } },
        attendances: { select: { id: true } },
      },
    });

    if (!related) {
      return res.status(404).json({
        message: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
    }

    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: { patientId: req.params.id },
      }),
      prisma.appointment.deleteMany({
        where: { patientId: req.params.id },
      }),
      prisma.patient.delete({
        where: { id: req.params.id },
      }),
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
