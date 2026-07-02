const registerCommentHandlers = (io, socket) => {
  socket.on('new-comment', (comment) => {
    const { roomCode } = comment;
    if (!roomCode) return;
    socket.to(roomCode).emit('comment-added', comment);
  });
};

module.exports = registerCommentHandlers;