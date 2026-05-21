import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env.js';
import { errorHandler, notFoundHandler } from '../middlewares/error-handler.js';
import { authRouter } from '../modules/auth/router.js';
import { patientsRouter } from '../modules/patients/router.js';
import { appointmentsRouter } from '../modules/appointments/router.js';
import { attendancesRouter } from '../modules/attendances/router.js';
import { vademecumRouter } from '../modules/vademecum/router.js';
import { requireAuth } from '../middlewares/auth.js';
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     message: 'Demasiados intentos de login',
//     code: 'RATE_LIMITED',
//   },
// });
export function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    app.use(cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    }));
    app.use(express.json());
    app.use(cookieParser());
    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });
    app.use('/auth', authRouter);
    app.use('/patients', requireAuth, patientsRouter);
    app.use('/appointments', requireAuth, appointmentsRouter);
    app.use('/attendances', requireAuth, attendancesRouter);
    app.use('/vademecum', requireAuth, vademecumRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
