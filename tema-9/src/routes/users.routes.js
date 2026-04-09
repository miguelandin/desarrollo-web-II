// src/routes/users.routes.js
import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';

const router = Router();

// CRUD básico
router.get('/', usersController.getUsers);
router.get('/search', usersController.searchUsers);
router.get('/stats', usersController.getUserStats);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.post('/with-profile', usersController.createUserWithProfile);
router.post('/with-post', usersController.createUserWithPost);
router.put('/:id', usersController.updateUser);
router.put('/upsert', usersController.upsertUser);
router.delete('/:id', usersController.deleteUser);

export default router;
