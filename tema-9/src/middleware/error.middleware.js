import { Prisma } from @prisma/client;

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === P2002) {
      return res.status(409).json({ message: `El registro ya existe (Duplicado)` });
    }
    if (err.code === P2025) {
      return res.status(404).json({ message: Registro no encontrado });
    }
  }

  res.status(err.status || 500).json({
    message: err.message || Error interno del servidor
  });
};
