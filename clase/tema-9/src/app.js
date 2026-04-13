import express from 'express';
import prisma from './config/prisma.js';
import { errorHandler } from './middleware/error.middleware.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import booksRoutes from './routes/books.routes.js';
import loansRoutes from './routes/loans.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';

const app = express();

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);       // Contiene: POST /register y POST /login
app.use('/api/auth', usersRoutes);      // Contiene: GET /me (puedes usar /api/users si prefieres)
app.use('/api/books', booksRoutes);     // Contiene: CRUD completo de libros y POST /:id/reviews
app.use('/api/loans', loansRoutes);     // Contiene: Préstamos
app.use('/api/reviews', reviewsRoutes); // Contiene: DELETE /:id

// Middleware de errores global (siempre debe ir al final de las rutas)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cierre elegante de la conexión a DB al apagar el servidor
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

export default app;
