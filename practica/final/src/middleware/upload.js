import multer from 'multer';
import AppError from '../utils/AppError.js';
import path from 'path';

const diskStorage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError('Solo se permiten imágenes', 400), false);
};

export const uploadLogo = multer({
    storage: diskStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
});

// memoryStorage para firma — buffer pasa a Sharp antes de subir a Cloudinary
export const uploadSignature = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter
});
