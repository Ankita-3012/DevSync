const mongoose = require('mongoose');

const codeSnapshotSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
    content: { type: String, default: '' },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodeSnapshot', codeSnapshotSchema);