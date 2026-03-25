import { handleHttpError } from '../utils/handleError.js';

const checkRol = (requiredRole) => (req, res, next) => {
    try {
        const { user } = req

        if (user.role !== requiredRole) {
            return handleHttpError(res, 'NOT_ALLOWED', 403)
        }

        next();
    } catch (err) {
        handleHttpError(res, 'ERROR_PERMISSIONS', 403);
    }
};

export default checkRol;
