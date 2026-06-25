const mongoose = require('mongoose');
const crypto = require('crypto');

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(4).toString('hex'), // e.g. "a1b2c3d4"
    },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    language: { type: String, default: 'javascript' },
    status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);