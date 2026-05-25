import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireRole } from '../../middlewares/auth.js';
import {
  pharmacyCoverageCreateSchema,
  pharmacyCoverageQuerySchema,
  pharmacyCoverageUpdateSchema,
  pharmacyOptionsQuerySchema,
} from '../../schemas/pharmacies.js';

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function serializeCoverage(coverage: {
  id: string;
  artId: string;
  pharmacyBranchId: string;
  art: { id: string; nombre: string };
  pharmacyBranch: {
    id: string;
    direccion: string;
    pharmacy: { id: string; nombre: string };
  };
}) {
  return {
    id: coverage.id,
    artId: coverage.artId,
    artNombre: coverage.art.nombre,
    pharmacyId: coverage.pharmacyBranch.pharmacy.id,
    pharmacyNombre: coverage.pharmacyBranch.pharmacy.nombre,
    pharmacyBranchId: coverage.pharmacyBranchId,
    direccion: coverage.pharmacyBranch.direccion,
  };
}

async function findOrCreateArt(tx: Prisma.TransactionClient, nombre: string) {
  const normalizedNombre = normalizeText(nombre);
  const existing = await tx.art.findFirst({
    where: { nombre: { equals: normalizedNombre, mode: Prisma.QueryMode.insensitive } },
  });

  if (existing) {
    return existing;
  }

  return tx.art.create({
    data: { nombre: normalizedNombre },
  });
}

async function findOrCreatePharmacy(tx: Prisma.TransactionClient, nombre: string) {
  const normalizedNombre = normalizeText(nombre);
  const existing = await tx.pharmacy.findFirst({
    where: { nombre: { equals: normalizedNombre, mode: Prisma.QueryMode.insensitive } },
  });

  if (existing) {
    return existing;
  }

  return tx.pharmacy.create({
    data: { nombre: normalizedNombre },
  });
}

async function findOrCreateBranch(tx: Prisma.TransactionClient, pharmacyId: string, direccion: string) {
  const normalizedDireccion = normalizeText(direccion);
  const existing = await tx.pharmacyBranch.findFirst({
    where: {
      pharmacyId,
      direccion: { equals: normalizedDireccion, mode: Prisma.QueryMode.insensitive },
    },
  });

  if (existing) {
    return existing;
  }

  return tx.pharmacyBranch.create({
    data: {
      pharmacyId,
      direccion: normalizedDireccion,
    },
  });
}

async function resolveCoverageRefs(
  tx: Prisma.TransactionClient,
  payload: { artNombre: string; pharmacyNombre: string; direccion: string },
) {
  const art = await findOrCreateArt(tx, payload.artNombre);
  const pharmacy = await findOrCreatePharmacy(tx, payload.pharmacyNombre);
  const branch = await findOrCreateBranch(tx, pharmacy.id, payload.direccion);

  return {
    art,
    pharmacy,
    branch,
  };
}

export const pharmaciesRouter = Router();

pharmaciesRouter.get('/coverages', async (req, res, next) => {
  try {
    const query = pharmacyCoverageQuerySchema.parse(req.query);
    const where: Prisma.ArtPharmacyCoverageWhereInput = {
      AND: [
        query.artId ? { artId: query.artId } : {},
        query.q
          ? {
              OR: [
                { art: { nombre: { contains: query.q, mode: Prisma.QueryMode.insensitive } } },
                { pharmacyBranch: { pharmacy: { nombre: { contains: query.q, mode: Prisma.QueryMode.insensitive } } } },
                { pharmacyBranch: { direccion: { contains: query.q, mode: Prisma.QueryMode.insensitive } } },
              ],
            }
          : {},
      ],
    };

    const [total, items] = await Promise.all([
      prisma.artPharmacyCoverage.count({ where }),
      prisma.artPharmacyCoverage.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          art: true,
          pharmacyBranch: {
            include: {
              pharmacy: true,
            },
          },
        },
        orderBy: [
          { art: { nombre: 'asc' } },
          { pharmacyBranch: { pharmacy: { nombre: 'asc' } } },
          { pharmacyBranch: { direccion: 'asc' } },
        ],
      }),
    ]);

    res.json({
      items: items.map(serializeCoverage),
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    next(error);
  }
});

