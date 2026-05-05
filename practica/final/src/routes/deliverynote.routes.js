import { Router } from 'express';
import * as dnc from '../controllers/deliverynote.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadSignature } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/pdf/:id', dnc.downloadPdf);                 // ANTES de /:id
router.post('/', validate(createDeliveryNoteSchema), dnc.createDeliveryNote);
router.get('/', dnc.listDeliveryNotes);
router.get('/:id', dnc.getDeliveryNote);
router.patch('/:id/sign', uploadSignature.single('signature'), dnc.signDeliveryNote);
router.delete('/:id', dnc.deleteDeliveryNote);

export default router;
