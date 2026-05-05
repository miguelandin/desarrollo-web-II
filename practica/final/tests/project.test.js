import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Company from '../src/models/company.model.js';
import Client from '../src/models/client.model.js';
import Project from '../src/models/project.model.js';
import './setup.js';

const agent = request(app);
let token;
let clientId;
let projectId;

beforeAll(async () => {
    const company = await Company.create({ owner: new mongoose.Types.ObjectId(), name: 'ProjCo', cif: 'A22222222' });
    const user = await User.create({
        email: 'projuser@test.com', password: 'hashedpassword123',
        company: company._id, status: 'verified', role: 'admin'
    });
    const client = await Client.create({ user: user._id, company: company._id, name: 'Cliente Proj', cif: 'B22222222' });
    clientId = client._id.toString();

    const { tokenSign } = await import('../src/utils/handleJwt.js');
    token = tokenSign(user);
});

describe('POST /api/project', () => {
    it('crea un proyecto', async () => {
        const res = await agent.post('/api/project').set('Authorization', `Bearer ${token}`)
            .send({ name: 'Proyecto Test', projectCode: 'PRJ001', client: clientId });
        expect(res.status).toBe(201);
        expect(res.body.projectCode).toBe('PRJ001');
        projectId = res.body._id;
    });

    it('rechaza código duplicado', async () => {
        const res = await agent.post('/api/project').set('Authorization', `Bearer ${token}`)
            .send({ name: 'Otro', projectCode: 'PRJ001', client: clientId });
        expect(res.status).toBe(409);
    });

    it('rechaza cliente inexistente', async () => {
        const res = await agent.post('/api/project').set('Authorization', `Bearer ${token}`)
            .send({ name: 'X', projectCode: 'PRJ999', client: new mongoose.Types.ObjectId().toString() });
        expect(res.status).toBe(404);
    });
});

describe('GET /api/project', () => {
    it('lista proyectos con paginación', async () => {
        const res = await agent.get('/api/project?page=1&limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('totalPages');
    });

    it('filtra por cliente', async () => {
        const res = await agent.get(`/api/project?client=${clientId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('obtiene proyecto por id', async () => {
        const res = await agent.get(`/api/project/${projectId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(projectId);
    });
});

describe('PUT /api/project/:id', () => {
    it('actualiza proyecto', async () => {
        const res = await agent.put(`/api/project/${projectId}`).set('Authorization', `Bearer ${token}`)
            .send({ name: 'Actualizado' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Actualizado');
    });
});

describe('DELETE + archived + restore', () => {
    it('soft delete', async () => {
        const res = await agent.delete(`/api/project/${projectId}?soft=true`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });

    it('lista proyectos archivados', async () => {
        const res = await agent.get('/api/project/archived').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.some(p => p._id === projectId)).toBe(true);
    });

    it('restaura proyecto', async () => {
        const res = await agent.patch(`/api/project/${projectId}/restore`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.deleted).toBe(false);
    });
});
