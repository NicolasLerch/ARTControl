import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { vademecumCreateSchema, vademecumQuerySchema, vademecumUpdateSchema } from '../../schemas/vademecum.js';

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function serializeVademecumItem(item: {
  id: string;
  type: 'MEDICAMENTO' | 'INSUMO' | 'KIT' | 'OTRO';
  drug: string | null;
  commercialName: string;
  dose: string | null;
  lab: string | null;
  presentation: string | null;
  description: string | null;
  components: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    type: item.type,
    drug: item.drug,
    commercialName: item.commercialName,
    dose: item.dose,
    lab: item.lab,
    presentation: item.presentation,
    description: item.description,
    components: item.components,
    notes: item.notes,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    droga: item.drug ?? '',
    nombreComercial: item.commercialName,
    dosis: item.dose ?? '',
    laboratorio: item.lab ?? '',
    presentacion: item.presentation ?? '',
    indicaciones: item.description ?? '',
  };
}

export const vademecumRouter = Router();

vademecumRouter.get('/', async (req, res, next) => {
  try {
    const query = vademecumQuerySchema.parse(req.query);
    const where: Prisma.VademecumItemWhereInput = {
      AND: [
        query.type ? { type: query.type } : {},
        query.isActive !== undefined ? { isActive: query.isActive } : { isActive: true },
        query.q
          ? {
              OR: [
                { commercialName: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { drug: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { lab: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { presentation: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { components: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : {},
      ],
    };

    const [total, items] = await Promise.all([
      prisma.vademecumItem.count({ where }),
      prisma.vademecumItem.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ drug: 'asc' }, { commercialName: 'asc' }],
      }),
    ]);

    res.json({
      items: items.map(serializeVademecumItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  } catch (error) {
    next(error);
  }
});

vademecumRouter.post('/', async (req, res, next) => {
  try {
    const payload = vademecumCreateSchema.parse(req.body);
    const item = await prisma.vademecumItem.create({
      data: {
        type: payload.type,
        drug: normalizeNullableText(payload.drug),
        commercialName: payload.commercialName.trim(),
        dose: normalizeNullableText(payload.dose),
        lab: normalizeNullableText(payload.lab),
        presentation: normalizeNullableText(payload.presentation),
        description: normalizeNullableText(payload.description),
        components: normalizeNullableText(payload.components),
        notes: normalizeNullableText(payload.notes),
        isActive: payload.isActive,
      },
    });

    res.status(201).json({
      item: serializeVademecumItem(item),
    });
  } catch (error) {
    next(error);
  }
});

vademecumRouter.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.vademecumItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      return res.status(404).json({
        message: 'Item de vademecum no encontrado',
        code: 'VADEMECUM_NOT_FOUND',
      });
    }

    res.json({
      item: serializeVademecumItem(item),
    });
  } catch (error) {
    next(error);
  }
});

vademecumRouter.patch('/:id', async (req, res, next) => {
  try {
    const payload = vademecumUpdateSchema.parse(req.body);

    const existingItem = await prisma.vademecumItem.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existingItem) {
      return res.status(404).json({
        message: 'Item de vademecum no encontrado',
        code: 'VADEMECUM_NOT_FOUND',
      });
    }

    const item = await prisma.vademecumItem.update({
      where: { id: req.params.id },
      data: {
        ...(payload.type ? { type: payload.type } : {}),
        ...(payload.drug !== undefined ? { drug: normalizeNullableText(payload.drug) } : {}),
        ...(payload.commercialName ? { commercialName: payload.commercialName.trim() } : {}),
        ...(payload.dose !== undefined ? { dose: normalizeNullableText(payload.dose) } : {}),
        ...(payload.lab !== undefined ? { lab: normalizeNullableText(payload.lab) } : {}),
        ...(payload.presentation !== undefined ? { presentation: normalizeNullableText(payload.presentation) } : {}),
        ...(payload.description !== undefined ? { description: normalizeNullableText(payload.description) } : {}),
        ...(payload.components !== undefined ? { components: normalizeNullableText(payload.components) } : {}),
        ...(payload.notes !== undefined ? { notes: normalizeNullableText(payload.notes) } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });

    res.json({
      item: serializeVademecumItem(item),
    });
  } catch (error) {
    next(error);
  }
});

vademecumRouter.delete('/:id', async (req, res, next) => {
  try {
    const existingItem = await prisma.vademecumItem.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existingItem) {
      return res.status(404).json({
        message: 'Item de vademecum no encontrado',
        code: 'VADEMECUM_NOT_FOUND',
      });
    }

    await prisma.vademecumItem.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
