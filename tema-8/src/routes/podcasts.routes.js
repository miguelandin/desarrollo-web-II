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
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Obtener todos los podcasts
 *     description: Retorna la lista completa de podcasts (solo admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de podcasts obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Podcast'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado - se requiere rol admin
 *       500:
 *         description: Error interno del servidor
 */
router.get(
    '/admin/all',
    authMiddleware,
    checkRol('admin'),
    getAllPodcasts
);

/**
 * @openapi
 * /api/podcasts:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Listar podcasts públicos
 *     description: Retorna la lista de podcasts publicados y disponibles públicamente
 *     responses:
 *       200:
 *         description: Lista de podcasts públicos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Podcast'
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Crear nuevo podcast
 *     description: Crea un nuevo podcast (requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePodcast'
 *     responses:
 *       201:
 *         description: Podcast creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       400:
 *         description: Datos inválidos en la solicitud
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getPodcasts);
router.post(
    '/',
    authMiddleware,
    validate(createPodcastSchema),
    createPodcast
);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Obtener podcast por ID
 *     description: Retorna los detalles de un podcast específico
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del podcast
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Podcast no encontrado
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     tags:
 *       - Podcasts
 *     summary: Actualizar podcast
 *     description: Actualiza los datos de un podcast existente (requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del podcast
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePodcast'
 *     responses:
 *       200:
 *         description: Podcast actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       400:
 *         description: Datos inválidos o ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso para actualizar este podcast
 *       404:
 *         description: Podcast no encontrado
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: Eliminar podcast
 *     description: Elimina un podcast (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del podcast
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado - se requiere rol admin
 *       404:
 *         description: Podcast no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
    '/:id',
    validate(idParamSchema),
    getPodcast
);

router.put(
    '/:id',
    authMiddleware,
    validate(idParamSchema),
    validate(updatePodcastSchema),
    updatePodcast
);

router.delete(
    '/:id',
    authMiddleware,
    checkRol('admin'),
    validate(idParamSchema),
    deletePodcast
);

/**
 * @openapi
 * /api/podcasts/{id}/publish:
 *   patch:
 *     tags:
 *       - Podcasts
 *     summary: Publicar podcast
 *     description: Publica un podcast para que sea visible públicamente (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del podcast
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast publicado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado - se requiere rol admin
 *       404:
 *         description: Podcast no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
    '/:id/publish',
    authMiddleware,
    checkRol('admin'),
    validate(idParamSchema),
    publishPodcast
);

export default router;

