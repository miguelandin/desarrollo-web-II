import { Router } from 'express';
import {
  getPodcasts, getPodcast, createPodcast, 
  updatePodcast, deletePodcast, getAllPodcasts, publishPodcast
} from '../controllers/podcasts.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPodcastSchema, updatePodcastSchema, idParamSchema } from '../validators/podcast.validator.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/podcasts/admin/all:
 * get:
 * tags:
 * - Podcasts
 * summary: Obtener todos los podcasts
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lista completa
 * 403:
 * description: Solo Admin
 */
router.get('/admin/all', authMiddleware, checkRol('admin'), getAllPodcasts);

/**
 * @openapi
 * /api/podcasts:
 * get:
 * tags:
 * - Podcasts
 * summary: Listar podcasts publicados
 * responses:
 * 200:
 * description: Lista pública
 */
router.get('/', getPodcasts);

/**
 * @openapi
 * /api/podcasts/{id}:
 * get:
 * tags:
 * - Podcasts
 * summary: Obtener podcast por ID
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Podcast encontrado
 * 404:
 * description: No encontrado
 */
router.get('/:id', validate(idParamSchema), getPodcast);

/**
 * @openapi
 * /api/podcasts:
 * post:
 * tags:
 * - Podcasts
 * summary: Crear un podcast
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - title
 * - description
 * - duration
 * properties:
 * title:
 * type: string
 * description:
 * type: string
 * category:
 * type: string
 * duration:
 * type: integer
 * responses:
 * 201:
 * description: Creado
 */
router.post('/', authMiddleware, validate(createPodcastSchema), createPodcast);

/**
 * @openapi
 * /api/podcasts/{id}:
 * put:
 * tags:
 * - Podcasts
 * summary: Actualizar podcast
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: string
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * responses:
 * 200:
 * description: Actualizado
 */
router.put('/:id', authMiddleware, validate(idParamSchema), validate(updatePodcastSchema), updatePodcast);

/**
 * @openapi
 * /api/podcasts/{id}/publish:
 * patch:
 * tags:
 * - Podcasts
 * summary: Publicar podcast
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Estado cambiado
 */
router.patch('/:id/publish', authMiddleware, checkRol('admin'), validate(idParamSchema), publishPodcast);

/**
 * @openapi
 * /api/podcasts/{id}:
 * delete:
 * tags:
 * - Podcasts
 * summary: Eliminar podcast
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Eliminado
 */
router.delete('/:id', authMiddleware, checkRol('admin'), validate(idParamSchema), deletePodcast);

export default router;
