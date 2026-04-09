import prisma from '../config/prisma.js';

export const createReview = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
        }

        const hasRead = await prisma.loan.findFirst({
            where: { userId, bookId: Number(bookId), status: 'RETURNED' }
        });

        if (!hasRead) {
            return res.status(403).json({ message: 'Debes haber leído (y devuelto) el libro para reseñarlo' });
        }

        const review = await prisma.review.create({
            data: { rating, comment, userId, bookId: Number(bookId) }
        });

        res.status(201).json({ data: review });
    } catch (error) {
        next(error);
    }
};

// NUEVA FUNCIÓN PARA ELIMINAR
export const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await prisma.review.findUnique({
            where: { id: Number(id) }
        });

        if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });

        if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permisos para eliminar esta reseña' });
        }

        await prisma.review.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Reseña eliminada correctamente' });
    } catch (error) {
        next(error);
    }
};
