const Room = require('../models/Room');
const CodeSnapshot = require('../models/CodeSnapshot');
const syncService = require('../services/syncService');

const DEBOUNCE_MS = 2000;
const saveTimers = new Map(); // roomCode -> timeout handle

// In-memory operation history per room, used for transforming late-arriving ops.
// Trimmed periodically to avoid unbounded growth.
const roomHistories = new Map();

const getHistory = (roomCode) => {
  if (!roomHistories.has(roomCode)) {
    roomHistories.set(roomCode, []);
  }
  return roomHistories.get(roomCode);
};

const scheduleSave = (roomCode) => {
  if (saveTimers.has(roomCode)) {
    clearTimeout(saveTimers.get(roomCode));
  }

  const timer = setTimeout(async () => {
    const state = syncService.getRoomState(roomCode);
    if (!state) return;

    try {
      const room = await Room.findOne({ roomCode });
      if (!room) return;

      await CodeSnapshot.findOneAndUpdate(
        { room: room._id },
        { content: state.content, version: state.version },
        { upsert: true }
      );
    } catch (err) {
      console.error(`Failed to persist snapshot for room ${roomCode}:`, err.message);
    }

    saveTimers.delete(roomCode);
  }, DEBOUNCE_MS);

  saveTimers.set(roomCode, timer);
};


const registerEditorHandlers = (io, socket) => {
  socket.on('join-room', async ({ roomCode }, ack) => {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        return ack?.({ error: 'Room not found' });
      }

      socket.join(roomCode);
      socket.data.roomCode = roomCode;

      const snapshot = await CodeSnapshot.findOneAndUpdate({ room: room._id }, { $setOnInsert: { content: '', version: 0 } },
  { upsert: true, returnDocument: 'after' });
      

      // Hydrate in-memory state from persisted snapshot if not already loaded
      if (!syncService.getRoomState(roomCode)) {
        syncService.initRoomState(roomCode, snapshot.content, snapshot.version);
      }

      const state = syncService.getRoomState(roomCode);
      ack?.({ content: state.content, version: state.version });
    } catch (err) {
        console.error('[DEBUG] join-room error:', err);
      ack?.({ error: 'Failed to join room' });
    }
  });

  socket.on('code-op', ({ roomCode, baseVersion, op }) => {
    const history = getHistory(roomCode);

    syncService.enqueueOperation(roomCode, { baseVersion, op }, history, (result) => {
      // Broadcast the transformed operation + new version to everyone else in the room
      socket.to(roomCode).emit('code-op-applied', {
        op: result.appliedOp,
        version: result.newVersion,
      });

      // Acknowledge to the sender too, so their own version counter stays in sync
      socket.emit('code-op-applied', {
        op: result.appliedOp,
        version: result.newVersion,
        self: true,
      });

      scheduleSave(roomCode);

      console.log(`[DEBUG] Room ${roomCode} content is now:`, JSON.stringify(syncService.getRoomState(roomCode).content));

      // Prevent unbounded history growth — keep last 500 ops per room
      if (history.length > 500) {
        history.splice(0, history.length - 500);
      }
    });
  });

  socket.on('cursor-move', ({ roomCode, position }) => {
    socket.to(roomCode).emit('remote-cursor', {
      userId: socket.data.userId,
      position,
    });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('user-left', { userId: socket.data.userId });
    }
  });
};

module.exports = registerEditorHandlers;