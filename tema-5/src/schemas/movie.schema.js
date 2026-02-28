import { z } from 'zod'

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
const currentYear = new Date().getFullYear()

export const createMovieSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Título requerido' }).min(2, 'Mínimo 2 caracteres'),
        director: z.string({ required_error: 'Director requerido' }).min(2, 'Mínimo 2 caracteres'),
        year: z.number().min(1888, 'El año tiene que ser mayor que 1888').max(currentYear, 'El año no puede ser mayor que el actual').optional(),
        genre: z.enum(['Accion', 'Comedia', 'Drama', 'Terror', 'Sci-Fi'], { invalid_type_error: 'Género no válido' }).optional(),
        copies: z.number().int().optional(),
        availableCopies: z.number().int().optional(),
        timesRented: z.number().int().optional(),
        cover: z.string().nullable().optional()
    })

})

export const updateMovieSchema = z.object({
    params: z.object({
        id: objectIdSchema
    }),
    body: z.object({
        title: z.string().min(2, 'Mínimo 2 caracteres').optional(),
        director: z.string().min(2, 'Mínimo 2 caracteres').optional(),
        year: z.number().min(1888, 'El año tiene que ser mayor que 1888').max(currentYear, 'El año no puede ser mayor que el actual').optional(),
        genre: z.enum(['Accion', 'Comedia', 'Drama', 'Terror', 'Sci-Fi'], { invalid_type_error: 'Género no válido' }).optional(),
        copies: z.number().int().optional(),
        availableCopies: z.number().int().optional(),
        timesRented: z.number().int().optional(),
        cover: z.string().nullable().optional()
    })
})
