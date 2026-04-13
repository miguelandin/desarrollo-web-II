import { Router } from 'express';
import { getMe } from '../controllers/users.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de este archivo requerirán autenticación
router.use(auth);

// GET /api/users/me (o /api/auth/me dependiendo de cómo lo montes)
router.get('/me', getMe);

export default router;
