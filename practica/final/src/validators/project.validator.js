import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().trim().optional(),
    number: z.string().trim().optional(),
    postal: z.string().trim().optional(),
    city: z.string().trim().optional(),
    province: z.string().trim().optional()
}).optional();

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID inválido');

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Nombre requerido'),
        projectCode: z.string().trim().min(1, 'Código requerido').toUpperCase(),
        client: objectIdSchema,
        address: addressSchema,
        email: z.string().email('Email inválido').trim().toLowerCase().optional(),
        notes: z.string().trim().optional(),
        active: z.boolean().optional()
    })
});

export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).optional(),
        projectCode: z.string().trim().min(1).toUpperCase().optional(),
        client: objectIdSchema.optional(),
        address: addressSchema,
        email: z.string().email().trim().toLowerCase().optional(),
        notes: z.string().trim().optional(),
        active: z.boolean().optional()
    })
});
