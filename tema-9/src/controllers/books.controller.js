import prisma from '../config/prisma.js';

export const getBooks = async (req, res, next) => {
    try {
        const { genre, author, available } = req.query;

        // Construimos los filtros dinámicamente
        const where = {};
        if (genre) where.genre = genre;
        if (author) where.author = { contains: author, mode: 'insensitive' };
        if (available === 'true') where.available = { gt: 0 };

        const books = await prisma.book.findMany({
            where,
            orderBy: { title: 'asc' }
        });

        res.json({ data: books });
    } catch (error) {
        next(error);
    }
};

export const getBookById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({
            where: { id: Number(id) },
            include: {
                reviews: {
                    include: { user: { select: { name: true } } } // Traemos el nombre del autor de la reseña
                }
            }
        });

        if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
        res.json({ data: book });
    } catch (error) {
        next(error);
    }
};

export const createBook = async (req, res, next) => {
    try {
        // Al crear un libro, los ejemplares disponibles (available) son iguales al total (copies)
        const book = await prisma.book.create({
            data: {
                ...req.body,
                available: req.body.copies
            }
        });
        res.status(201).json({ data: book });
    } catch (error) {
        next(error);
    }
};

export const updateBook = async (req, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json({ data: book });
    } catch (error) {
        next(error);
    }
};

export const deleteBook = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.book.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Libro eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
