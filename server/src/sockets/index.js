const { Server } = require('socket.io');
const { verifyToken } = require('../services/tokenService');
const registerEditorHandlers = require('./editorHandlers');
const registerPresenceHandlers = require('./presenceHandlers');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*' }, // tighten this to your frontend URL before deploying
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    registerEditorHandlers(io, socket);
    registerPresenceHandlers(io, socket);
  });

  return io;
};

module.exports = initSocket;