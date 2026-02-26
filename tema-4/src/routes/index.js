import { Router } from 'express'
import tasksRoutes from './tasks.routes.js'

const router = Router();

router.use('/tasks', tasksRoutes);

router.get('/', (req, res) => {
    res.json({
        menssage: 'Tasks API v1.0',
        endpoints: {
            tasks: '/api/tasks/0',
            health: '/health'
        }
    });
});

export default router;
