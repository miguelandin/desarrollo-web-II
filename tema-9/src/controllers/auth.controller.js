import prisma from ../config/prisma.js;
import bcrypt from bcrypt;
import { generateToken } from ../utils/jwt.js;

export const register = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword }
    });

    res.status(201).json({ message: Usuario creado, user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: Credenciales inválidas });
    }

    const token = generateToken({ id: user.id, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
};
