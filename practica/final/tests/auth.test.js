import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import './setup.js';

const agent = request(app);
const testUser = { email: 'auth@test.com', password: 'password123' };


describe('POST /api/user/register', () => {
    beforeEach(async () => { await User.deleteMany({}); });

    it('registra usuario nuevo', async () => {
        const res = await agent.post('/api/user/register').send(testUser);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('rechaza email duplicado verificado', async () => {
        const reg = await agent.post('/api/user/register').send(testUser);
        const token = reg.body.accessToken;
        const user = await User.findOne({ email: testUser.email }).select('+verificationCode');
        await agent.put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: user.verificationCode });

        const res = await agent.post('/api/user/register').send(testUser);
        expect(res.status).toBe(409);
    });

    it('rechaza body inválido sin password', async () => {
        const res = await agent.post('/api/user/register').send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/user/login', () => {
    let registeredUser;

    beforeEach(async () => {
        await User.deleteMany({});
        // Crear usuario verificado directamente en BD
        const { encrypt } = await import('../src/utils/handlePassword.js');
        const hash = await encrypt(testUser.password);
        registeredUser = await User.create({ email: testUser.email, password: hash, status: 'verified' });
    });

    it('devuelve token con credenciales correctas', async () => {
        const res = await agent.post('/api/user/login').send(testUser);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('rechaza contraseña incorrecta', async () => {
        const res = await agent.post('/api/user/login').send({ ...testUser, password: 'wrongpass' });
        expect(res.status).toBe(401);
    });

    it('rechaza usuario inexistente', async () => {
        const res = await agent.post('/api/user/login').send({ email: 'noexiste@test.com', password: '12345678' });
        expect(res.status).toBe(404);
    });
});

describe('GET /api/user', () => {
    let token;

    beforeEach(async () => {
        await User.deleteMany({});
        const res = await agent.post('/api/user/register').send(testUser);
        token = res.body.accessToken;
    });

    it('devuelve perfil con token válido', async () => {
        const res = await agent.get('/api/user').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(testUser.email);
    });

    it('rechaza sin token', async () => {
        const res = await agent.get('/api/user');
        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/user', () => {
    let token;

    beforeEach(async () => {
        await User.deleteMany({});
        const res = await agent.post('/api/user/register').send(testUser);
        token = res.body.accessToken;
    });

    it('soft delete del usuario', async () => {
        const res = await agent.delete('/api/user?soft=true').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});
