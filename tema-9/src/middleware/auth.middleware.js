import { verifyToken } from ../utils/jwt.js;
import prisma from ../config/prisma.js;

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split( )[1];
    if (!token) return res.status(401).json({ message: Token no proporcionado });

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) return res.status(401).json({ message: Usuario no encontrado });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: Token inválido o expirado });
  }
};

// Middleware para verificar roles (Admin o Bibliotecario)
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: No tienes permisos para esta acción });
    }
    next();
  };
};
