// src/controllers/users.controller.js
// Ejemplos de operaciones CRUD con Prisma

import prisma from '../config/prisma.js';

// ==================== CREATE ====================

// Crear usuario simple
export const createUser = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    const user = await prisma.user.create({
      data: { email, name, role }
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

// Crear usuario con perfil (relación 1:1)
export const createUserWithProfile = async (req, res, next) => {
  try {
    const { email, name, bio, avatar } = req.body;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        profile: {
          create: { bio, avatar }
        }
      },
      include: { profile: true }
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

// ==================== READ ====================

// Obtener todos los usuarios
export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        _count: {
          select: { posts: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

// Obtener usuario por ID con posts
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        profile: true,
        posts: {
          where: { status: 'PUBLISHED' },
          include: {
            tags: true,
            _count: { select: { comments: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

// Buscar usuarios con filtros
export const searchUsers = async (req, res, next) => {
  try {
    const { name, role, page = 1, limit = 10 } = req.query;

    const where = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE ====================

// Actualizar usuario
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, role }
    });

    res.json({ data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
};

// Upsert: crear o actualizar
export const upsertUser = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role },
      create: { email, name, role }
    });

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE ====================

// Eliminar usuario
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
};

// ==================== TRANSACCIONES ====================

// Transacción: crear usuario con post
export const createUserWithPost = async (req, res, next) => {
  try {
    const { email, name, postTitle, postContent, tags } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear usuario
      const user = await tx.user.create({
        data: { email, name }
      });

      // 2. Crear o conectar tags
      const tagConnections = await Promise.all(
        tags.map(async (tagName) => {
          return tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });
        })
      );

      // 3. Crear post con tags
      const post = await tx.post.create({
        data: {
          title: postTitle,
          content: postContent,
          authorId: user.id,
          tags: {
            connect: tagConnections.map(t => ({ id: t.id }))
          }
        },
        include: { tags: true }
      });

      return { user, post };
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

// ==================== AGREGACIONES ====================

// Estadísticas de usuarios
export const getUserStats = async (req, res, next) => {
  try {
    const stats = await prisma.user.aggregate({
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    res.json({
      data: {
        total: stats._count.id,
        firstUser: stats._min.createdAt,
        lastUser: stats._max.createdAt,
        byRole
      }
    });
  } catch (error) {
    next(error);
  }
};
