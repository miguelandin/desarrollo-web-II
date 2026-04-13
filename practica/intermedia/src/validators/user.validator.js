import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email().trim().transform((val) => val.toLowerCase()),
        password: z.string().min(8),
        name: z.string().min(1),
        lastName: z.string().optional(),
        nif: z.string().min(1),
        address: z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            postal: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional(),
        isFreelance: z.boolean().optional().default(false)
    }).strict()
})
