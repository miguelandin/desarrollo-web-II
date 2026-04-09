import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando la siembra de datos...');

    // 1. Crear contraseña encriptada común para los usuarios de prueba
    const passwordHash = await bcrypt.hash('123456', 10);

    // 2. Crear Usuarios (Usamos 'upsert' para que no dé error si ya existen al ejecutarlo 2 veces)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@biblioteca.com' },
        update: {}, // Si existe, no hacemos nada
        create: {
            email: 'admin@biblioteca.com',
            name: 'Admin Principal',
            password: passwordHash,
            role: 'ADMIN',
        },
    });

    const lector = await prisma.user.upsert({
        where: { email: 'juan@ejemplo.com' },
        update: {},
        create: {
            email: 'juan@ejemplo.com',
            name: 'Juan Lector',
            password: passwordHash,
            role: 'USER',
        },
    });

    console.log('👤 Usuarios creados');

    // 3. Crear Libros
    // Nota: Si en tu schema dejaste el ISBN como Int, asegúrate de que no superen los 10 dígitos. 
    // Si lo cambiaste a String como te sugerí, puedes poner guiones tranquilamente.
    const book1 = await prisma.book.upsert({
        where: { isbn: "1234567890" },
        update: {},
        create: {
            isbn: "1234567890",
            title: 'El Imperio Final (Mistborn)',
            author: 'Brandon Sanderson',
            genre: 'Aventura',
            description: 'En un mundo donde llueve ceniza, una joven ladrona descubre sus poderes mágicos.',
            publishedYear: 2006,
            copies: 5,
            available: 5,
        },
    });

    const book2 = await prisma.book.upsert({
        where: { isbn: "1984202401" },
        update: {},
        create: {
            isbn: "1984202401",
            title: '1984',
            author: 'George Orwell',
            genre: 'Suspense',
            description: 'El Gran Hermano te vigila.',
            publishedYear: 1949,
            copies: 3,
            available: 3,
        },
    });

    console.log('📚 Libros creados');
    console.log('✅ ¡Seed completado con éxito!');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