pharmaciesRouter.get('/options', async (req, res, next) => {
  try {
    const query = pharmacyOptionsQuerySchema.parse(req.query);
    const artWhere = query.q
      ? { nombre: { contains: query.q, mode: Prisma.QueryMode.insensitive } }
      : {};
    const pharmacyWhere = query.q
      ? { nombre: { contains: query.q, mode: Prisma.QueryMode.insensitive } }
      : {};
    const branchWhere = query.q
      ? {
          OR: [
            { direccion: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
            { pharmacy: { nombre: { contains: query.q, mode: Prisma.QueryMode.insensitive } } },
          ],
        }
      : {};

    const [arts, pharmacies, branches] = await Promise.all([
      prisma.art.findMany({
        where: artWhere,
        orderBy: { nombre: 'asc' },
        take: query.limit,
      }),
      prisma.pharmacy.findMany({
        where: pharmacyWhere,
        orderBy: { nombre: 'asc' },
        take: query.limit,
      }),
      prisma.pharmacyBranch.findMany({
        where: branchWhere,
        include: { pharmacy: true },
        orderBy: [{ pharmacy: { nombre: 'asc' } }, { direccion: 'asc' }],
        take: query.limit,
      }),
    ]);

    res.json({
      arts: arts.map((art) => ({ id: art.id, nombre: art.nombre })),
      pharmacies: pharmacies.map((pharmacy) => ({ id: pharmacy.id, nombre: pharmacy.nombre })),
      branches: branches.map((branch) => ({
        id: branch.id,
        pharmacyId: branch.pharmacyId,
        pharmacyNombre: branch.pharmacy.nombre,
        direccion: branch.direccion,
      })),
    });
  } catch (error) {
    next(error);
  }
});

pharmaciesRouter.post('/coverages', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const payload = pharmacyCoverageCreateSchema.parse(req.body);
    const coverage = await prisma.$transaction(async (tx) => {
      const { art, branch } = await resolveCoverageRefs(tx, payload);

      return tx.artPharmacyCoverage.create({
        data: {
          artId: art.id,
          pharmacyBranchId: branch.id,
        },
        include: {
          art: true,
          pharmacyBranch: {
            include: {
              pharmacy: true,
            },
          },
        },
      });
    });

    res.status(201).json({
      coverage: serializeCoverage(coverage),
    });
  } catch (error) {
    next(error);
  }
});

pharmaciesRouter.patch('/coverages/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const payload = pharmacyCoverageUpdateSchema.parse(req.body);
    const coverageId = String(req.params.id);

    const existing = await prisma.artPharmacyCoverage.findUnique({
      where: { id: coverageId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Cobertura no encontrada',
        code: 'PHARMACY_COVERAGE_NOT_FOUND',
      });
    }

    const coverage = await prisma.$transaction(async (tx) => {
      const { art, branch } = await resolveCoverageRefs(tx, payload);

      return tx.artPharmacyCoverage.update({
        where: { id: coverageId },
        data: {
          artId: art.id,
          pharmacyBranchId: branch.id,
        },
        include: {
          art: true,
          pharmacyBranch: {
            include: {
              pharmacy: true,
            },
          },
        },
      });
    });

    res.json({
      coverage: serializeCoverage(coverage),
    });
  } catch (error) {
    next(error);
  }
});

pharmaciesRouter.delete('/coverages/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const coverageId = String(req.params.id);

    const existing = await prisma.artPharmacyCoverage.findUnique({
      where: { id: coverageId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Cobertura no encontrada',
        code: 'PHARMACY_COVERAGE_NOT_FOUND',
      });
    }

    await prisma.artPharmacyCoverage.delete({
      where: { id: coverageId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
