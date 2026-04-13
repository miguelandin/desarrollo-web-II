import { PrismaClient } from '@prisma/client';

// Creamos una función para instanciar el cliente
const prismaClientSingleton = () => {
    return new PrismaClient({
        // Esto mostrará las consultas SQL en la terminal si estás en desarrollo
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
};

// Usamos globalThis para evitar múltiples conexiones en modo desarrollo con nodemon/watch
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
