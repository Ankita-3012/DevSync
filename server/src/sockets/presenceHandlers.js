const registerPresenceHandlers = (io, socket) => {
  socket.on('join-room', ({ roomCode }) => {
    socket.to(roomCode).emit('user-joined', { userId: socket.data.userId });
  });

  socket.on('typing-start', ({ roomCode }) => {
    socket.to(roomCode).emit('user-typing', { userId: socket.data.userId, typing: true });
  });

  socket.on('typing-stop', ({ roomCode }) => {
    socket.to(roomCode).emit('user-typing', { userId: socket.data.userId, typing: false });
  });
};

module.exports = registerPresenceHandlers;