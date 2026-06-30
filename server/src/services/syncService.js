/**
 * In-memory per-room operation queues + document state.
 * Each room gets its own queue so operations are processed
 * strictly in arrival order — this is what prevents race conditions.
 */
const roomQueues = new Map(); // roomCode -> { content, version, processing, queue: [] }

const getOrCreateRoomState = (roomCode, initialContent = '', initialVersion = 0) => {
  if (!roomQueues.has(roomCode)) {
    roomQueues.set(roomCode, {
      content: initialContent,
      version: initialVersion,
      processing: false,
      queue: [],
    });
  }
  return roomQueues.get(roomCode);
};

/**
 * Transform an operation's position against another operation that
 * was already applied ahead of it. This is the core OT step:
 * if someone inserted/deleted text before my operation's position
 * while my operation was in flight, my position needs to shift.
 */
const transformPosition = (position, appliedOp) => {
  if (appliedOp.type === 'insert') {
    if (appliedOp.position <= position) {
      return position + appliedOp.text.length;
    }
    return position;
  }

  if (appliedOp.type === 'delete') {
    if (appliedOp.position <= position) {
      return Math.max(appliedOp.position, position - appliedOp.length);
    }
    return position;
  }

  return position;
};

const applyOp = (content, op) => {
  if (op.type === 'insert') {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  }
  if (op.type === 'delete') {
    return content.slice(0, op.position) + content.slice(op.position + op.length);
  }
  return content;
};

/**
 * Processes a single incoming operation against current room state.
 * If the operation was based on an older version, transform it against
 * every operation that has happened since, in order.
 */
const processOperation = (roomCode, { baseVersion, op }, history) => {
  const state = getOrCreateRoomState(roomCode);

  let transformedOp = { ...op };

  // Transform against any operations that happened after baseVersion
  const opsToTransformAgainst = history.filter((h) => h.version > baseVersion);
  for (const pastOp of opsToTransformAgainst) {
    transformedOp.position = transformPosition(transformedOp.position, pastOp.op);
  }

  state.content = applyOp(state.content, transformedOp);
  state.version += 1;

  return {
    appliedOp: transformedOp,
    newVersion: state.version,
    newContent: state.content,
  };
};

/**
 * Queue-based entry point: ensures operations for a given room are
 * processed strictly one at a time, even if multiple arrive concurrently.
 */
const enqueueOperation = (roomCode, payload, history, callback) => {
  const state = getOrCreateRoomState(roomCode);
  state.queue.push({ payload, callback });
  drainQueue(roomCode, history);
};

const drainQueue = (roomCode, history) => {
  const state = getOrCreateRoomState(roomCode);
  if (state.processing || state.queue.length === 0) return;

  state.processing = true;
  const { payload, callback } = state.queue.shift();

  const result = processOperation(roomCode, payload, history);
  history.push({ version: result.newVersion, op: result.appliedOp });

  callback(result);
  state.processing = false;

  if (state.queue.length > 0) {
    drainQueue(roomCode, history);
  }
};

const getRoomState = (roomCode) => roomQueues.get(roomCode);

const initRoomState = (roomCode, content, version) => {
  getOrCreateRoomState(roomCode, content, version);
};

const clearRoomState = (roomCode) => {
  roomQueues.delete(roomCode);
};

module.exports = {
  enqueueOperation,
  getRoomState,
  initRoomState,
  clearRoomState,
  transformPosition, // exported for unit testing in isolation
  applyOp,
};