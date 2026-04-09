import prisma from '../config/prisma.js';

export const getMe = async (req, res, next) => {
    try {
        // req.user.id viene del middleware de autenticación (auth.middleware.js)
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            // Usamos 'select' para no devolver NUNCA la contraseña al cliente
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                // Traemos los préstamos activos del usuario con la info del libro
                loans: {
                    where: { status: 'ACTIVE' },
                    include: {
                        book: {
                            select: { title: true, author: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ data: user });
    } catch (error) {
        next(error);
    }
};
