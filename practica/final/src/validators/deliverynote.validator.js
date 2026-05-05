import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID inválido');

const workerSchema = z.object({
    name: z.string().trim().min(1, 'Nombre del trabajador requerido'),
    hours: z.number().min(0, 'Horas no pueden ser negativas')
});

const materialSchema = z.object({
    format: z.literal('material'),
    client: objectIdSchema,
    project: objectIdSchema,
    description: z.string().trim().optional(),
    workDate: z.string().datetime({ message: 'Fecha inválida (ISO 8601)' }),
    material: z.string().trim().min(1, 'Material requerido'),
    quantity: z.number().min(0, 'Cantidad no puede ser negativa'),
    unit: z.string().trim().min(1, 'Unidad requerida')
});

// Sin .refine() — discriminatedUnion no acepta ZodEffects
const hoursSchema = z.object({
    format: z.literal('hours'),
    client: objectIdSchema,
    project: objectIdSchema,
    description: z.string().trim().optional(),
    workDate: z.string().datetime({ message: 'Fecha inválida (ISO 8601)' }),
    hours: z.number().min(0).optional(),
    workers: z.array(workerSchema).optional()
});

export const createDeliveryNoteSchema = z.object({
    body: z.discriminatedUnion('format', [materialSchema, hoursSchema])
}).refine(
    data => {
        if (data.body.format !== 'hours') return true;
        return data.body.hours !== undefined || (data.body.workers && data.body.workers.length > 0);
    },
    { message: 'Debe indicar hours o al menos un worker', path: ['body', 'hours'] }
);
