const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lineNumber: { type: Number, required: true },
    text: { type: String, required: true, trim: true },
    snapshotVersion: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);