import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().trim().optional(),
    number: z.string().trim().optional(),
    postal: z.string().trim().optional(),
    city: z.string().trim().optional(),
    province: z.string().trim().optional()
}).optional();

export const createClientSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Nombre mínimo 2 caracteres'),
        cif: z.string().trim().min(9, 'CIF inválido').max(9, 'CIF inválido').toUpperCase(),
        email: z.string().email('Email inválido').trim().toLowerCase().optional(),
        phone: z.string().trim().optional(),
        address: addressSchema
    })
});

export const updateClientSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).optional(),
        cif: z.string().trim().min(9).max(9).toUpperCase().optional(),
        email: z.string().email().trim().toLowerCase().optional(),
        phone: z.string().trim().optional(),
        address: addressSchema
    })
});
