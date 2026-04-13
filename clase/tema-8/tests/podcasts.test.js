import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';

describe('Podcasts Endpoints', () => {
  let userToken = '';
  let adminToken = '';
  let podcastId = '';

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // 1. Crear un usuario NORMAL
    const normalUser = { name: 'User', email: `user_${Date.now()}@test.com`, password: 'password123' };
    const resUser = await request(app).post('/api/auth/register').send(normalUser);
    userToken = resUser.body.token;

    // 2. Crear un ADMIN
    const adminUser = { name: 'Admin', email: `admin_${Date.now()}@test.com`, password: 'password123' };
    const resAdmin = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = resAdmin.body.token;
    
    // Forzamos el rol a admin directamente en la base de datos
    await User.findByIdAndUpdate(resAdmin.body.user._id, { role: 'admin' });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/podcasts', () => {
    it('✓ POST /api/podcasts → 201 con podcast creado (requiere token)', async () => {
      const newPodcast = {
        title: 'Podcast de Prueba',
        description: 'Esta es una descripción válida de más de 10 chars.',
        category: 'tech',
        duration: 120
      };

      const res = await request(app)
        .post('/api/podcasts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newPodcast)
        .expect(201);

      expect(res.body.data.title).toBe(newPodcast.title);
      podcastId = res.body.data._id; // Lo guardamos para poder borrarlo luego
    });

    it('✓ POST /api/podcasts → 401 sin token', async () => {
      await request(app)
        .post('/api/podcasts')
        .send({ title: 'Podcast Ilegal', description: 'No tengo token de auth', duration: 100 })
        .expect(401);
    });
  });

  describe('GET /api/podcasts', () => {
    it('✓ GET /api/podcasts → 200 con array (solo publicados)', async () => {
      const res = await request(app)
        .get('/api/podcasts')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/podcasts/admin/all', () => {
    it('✓ GET /api/podcasts/admin/all → 200 solo para admin', async () => {
      const res = await request(app)
        .get('/api/podcasts/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/podcasts/:id', () => {
    it('✓ DELETE /api/podcasts/:id → 403 para user normal', async () => {
      await request(app)
        .delete(`/api/podcasts/${podcastId}`)
        .set('Authorization', `Bearer ${userToken}`) // Intenta borrarlo el usuario normal
        .expect(403);
    });

    it('✓ DELETE /api/podcasts/:id → 200 solo para admin', async () => {
      await request(app)
        .delete(`/api/podcasts/${podcastId}`)
        .set('Authorization', `Bearer ${adminToken}`) // Lo borra el admin exitosamente
        .expect(200);
    });
  });
});
