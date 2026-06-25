const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Room = require('../src/models/Room');

let mongoServer;
let interviewerToken;
let candidateToken;
let candidate2Token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany();
  await Room.deleteMany();

  const interviewerRes = await request(app).post('/api/auth/signup').send({
    name: 'Interviewer One',
    email: 'interviewer@example.com',
    password: 'password123',
    role: 'interviewer',
  });
  interviewerToken = interviewerRes.body.token;

  const candidateRes = await request(app).post('/api/auth/signup').send({
    name: 'Candidate One',
    email: 'candidate@example.com',
    password: 'password123',
    role: 'candidate',
  });
  candidateToken = candidateRes.body.token;

  const candidate2Res = await request(app).post('/api/auth/signup').send({
    name: 'Candidate Two',
    email: 'candidate2@example.com',
    password: 'password123',
    role: 'candidate',
  });
  candidate2Token = candidate2Res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Room API', () => {
  describe('POST /api/rooms', () => {
    it('creates a room when authenticated', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ language: 'python' });

      expect(res.statusCode).toBe(201);
      expect(res.body.room).toHaveProperty('roomCode');
      expect(res.body.room.language).toBe('python');
      expect(res.body.room.status).toBe('waiting');
    });

    it('rejects room creation without a token', async () => {
      const res = await request(app).post('/api/rooms').send({ language: 'python' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('No token provided');
    });

    it('rejects room creation with an invalid token', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ language: 'python' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/rooms/:roomCode/join', () => {
    let roomCode;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ language: 'javascript' });
      roomCode = res.body.room.roomCode;
    });

    it('allows a candidate to join an open room', async () => {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/join`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.room.status).toBe('active');
    });

    it('rejects a second candidate joining a full room', async () => {
      await request(app)
        .post(`/api/rooms/${roomCode}/join`)
        .set('Authorization', `Bearer ${candidateToken}`);

      const res = await request(app)
        .post(`/api/rooms/${roomCode}/join`)
        .set('Authorization', `Bearer ${candidate2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Room already has a candidate');
    });

    it('returns 404 for a non-existent room code', async () => {
      const res = await request(app)
        .post('/api/rooms/doesnotexist/join')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/rooms/:roomCode', () => {
    it('returns room details with populated interviewer/candidate', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ language: 'java' });
      const roomCode = createRes.body.room.roomCode;

      const res = await request(app)
        .get(`/api/rooms/${roomCode}`)
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.room.interviewer.email).toBe('interviewer@example.com');
    });

    it('returns 404 for an unknown room code', async () => {
      const res = await request(app)
        .get('/api/rooms/unknowncode')
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});