const Comment = require('../models/Comment');
const Room = require('../models/Room');

const getComments = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const comments = await Comment.find({ room: room._id })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { lineNumber, text, snapshotVersion } = req.body;

    if (!lineNumber || !text || snapshotVersion === undefined) {
      return res.status(400).json({ message: 'lineNumber, text, and snapshotVersion are required' });
    }

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const comment = await Comment.create({
      room: room._id,
      author: req.user.userId,
      lineNumber,
      text,
      snapshotVersion,
    });

    const populated = await comment.populate('author', 'name email');
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment };