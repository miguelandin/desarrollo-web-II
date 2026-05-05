import { Router } from 'express';
import * as dnc from '../controllers/deliverynote.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadSignature } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: DeliveryNotes
 *   description: Gestión de albaranes
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar albarán en PDF
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirect a PDF en Cloudinary (si ya fue firmado y subido)
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/pdf/:id', dnc.downloadPdf);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [DeliveryNotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [format, client, project, workDate, material, quantity, unit]
 *                 properties:
 *                   format: { type: string, enum: [material] }
 *                   client: { type: string }
 *                   project: { type: string }
 *                   workDate: { type: string, format: date-time }
 *                   description: { type: string }
 *                   material: { type: string }
 *                   quantity: { type: number }
 *                   unit: { type: string }
 *               - type: object
 *                 required: [format, client, project, workDate]
 *                 properties:
 *                   format: { type: string, enum: [hours] }
 *                   client: { type: string }
 *                   project: { type: string }
 *                   workDate: { type: string, format: date-time }
 *                   description: { type: string }
 *                   hours: { type: number }
 *                   workers:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name: { type: string }
 *                         hours: { type: number }
 *     responses:
 *       201:
 *         description: Albarán creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DeliveryNote' }
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Cliente o proyecto no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', validate(createDeliveryNoteSchema), dnc.createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Listar albaranes de la compañía
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [material, hours] }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Filtro desde fecha (workDate)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Filtro hasta fecha (workDate)
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: -workDate }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista paginada de albaranes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/', dnc.listDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID (con populate)
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán con datos de usuario, cliente y proyecto
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DeliveryNote' }
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', dnc.getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán con imagen de firma
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (JPG, PNG, etc.)
 *     responses:
 *       200:
 *         description: Albarán firmado. Incluye signatureUrl y pdfUrl en Cloudinary
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DeliveryNote' }
 *       400:
 *         description: No se subió imagen de firma
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: El albarán ya está firmado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/sign', uploadSignature.single('signature'), dnc.signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Eliminar un albarán (solo si no está firmado)
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: No se puede eliminar un albarán firmado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', dnc.deleteDeliveryNote);

export default router;
