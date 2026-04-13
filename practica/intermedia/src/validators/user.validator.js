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

export const validationSchema = z.object({
    body: z.object({
        code: z.string().length(6, "El código debe de tener 6 dígitos")
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email().trim().transform(val => val.toLowerCase()),
        password: z.string()
    })
})

export const personalDataSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        lastName: z.string().min(1),
        nif: z.string().min(9)
    })
})

export const companySchema = z.object({
    body: z.discriminatedUnion("isFreelance", [
        z.object({
            isFreelance: z.literal(true), // Autónomo: no hace falta nombre ni CIF, se saca del user
            address: z.object({
                street: z.string(), number: z.string(), postal: z.string(), city: z.string(), province: z.string()
            }).optional()
        }),
        z.object({
            isFreelance: z.literal(false),
            name: z.string().min(1, "El nombre de la empresa es obligatorio"),
            cif: z.string().min(9, "CIF obligatorio"),
            address: z.object({
                street: z.string(), number: z.string(), postal: z.string(), city: z.string(), province: z.string()
            }).optional()
        })
    ])
})

export const passwordSchema = z.object({
    body: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8)
    }).refine(data => data.currentPassword !== data.newPassword, {
        message: "La nueva contraseña debe ser diferente a la actual",
        path: ["newPassword"]
    })
})

export const inviteSchema = z.object({
    body: z.object({
        email: z.string().email().trim().transform(val => val.toLowerCase()),
        name: z.string().min(1)
    })
})
