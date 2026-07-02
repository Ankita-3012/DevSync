const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Room = require('../src/models/Room');
const Comment = require('../src/models/Comment');
const CodeSnapshot = require('../src/models/CodeSnapshot');

let mongoServer;
let interviewerToken;
let candidateToken;
let roomCode;
let roomId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany();
  await Room.deleteMany();
  await Comment.deleteMany();
  await CodeSnapshot.deleteMany();

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

  const roomRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${interviewerToken}`)
    .send({ language: 'javascript' });

  roomCode = roomRes.body.room.roomCode;
  roomId = roomRes.body.room._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Comments API', () => {
  describe('POST /api/rooms/:roomCode/comments', () => {
    it('creates a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ lineNumber: 3, text: 'This variable is unused', snapshotVersion: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment).toHaveProperty('_id');
      expect(res.body.comment.lineNumber).toBe(3);
      expect(res.body.comment.text).toBe('This variable is unused');
      expect(res.body.comment.author.email).toBe('interviewer@example.com');
    });

    it('allows candidate to comment too', async () => {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ lineNumber: 1, text: 'Good function signature', snapshotVersion: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.author.email).toBe('candidate@example.com');
    });

    it('rejects comment with missing fields', async () => {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ lineNumber: 3 }); // missing text and snapshotVersion

      expect(res.statusCode).toBe(400);
    });

    it('rejects comment without auth', async () => {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .send({ lineNumber: 3, text: 'No auth', snapshotVersion: 1 });

      expect(res.statusCode).toBe(401);
    });

    it('returns 404 for unknown room', async () => {
      const res = await request(app)
        .post(`/api/rooms/unknownroom/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ lineNumber: 1, text: 'test', snapshotVersion: 1 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/rooms/:roomCode/comments', () => {
    beforeEach(async () => {
      // Seed two comments
      await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({ lineNumber: 2, text: 'First comment', snapshotVersion: 1 });

      await request(app)
        .post(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ lineNumber: 5, text: 'Second comment', snapshotVersion: 1 });
    });

    it('returns all comments for a room in chronological order', async () => {
      const res = await request(app)
        .get(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.comments).toHaveLength(2);
      expect(res.body.comments[0].text).toBe('First comment');
      expect(res.body.comments[1].text).toBe('Second comment');
    });

    it('populates author name and email on each comment', async () => {
      const res = await request(app)
        .get(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(res.body.comments[0].author).toHaveProperty('name');
      expect(res.body.comments[0].author).toHaveProperty('email');
      expect(res.body.comments[0].author.passwordHash).toBeUndefined();
    });

    it('returns empty array when no comments exist', async () => {
      await Comment.deleteMany();

      const res = await request(app)
        .get(`/api/rooms/${roomCode}/comments`)
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.comments).toHaveLength(0);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get(`/api/rooms/${roomCode}/comments`);
      expect(res.statusCode).toBe(401);
    });
  });
});

describe('AI Review API', () => {
  it('returns 400 when no code snapshot exists', async () => {
    const res = await request(app)
      .get(`/api/rooms/${roomCode}/ai-review`)
      .set('Authorization', `Bearer ${interviewerToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('No code to review yet');
  });

  it('returns 400 when snapshot exists but content is empty', async () => {
    await CodeSnapshot.create({ room: roomId, content: '', version: 0 });

    const res = await request(app)
      .get(`/api/rooms/${roomCode}/ai-review`)
      .set('Authorization', `Bearer ${interviewerToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown room', async () => {
    const res = await request(app)
      .get(`/api/rooms/unknownroom/ai-review`)
      .set('Authorization', `Bearer ${interviewerToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('rejects without auth', async () => {
    const res = await request(app).get(`/api/rooms/${roomCode}/ai-review`);
    expect(res.statusCode).toBe(401);
  });
});