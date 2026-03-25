import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tracksRoutes from './podcasts.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/podcasts', tracksRoutes);

export default router;
