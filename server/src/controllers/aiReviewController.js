const Room = require('../models/Room');
const CodeSnapshot = require('../models/CodeSnapshot');
const { reviewCode } = require('../services/llmService');

const getAIReview = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const snapshot = await CodeSnapshot.findOne({ room: room._id });
    if (!snapshot || !snapshot.content.trim()) {
      return res.status(400).json({ message: 'No code to review yet' });
    }

    const suggestions = await reviewCode(snapshot.content, room.language);
    res.status(200).json({ suggestions, snapshotVersion: snapshot.version });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAIReview };