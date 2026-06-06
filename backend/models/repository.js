const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
  // 🔑 THE USER LINK: Every document tracker now belongs to a specific platform user
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
    // ❌ unique: true removed here to allow different users to track similar path strings safely
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🛡️ COMPOUND INDEX: Guarantees a single user cannot create duplicate tracking paths,
// while letting separate users track matching path vectors on their independent setups.
RepositorySchema.index({ owner: 1, googleDocId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);