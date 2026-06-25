const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('creates a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'interviewer',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.role).toBe('interviewer');
      // passwordHash should never be returned
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejects signup with a duplicate email', async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'password456',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('Email already in use');
    });

    it('rejects signup with missing fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
    });

    it('rejects login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});