
const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
  googleDocId: { 
    type: String,
    required: true,
    unique: true,
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Repository', RepositorySchema);