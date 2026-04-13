import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Seguridad T6
app.use(helmet());
app.use(mongoSanitize());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use(limiter);

// Parsers
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir logos

// Rutas
app.use('/api/user', userRoutes);

// Middleware Centralizado de Errores
app.use(errorHandler);

export default app;
