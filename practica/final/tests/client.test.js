import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Company from '../src/models/company.model.js';
import Client from '../src/models/client.model.js';
import './setup.js';

const agent = request(app);
let token;
let clientId;

const newClient = { name: 'Cliente Test', cif: 'B12345678', email: 'cliente@test.com' };

beforeAll(async () => {
    const company = await Company.create({ owner: new mongoose.Types.ObjectId(), name: 'TestCo', cif: 'A11111111' });
    const user = await User.create({
        email: 'clientuser@test.com', password: 'hashedpassword123',
        company: company._id, status: 'verified', role: 'admin'
    });
    const { tokenSign } = await import('../src/utils/handleJwt.js');
    token = tokenSign(user);
});

describe('POST /api/client', () => {
    it('crea un cliente', async () => {
        const res = await agent.post('/api/client').set('Authorization', `Bearer ${token}`).send(newClient);
        expect(res.status).toBe(201);
        expect(res.body.name).toBe(newClient.name);
        clientId = res.body._id;
    });

    it('rechaza CIF duplicado', async () => {
        const res = await agent.post('/api/client').set('Authorization', `Bearer ${token}`).send(newClient);
        expect(res.status).toBe(409);
    });

    it('rechaza body inválido sin nombre', async () => {
        const res = await agent.post('/api/client').set('Authorization', `Bearer ${token}`).send({ cif: 'C99999999' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/client', () => {
    it('lista clientes con paginación', async () => {
        const res = await agent.get('/api/client?page=1&limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('totalItems');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('currentPage');
    });

    it('filtra por nombre', async () => {
        const res = await agent.get('/api/client?name=Cliente').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('obtiene cliente por id', async () => {
        const res = await agent.get(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(clientId);
    });

    it('404 en cliente inexistente', async () => {
        const res = await agent.get(`/api/client/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/client/:id', () => {
    it('actualiza cliente', async () => {
        const res = await agent.put(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Actualizado' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Actualizado');
    });
});

describe('DELETE + archived + restore', () => {
    it('soft delete del cliente', async () => {
        const res = await agent.delete(`/api/client/${clientId}?soft=true`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });

    it('lista clientes archivados', async () => {
        const res = await agent.get('/api/client/archived').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.some(c => c._id === clientId)).toBe(true);
    });

    it('restaura cliente archivado', async () => {
        const res = await agent.patch(`/api/client/${clientId}/restore`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.deleted).toBe(false);
    });

    it('hard delete del cliente', async () => {
        const res = await agent.delete(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });

    it('404 tras hard delete', async () => {
        const res = await agent.get(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});
