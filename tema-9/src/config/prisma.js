// src/config/prisma.js
// Singleton del cliente Prisma

import { PrismaClient } from '@prisma/client';

// Crear una única instancia
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error']
});

// Middleware para logging de queries (opcional)
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

export default prisma;
