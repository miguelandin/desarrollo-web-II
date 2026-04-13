export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: true,
        message: err.message || 'Error interno del servidor'
    });
};
