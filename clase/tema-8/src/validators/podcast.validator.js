import { z } from 'zod';

const podcastCategories = ['tech', 'science', 'history', 'comedy', 'news'];

export const createPodcastSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'El título tiene que tener mínimo 3 letras')
      .trim(),
    
    description: z.string()
      .min(10, 'La descripción tiene que tener mínimo 10 letras'),
    
    category: z.enum(podcastCategories, {
      errorMap: () => ({ message: 'Categoría no válida' })
    }).optional(),
    
    duration: z.number()
      .min(60, 'El podcast debe de durar mínimo 60 segundos'),
    
    episodes: z.number()
      .int()
      .positive('El número de episodios debe ser positivo')
      .optional(),
    
    published: z.boolean().optional()
  })
});

export const updatePodcastSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'El título tiene que tener mínimo 3 letras')
      .trim()
      .optional(),
      
    description: z.string()
      .min(10, 'La descripción tiene que tener mínimo 10 letras')
      .optional(),
      
    category: z.enum(podcastCategories, {
      errorMap: () => ({ message: 'Categoría no válida' })
    }).optional(),
    
    duration: z.number()
      .min(60, 'El podcast debe de durar mínimo 60 segundos')
      .optional(),
      
    episodes: z.number()
      .int()
      .positive('El número de episodios debe ser positivo')
      .optional(),
      
    published: z.boolean().optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de MongoDB no válido')
  })
});
