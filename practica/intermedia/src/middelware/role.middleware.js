import AppError from '../utils/AppError.js';

export const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return next(new AppError('Acceso denegado: permisos insuficientes', 403));
    }
    next();
};
