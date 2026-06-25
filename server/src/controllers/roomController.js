const Room = require('../models/Room');

const createRoom = async (req, res, next) => {
  try {
    const { language } = req.body;

    const room = await Room.create({
      interviewer: req.user.userId,
      language: language || 'javascript',
    });

    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status === 'ended') {
      return res.status(400).json({ message: 'This session has already ended' });
    }

    // Don't let the interviewer "join" their own room as a candidate
    if (room.interviewer.toString() === req.user.userId) {
      return res.status(200).json({ room });
    }

    if (room.candidate && room.candidate.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Room already has a candidate' });
    }

    room.candidate = req.user.userId;
    room.status = 'active';
    await room.save();

    res.status(200).json({ room });
  } catch (err) {
    next(err);
  }
};

const getRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode })
      .populate('interviewer', 'name email')
      .populate('candidate', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ room });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRoom, joinRoom, getRoom };