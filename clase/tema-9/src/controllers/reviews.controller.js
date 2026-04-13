export const createReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
        }

        const hasRead = await prisma.loan.findFirst({
            where: { userId, bookId: Number(id), status: 'RETURNED' }
        });

        if (!hasRead) {
            return res.status(403).json({ message: 'Debes haber leído (y devuelto) el libro para reseñarlo' });
        }

        const review = await prisma.review.create({
            data: { rating, comment, userId, bookId: Number(id) } 
        });

        res.status(201).json({ data: review });
    } catch (error) {
        next(error);
    }
};
