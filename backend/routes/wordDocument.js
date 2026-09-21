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
const User = require('../models/user.js');

const router = express.Router();
const dmp = new diffMatchPatch();

const { track, download_commit, commits } = require('../controller/local.js');
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
  // 🔍 FIXED: Query by BOTH owner and googleDocId to align with your compound index
  let repo = await Repository.findOne({ owner: ownerId, googleDocId: filePath });
  
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

  const lastCommit = await Commit.findOne({ googleDocId: filePath, versionIndex: repo.currentVersionIndex }).sort({ versionIndex: -1 });
  
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
 * 🛡️ FIXED: Added `protect` middleware so `req.user` is populated correctly!
 */
router.post('/commit-payload', protect, async (req, res) => {
  const { filePath, docName, currentText } = req.body;

  if (!filePath || currentText === undefined) {
    return res.status(400).json({ error: 'Missing absolute filePath or text data buffer streams.' });
  }

  try {
    // 🔑 Guaranteed owner ID from the verified JWT token middleware
    const determinedOwnerId = req.user.id || req.user._id;

    const result = await executeCommitGateway(filePath, docName, currentText, determinedOwnerId);
    return res.json(result);

  } catch (error) {
    console.error('Cloud synchronization processing crashed:', error.message);
    return res.status(500).json({ error: 'Internal system fault logging snapshot matrix.' });
  }
});

router.get('/repositories', protect, async (req, res) => {
  try {
    const ownerId = req.user.id || req.user._id;
    const usersRepos = await Repository.find({ owner: ownerId }).sort({ updatedAt: -1 });
    res.json(usersRepos);
  } catch (error) {
    res.status(500).json({ error: "Failed to pull tracking registry list indices from cloud matrix." });
  }
});

module.exports = router;