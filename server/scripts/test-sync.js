const { io } = require('socket.io-client');

// === FILL THESE IN before running ===
const SERVER_URL = 'http://localhost:5000';
const INTERVIEWER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTQyOGM5NGM1MDZlMjE2YzVkMTEwNWMiLCJyb2xlIjoiaW50ZXJ2aWV3ZXIiLCJpYXQiOjE3ODI3NDYyNjAsImV4cCI6MTc4MzM1MTA2MH0.cG-_xmUMxqnD74lPMaNZDl6SlRahsV2vp8kaMQg9GWo';
const CANDIDATE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTQyOGQ1YmM1MDZlMjE2YzVkMTEwNWUiLCJyb2xlIjoiY2FuZGlkYXRlIiwiaWF0IjoxNzgyNzQ2NDU5LCJleHAiOjE3ODMzNTEyNTl9.eLOoUHnWqrLqfezuJNQEEf07JJzCoBKjfxo6zAIa47Y';
const ROOM_CODE = 'f402f552';
// ======================================

const interviewerSocket = io(SERVER_URL, {
  auth: { token: INTERVIEWER_TOKEN },
});

const candidateSocket = io(SERVER_URL, {
  auth: { token: CANDIDATE_TOKEN },
});

let interviewerVersion = 0;
let candidateVersion = 0;

interviewerSocket.on('connect', () => {
  console.log('[Interviewer] connected:', interviewerSocket.id);

  interviewerSocket.emit('join-room', { roomCode: ROOM_CODE }, (res) => {
    if (res.error) {
      console.error('[Interviewer] join-room error:', res.error);
      return;
    }
    console.log('[Interviewer] joined room. content:', JSON.stringify(res.content), 'version:', res.version);
    interviewerVersion = res.version;

    // Simulate typing "Hello" at position 0
    setTimeout(() => {
      console.log('[Interviewer] sending insert "Hello" at position 0');
      interviewerSocket.emit('code-op', {
        roomCode: ROOM_CODE,
        baseVersion: interviewerVersion,
        op: { type: 'insert', position: 0, text: 'Hello' },
      });
    }, 500);
  });
});

candidateSocket.on('connect', () => {
  console.log('[Candidate] connected:', candidateSocket.id);

  candidateSocket.emit('join-room', { roomCode: ROOM_CODE }, (res) => {
    if (res.error) {
      console.error('[Candidate] join-room error:', res.error);
      return;
    }
    console.log('[Candidate] joined room. content:', JSON.stringify(res.content), 'version:', res.version);
    candidateVersion = res.version;

    // Simulate typing "World" at position 0, at almost the same time as interviewer
    setTimeout(() => {
      console.log('[Candidate] sending insert "World" at position 0');
      candidateSocket.emit('code-op', {
        roomCode: ROOM_CODE,
        baseVersion: candidateVersion,
        op: { type: 'insert', position: 0, text: 'World' },
      });
    }, 500); // slightly after interviewer, to simulate near-simultaneous edits
  });
});

// Both sockets listen for applied operations to see the server's resolution
interviewerSocket.on('code-op-applied', ({ op, version, self }) => {
  interviewerVersion = version;
  console.log(`[Interviewer] received code-op-applied (self=${!!self}):`, op, 'newVersion:', version);
});

candidateSocket.on('code-op-applied', ({ op, version, self }) => {
  candidateVersion = version;
  console.log(`[Candidate] received code-op-applied (self=${!!self}):`, op, 'newVersion:', version);
});

interviewerSocket.on('connect_error', (err) => {
  console.error('[Interviewer] connect_error:', err.message);
});

candidateSocket.on('connect_error', (err) => {
  console.error('[Candidate] connect_error:', err.message);
});

// Let it run for a few seconds then exit
setTimeout(() => {
  console.log('\n--- Test complete, disconnecting ---');
  interviewerSocket.disconnect();
  candidateSocket.disconnect();
  process.exit(0);
}, 3000);