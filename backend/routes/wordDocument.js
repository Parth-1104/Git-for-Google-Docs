// routes/wordDocument.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const mammoth = require('mammoth');
const diffMatchPatch = require('diff-match-patch');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// 🔌 IMPORT YOUR MONGOOSE MODELS
const Repository = require('../models/repository.js');
const Commit = require('../models/commits.js');
const User = require('../models/user.js'); // ✅ FIXED: Explicitly added the missing User model import

const router = express.Router();
const dmp = new diffMatchPatch();

// In-memory runtime tracking cache (The volatile shield layer)
const trackedFiles = {};

const { track } = require('../controller/local.js');
const { download_commit } = require('../controller/local.js');
const { commits } = require('../controller/local.js');
const { protect } = require('../middleware/authmiddleware.js');

/**
 * 🚀 ROUTE: POST /api/word/track
 * PURPOSE: "git init" for a local Word file. Registers database state and deploys the OS watcher.
 */
router.post('/track', track);

router.get('/download-commit', download_commit);

router.get('/commits', protect, commits);

/**
 * 📝 DATABASE CONVERGENCE GATEWAY: Persists low-frequency micro-commits securely to MongoDB
 */
async function executeCommitGateway(filePath, docName, currentText, ownerId) {
  let repo = await Repository.findOne({ googleDocId: filePath });
  
  if (!repo) {
    console.log(`🆕 Mapping fresh cloud repository node for: ${docName || path.basename(filePath)}`);
    repo = new Repository({
      googleDocId: filePath,
      docName: docName || path.basename(filePath),
      refreshToken: 'CLI_TERMINAL_AGENT',
      currentVersionIndex: 1,
      owner: ownerId
    });
    await repo.save();

    const genesisCommit = new Commit({
      googleDocId: filePath,
      versionIndex: 1,
      deltas: [[0, currentText]],
      commitType: 'GENESIS'
    });
    await genesisCommit.save();
    return { version: 1, message: 'Genesis cloud repository mapped successfully!' };
  }

  const lastCommit = await Commit.findOne({ googleDocId: filePath }).sort({ versionIndex: -1 });
  
  let previousText = "";
  if (lastCommit) {
    if (lastCommit.commitType === 'GENESIS') {
      previousText = lastCommit.deltas[0][1];
    } else {
      lastCommit.deltas.forEach(([op, txt]) => {
        if (op === 0 || op === 1) previousText += txt;
      });
    }
  }

  if (currentText === previousText) {
    return { version: repo.currentVersionIndex, message: 'Ledger stable. No updates to commit.' };
  }

  const nextVersion = repo.currentVersionIndex + 1;
  const diffs = dmp.diff_main(previousText, currentText);
  dmp.diff_cleanupEfficiency(diffs);

  const newCommit = new Commit({
    googleDocId: filePath,
    versionIndex: nextVersion,
    deltas: diffs,
    commitType: 'MANUAL_SAVE'
  });
  await newCommit.save();

  repo.currentVersionIndex = nextVersion;
  await repo.save();

  console.log(`\n📦 [Cloud Ledger Synchronized via CLI] - v${nextVersion} - ${docName}`);
  return { version: nextVersion, message: 'Version state synced successfully!' };
}

/**
 * 📥 ROUTE: POST /api/word/commit-payload
 */
router.post('/commit-payload', async (req, res) => {
  const { filePath, docName, currentText } = req.body;

  if (!filePath || currentText === undefined) {
    return res.status(400).json({ error: 'Missing absolute filePath or text data buffer streams.' });
  }

  try {
    let determinedOwnerId;
    if (req.user && req.user.id) {
      determinedOwnerId = req.user.id;
    } else {
      const fallbackUser = await User.findOne();
      if (!fallbackUser) {
        return res.status(400).json({ error: 'No system users found to map repository ownership parameters.' });
      }
      determinedOwnerId = fallbackUser._id;
    }

    // 🚀 EXECUTING TRANSACTION: Using the refactored database convergence handler
    const result = await executeCommitGateway(filePath, docName, currentText, determinedOwnerId);
    return res.json(result);

  } catch (error) {
    console.error('Cloud synchronization processing crashed:', error.message);
    return res.status(500).json({ error: 'Internal system fault logging snapshot matrix.' });
  }
});

module.exports = router;