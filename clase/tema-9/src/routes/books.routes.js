import { Router } from 'express';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/books.controller.js';
import { createReview } from '../controllers/reviews.controller.js';
import { auth, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', getBooks);
router.get('/:id', getBookById);

// Rutas protegidas (Requieren estar logueado)
router.post('/:id/reviews', auth, createReview);

// Rutas administrativas (Librarian o Admin)
router.post('/', auth, checkRole(['LIBRARIAN', 'ADMIN']), createBook);
router.put('/:id', auth, checkRole(['LIBRARIAN', 'ADMIN']), updateBook);

// Ruta super-admin (Solo Admin)
router.delete('/:id', auth, checkRole(['ADMIN']), deleteBook);

export default router;
