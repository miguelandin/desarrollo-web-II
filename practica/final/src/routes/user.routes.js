import { Router } from 'express';
import * as uc from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadLogo } from '../middleware/upload.js';
import * as schemas from '../validators/user.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Usuario registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', validate(schemas.registerSchema), uc.register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', validate(schemas.loginSchema), uc.login);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nuevo access token
 *       401:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/refresh', uc.refreshToken);

router.use(verifyToken);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validar email con código de verificación
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email verificado
 *       400:
 *         description: Código incorrecto o email ya verificado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Demasiados intentos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/validation', validate(schemas.validationSchema), uc.validateEmail);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Actualizar datos personales (onboarding)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, nif]
 *             properties:
 *               name: { type: string }
 *               lastName: { type: string }
 *               nif: { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200:
 *         description: Datos actualizados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 */
router.put('/register', validate(schemas.personalDataSchema), uc.updatePersonalData);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Crear o unirse a una compañía (onboarding)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   isFreelance:
 *                     type: boolean
 *                     example: true
 *               - type: object
 *                 required: [isFreelance, name, cif]
 *                 properties:
 *                   isFreelance:
 *                     type: boolean
 *                     example: false
 *                   name: { type: string }
 *                   cif: { type: string }
 *     responses:
 *       200:
 *         description: Compañía asociada
 *       400:
 *         description: Faltan datos personales
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/company', validate(schemas.companySchema), uc.updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de la compañía
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo actualizado
 *       400:
 *         description: No se subió archivo o sin compañía
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/logo', uploadLogo.single('logo'), uc.uploadCompanyLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', uc.getUserProfile);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/logout', uc.logout);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Si true, borrado lógico; si false, borrado físico
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/', uc.deleteUser);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Contraseña actual incorrecta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/password', validate(schemas.passwordSchema), uc.changePassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar usuario a la compañía (solo admin)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Usuario invitado con contraseña temporal
 *       403:
 *         description: Acceso prohibido (no es admin)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/invite', requireRole('admin'), validate(schemas.inviteSchema), uc.inviteUser);

export default router;
