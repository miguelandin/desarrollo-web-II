import prisma from ../config/prisma.js;

export const createLoan = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    // Regla 1: Máximo 3 préstamos activos
    const activeLoans = await prisma.loan.count({
      where: { userId, status: ACTIVE }
    });
    if (activeLoans >= 3) return res.status(400).json({ message: Límite de 3 préstamos alcanzado });

    // Regla 2: No pedir prestado el mismo libro dos veces a la vez
    const existingLoan = await prisma.loan.findFirst({
      where: { userId, bookId, status: ACTIVE }
    });
    if (existingLoan) return res.status(400).json({ message: Ya tienes este libro prestado });

    // Regla 3: Verificar disponibilidad
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.available <= 0) {
      return res.status(400).json({ message: Libro no disponible });
    }

    // Calcular fecha de devolución (14 días)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // TRANSACCIÓN PRISMA: Crear préstamo y restar inventario al mismo tiempo
    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: { userId, bookId, dueDate, status: ACTIVE }
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } }
      })
    ]);

    res.status(201).json({ data: loan });
  } catch (error) {
    next(error);
  }
};

export const returnLoan = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del préstamo

    const loan = await prisma.loan.findUnique({ where: { id: Number(id) } });
    if (!loan || loan.status !== ACTIVE) {
      return res.status(400).json({ message: Préstamo no válido o ya devuelto });
    }

    // TRANSACCIÓN PRISMA: Marcar devuelto y sumar inventario
    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: Number(id) },
        data: { status: RETURNED, returnDate: new Date() }
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } }
      })
    ]);

    res.json({ data: updatedLoan });
  } catch (error) {
    next(error);
  }
};
