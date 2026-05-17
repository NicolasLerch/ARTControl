import { ZodError } from 'zod';
export function notFoundHandler(_req, res) {
    res.status(404).json({
        message: 'Ruta no encontrada',
        code: 'NOT_FOUND',
    });
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            message: 'Datos inválidos',
            code: 'VALIDATION_ERROR',
            fieldErrors: error.flatten().fieldErrors,
        });
    }
    if (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002') {
        return res.status(409).json({
            message: 'Registro duplicado',
            code: 'CONFLICT',
        });
    }
    if (error instanceof Error) {
        return res.status(500).json({
            message: error.message,
            code: 'INTERNAL_ERROR',
        });
    }
    return res.status(500).json({
        message: 'Error interno',
        code: 'INTERNAL_ERROR',
    });
}
