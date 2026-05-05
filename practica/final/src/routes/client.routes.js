import { Router } from 'express';
import * as cc from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestión de clientes
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Listar clientes archivados (soft deleted)
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Client' }
 */
router.get('/archived', cc.listArchivedClients);

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear un cliente
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name: { type: string }
 *               cif: { type: string, example: B12345678 }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: CIF duplicado en la compañía
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', validate(createClientSchema), cc.createClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Listar clientes de la compañía
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filtro por nombre (búsqueda parcial)
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: -createdAt }
 *         description: Campo de ordenación (prefijo - para descendente)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/', cc.listClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', cc.getClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/:id', validate(updateClientSchema), cc.updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Eliminar un cliente (soft o hard)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *         description: Si true → archiva (soft delete). Si false → elimina físicamente
 *     responses:
 *       200:
 *         description: Cliente eliminado
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', cc.deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restaurar un cliente archivado
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente restaurado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Cliente archivado no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/restore', cc.restoreClient);

export default router;
