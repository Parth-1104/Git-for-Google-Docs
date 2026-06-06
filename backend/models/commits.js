// models/Commit.js
const mongoose = require('mongoose');

const CommitSchema = new mongoose.Schema({
  googleDocId: { // Matches the unique file path string
    type: String,
    required: true,
    index: true
  },
  versionIndex: {
    type: Number,
    required: true
  },
  deltas: {
    type: Array, // Stores [[0, "text"], [1, "inserted"], [-1, "deleted"]]
    required: true
  },
  commitType: {
    type: String,
    enum: ['GENESIS', 'MANUAL_SAVE', 'AUTO_RECOVERY_CLOSE'],
    default: 'MANUAL_SAVE'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

CommitSchema.index({ googleDocId: 1, versionIndex: 1 }, { unique: true });

module.exports = mongoose.model('Commit', CommitSchema);