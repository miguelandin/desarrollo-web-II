import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { createTaskSchema, updateTaskSchema, patchTaskSchema } from '../schemas/tasks.schema.js';

const router = Router();

router.get('/', tasksController.getAll);
router.get('/:id', tasksController.getById);
router.post('/', validate(createTaskSchema), tasksController.create);
router.put('/:id', validate(updateTaskSchema), tasksController.update);
router.patch('/:id', validate(patchTaskSchema), tasksController.partialUpdate);
router.delete('/:id', tasksController.remove);

export default router;
