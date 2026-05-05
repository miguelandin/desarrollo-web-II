import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliverynoteRoutes from './routes/deliverynote.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Seguridad T6
app.use(helmet());

app.use((req, res, next) => { // para que funcione las querys (HOT FIX)
    Object.defineProperty(req, 'query', {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true
    });
    next();
});

app.use(mongoSanitize());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use(limiter);

// Parsers
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir logos

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date()
    });
});

// Rutas
app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliverynoteRoutes);

// Middleware Centralizado de Errores
app.use(errorHandler);

export default app;
