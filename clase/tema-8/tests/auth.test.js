import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

describe('Auth Endpoints', () => {
  let token = '';

  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123'
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('✓ POST /api/auth/register → 201 con usuario creado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('✓ POST /api/auth/register → 409 si email duplicado', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409); 
    });

    it('✓ POST /api/auth/register → 400 si faltan campos', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'solo_email@test.com' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('✓ POST /api/auth/login → 200 con token cuando credenciales válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('✓ POST /api/auth/login → 401 si contraseña incorrecta', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('✓ GET /api/auth/me → 200 con datos del usuario (requiere token)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
    });

    it('✓ GET /api/auth/me → 401 sin token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
