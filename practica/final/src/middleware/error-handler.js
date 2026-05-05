import { notifySlackError } from '../services/logger.service.js';

export const errorHandler = async (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (statusCode >= 500) {
        await notifySlackError(req, err);
    }

    res.status(statusCode).json({
        error: true,
        message: err.message || 'Error interno del servidor',
        ...(err.details && { details: err.details })
    });
};
