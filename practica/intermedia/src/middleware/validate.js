import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
        req.body = parsed.body;
        next();
    } catch (err) {
        const errorMessages = err.errors.map(e => e.message);
        next(AppError.validation('Datos de entrada inválidos', errorMessages));
    }
};
