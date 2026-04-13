import { Router } from 'express';
import { createLoan, returnLoan } from '../controllers/loans.controller.js';
import { auth, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de préstamos requieren autenticación
router.use(auth);

router.post('/', createLoan);
router.put('/:id/return', returnLoan);
// router.get('/', getMyLoans); ...

// Solo bibliotecarios o admins pueden ver todos
// router.get('/all', checkRole(['LIBRARIAN', 'ADMIN']), getAllLoans);

export default router;
