# T9: Código de Ejemplo - Supabase + Prisma

Ejemplos de código para trabajar con Supabase PostgreSQL y Prisma ORM.

## Estructura

```
T9/
├── prisma/
│   └── schema.prisma      # Schema de Prisma
├── src/
│   ├── config/
│   │   └── prisma.js      # Cliente Prisma
│   ├── controllers/
│   │   └── users.controller.js
│   ├── routes/
│   │   └── users.routes.js
│   └── app.js
├── .env.example
└── package.json
```

## Instalación

```bash
npm install
cp .env.example .env
# Configurar DATABASE_URL con tu Supabase
npx prisma migrate dev
npm run dev
```

## Conceptos Demostrados

1. **Schema de Prisma**: Modelos, relaciones, enums
2. **Cliente Prisma**: Singleton, conexión
3. **CRUD con Prisma**: Create, Read, Update, Delete
4. **Relaciones**: Include, select anidado
5. **Transacciones**: $transaction
