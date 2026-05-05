import { Router } from 'express';
import * as cc from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/archived', cc.listArchivedClients);         // ANTES de /:id
router.post('/', validate(createClientSchema), cc.createClient);
router.get('/', cc.listClients);
router.get('/:id', cc.getClient);
router.put('/:id', validate(updateClientSchema), cc.updateClient);
router.delete('/:id', cc.deleteClient);
router.patch('/:id/restore', cc.restoreClient);

export default router;
