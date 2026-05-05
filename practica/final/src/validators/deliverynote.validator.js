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

const hoursSchema = z.object({
    format: z.literal('hours'),
    client: objectIdSchema,
    project: objectIdSchema,
    description: z.string().trim().optional(),
    workDate: z.string().datetime({ message: 'Fecha inválida (ISO 8601)' }),
    hours: z.number().min(0).optional(),
    workers: z.array(workerSchema).optional()
}).refine(
    data => data.hours !== undefined || (data.workers && data.workers.length > 0),
    { message: 'Debe indicar hours o al menos un worker', path: ['hours'] }
);

export const createDeliveryNoteSchema = z.object({
    body: z.discriminatedUnion('format', [materialSchema, hoursSchema])
});
