import { z } from 'zod';

const taskBodyBase = z.object({
    title: z.string()
        .min(3, 'title must have at least 3 characters')
        .max(100, 'title must have maximum 100 characters'),
    description: z.string().optional(),
    completed: z.coerce.boolean().default(false),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    date: z.number().default(() => Date.now())
});

export const createTaskSchema = z.object({
    body: taskBodyBase
});

export const updateTaskSchema = z.object({
    body: taskBodyBase,
    params: z.object({
        id: z.coerce.number().int().positive()
    })
});

export const patchTaskSchema = z.object({
    body: taskBodyBase.partial(), 
    params: z.object({
        id: z.coerce.number().int().positive()
    })
});
