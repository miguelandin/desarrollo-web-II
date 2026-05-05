import { Router } from 'express';
import * as pc from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(verifyToken);

router.get('/archived', pc.listArchivedProjects);        // ANTES de /:id
router.post('/', validate(createProjectSchema), pc.createProject);
router.get('/', pc.listProjects);
router.get('/:id', pc.getProject);
router.put('/:id', validate(updateProjectSchema), pc.updateProject);
router.delete('/:id', pc.deleteProject);
router.patch('/:id/restore', pc.restoreProject);

export default router;
