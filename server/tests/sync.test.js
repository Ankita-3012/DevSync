const {
  enqueueOperation,
  getRoomState,
  initRoomState,
  clearRoomState,
  transformPosition,
  applyOp,
} = require('../src/services/syncService');

// Helper to run an op through the queue synchronously and return the result
const runOp = (roomCode, payload, history) => {
  return new Promise((resolve) => {
    enqueueOperation(roomCode, payload, history, (result) => {
      resolve(result);
    });
  });
};

beforeEach(() => {
  // Each test gets a fresh room — clear any leftover in-memory state
  clearRoomState('test-room');
  initRoomState('test-room', '', 0);
});

describe('transformPosition', () => {
  it('shifts insert position right when prior insert is at or before it', () => {
    const appliedOp = { type: 'insert', position: 0, text: 'Hello' };
    expect(transformPosition(0, appliedOp)).toBe(5);
    expect(transformPosition(3, appliedOp)).toBe(8);
  });

  it('does not shift insert position when prior insert is after it', () => {
    const appliedOp = { type: 'insert', position: 10, text: 'Hello' };
    expect(transformPosition(3, appliedOp)).toBe(3);
  });

  it('shifts delete position left when prior delete is before it', () => {
    const appliedOp = { type: 'delete', position: 0, length: 3 };
    expect(transformPosition(5, appliedOp)).toBe(2);
  });

  it('clamps delete position to deletion start when prior delete overlaps it', () => {
    const appliedOp = { type: 'delete', position: 2, length: 5 };
    expect(transformPosition(4, appliedOp)).toBe(2);
  });

  it('does not shift position when prior delete is after it', () => {
    const appliedOp = { type: 'delete', position: 10, length: 3 };
    expect(transformPosition(5, appliedOp)).toBe(5);
  });
});

describe('applyOp', () => {
  it('inserts text at the correct position', () => {
    expect(applyOp('HelloWorld', { type: 'insert', position: 5, text: ' ' })).toBe('Hello World');
    expect(applyOp('', { type: 'insert', position: 0, text: 'Hello' })).toBe('Hello');
  });

  it('deletes characters at the correct position', () => {
    expect(applyOp('Hello World', { type: 'delete', position: 5, length: 1 })).toBe('HelloWorld');
    expect(applyOp('Hello', { type: 'delete', position: 0, length: 5 })).toBe('');
  });

  it('returns content unchanged for unknown op type', () => {
    expect(applyOp('Hello', { type: 'unknown', position: 0 })).toBe('Hello');
  });
});

describe('syncService — sequential operations (no conflict)', () => {
  it('applies a single insert correctly', async () => {
    const history = [];
    const result = await runOp('test-room', { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Hello' } }, history);

    expect(result.newVersion).toBe(1);
    expect(result.newContent).toBe('Hello');
    expect(getRoomState('test-room').content).toBe('Hello');
  });

  it('applies sequential inserts correctly', async () => {
    const history = [];
    await runOp('test-room', { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Hello' } }, history);
    const result = await runOp('test-room', { baseVersion: 1, op: { type: 'insert', position: 5, text: ' World' } }, history);

    expect(result.newVersion).toBe(2);
    expect(result.newContent).toBe('Hello World');
  });

  it('applies a delete correctly', async () => {
    const history = [];
    await runOp('test-room', { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Hello World' } }, history);
    const result = await runOp('test-room', { baseVersion: 1, op: { type: 'delete', position: 5, length: 6 } }, history);

    expect(result.newContent).toBe('Hello');
  });
});

describe('syncService — concurrent operations (OT transforms)', () => {
  it('transforms concurrent inserts at the same position — core OT case', async () => {
    const history = [];

    // Interviewer inserts "Hello" at 0, baseVersion 0
    await runOp('test-room',
      { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Hello' } },
      history
    );

    // Candidate also inserts "World" at 0, baseVersion 0 (stale — concurrent with Hello)
    const result = await runOp('test-room',
      { baseVersion: 0, op: { type: 'insert', position: 0, text: 'World' } },
      history
    );

    // World should have been transformed to position 5 (after Hello)
    expect(result.appliedOp.position).toBe(5);
    expect(result.newContent).toBe('HelloWorld');
    expect(result.newVersion).toBe(2);
  });

  it('transforms a concurrent insert against multiple prior ops', async () => {
    const history = [];

    await runOp('test-room',
      { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Hello' } },
      history
    );
    await runOp('test-room',
      { baseVersion: 1, op: { type: 'insert', position: 5, text: ' World' } },
      history
    );

    // Third client sends based on version 0 (stale by 2 ops)
    const result = await runOp('test-room',
      { baseVersion: 0, op: { type: 'insert', position: 0, text: '!' } },
      history
    );

    // Should transform past both "Hello" (5 chars) and " World" (6 chars) = position 11
    expect(result.appliedOp.position).toBe(11);
    expect(result.newContent).toBe('Hello World!');
  });

  it('transforms a concurrent delete when a prior insert shifts its position', async () => {
    const history = [];

    // Start with "Hello World" in document
    clearRoomState('test-room');
    initRoomState('test-room', 'Hello World', 0);

    await runOp('test-room',
      { baseVersion: 0, op: { type: 'insert', position: 0, text: 'Say: ' } },
      history
    );

    // Client wants to delete the space at position 5 (in their stale view)
    // but "Say: " (5 chars) was inserted before it, so position should shift to 10
    const result = await runOp('test-room',
      { baseVersion: 0, op: { type: 'delete', position: 5, length: 1 } },
      history
    );

    expect(result.appliedOp.position).toBe(10);
    expect(result.newContent).toBe('Say: HelloWorld');
  });
});