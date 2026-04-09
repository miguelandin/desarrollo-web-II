import { Router } from 'express';
import { deleteReview } from '../controllers/reviews.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = Router();

// Protegemos todas las rutas con el token
router.use(auth);

// Eliminar mi reseña
router.delete('/:id', deleteReview);

export default router;
