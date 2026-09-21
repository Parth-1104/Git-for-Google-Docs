const mongoose = require('mongoose');
const crypto = require('crypto');

const RepositorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  googleDocId: { 
    type: String,
    required: true,
    index: true
  },
  docName: {
    type: String,
    default: 'Untitled Document'
  },
  refreshToken: {
    type: String,
    default: 'LOCAL_DESKTOP_CLIENT'
  },
  currentVersionIndex: {
    type: Number,
    default: 1
  },
  // 🔒 PRIVATE BY DEFAULT: Personal to the owner unless explicitly shared
  isPublic: {
    type: Boolean,
    default: false
  },
  // 🔗 SHARE LINK TOKEN: Unique string for secure URL sharing
  shareToken: {
    type: String,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

RepositorySchema.index({ owner: 1, googleDocId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);