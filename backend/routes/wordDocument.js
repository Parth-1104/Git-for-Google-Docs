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

const router = express.Router();
const dmp = new diffMatchPatch();

// In-memory runtime tracking cache (The volatile shield layer)
const trackedFiles = {};


const {track}=require('../controller/local.js')
const {download_commit}=require('../controller/local.js')
const {commits}=require('../controller/local.js');
const { protect } = require('../middleware/authmiddleware.js');



/**
 * 🚀 ROUTE: POST /api/word/track
 * PURPOSE: "git init" for a local Word file. Registers database state and deploys the OS watcher.
 */
router.post('/track', track);






router.get('/download-commit', download_commit);


router.get('/commits',protect, commits);

/**
 * 📝 DATABASE CONVERGENCE GATEWAY: Persists low-frequency micro-commits securely to MongoDB
 */
async function executeCommitGateway(filePath, wasDiscarded) {
  try {
    let currentText = "";

    // 🌟 THE RECOVERY GAP: If discarded, pull from our hot RAM buffer instead of the rolled-back disk file
    if (wasDiscarded) {
      currentText = trackedFiles[filePath].liveBuffer;
    } else {
      if (fs.existsSync(filePath)) {
        const docExtraction = await mammoth.extractRawText({ path: filePath });
        currentText = docExtraction.value;
      }
    }

    const previousText = trackedFiles[filePath].cachedText || "";

    // If the text matches exactly, don't write duplicate data blocks to the DB
    if (currentText === previousText) {
      console.log(`ℹ️ Ledger balanced: No textual divergence detected. DB write bypassed.`);
      return;
    }

    // Advance identifiers
    const nextVersion = trackedFiles[filePath].currentVersionIndex + 1;
    const determinedCommitType = wasDiscarded ? 'AUTO_RECOVERY_CLOSE' : 'MANUAL_SAVE';

    // Run the text character diffing engine
    const diffs = dmp.diff_main(previousText, currentText);
    dmp.diff_cleanupEfficiency(diffs);

    // Save the structural delta array straight to MongoDB
    const nextCommit = new Commit({
      googleDocId: filePath,
      versionIndex: nextVersion,
      deltas: diffs,
      commitType: determinedCommitType
    });
    await nextCommit.save();

    // Fast-forward the Repository state pointer index in your tracking collection
    await Repository.findOneAndUpdate(
      { googleDocId: filePath },
      { currentVersionIndex: nextVersion }
    );

    console.log(`\n📦 [MongoDB Ledger Commit Success]`);
    console.log(`   └─ File Reference: ${path.basename(filePath)}`);
    console.log(`   └─ Version Stamped: v${nextVersion}`);
    console.log(`   └─ Saved State Source: ${wasDiscarded ? "Memory Recovery Stream (Don't Save)" : "Physical Disk Save"}`);
    console.log(`-------------------------------------------`);

    // Fast-forward our runtime operational reference frames
    trackedFiles[filePath].cachedText = currentText;
    trackedFiles[filePath].liveBuffer = currentText;
    trackedFiles[filePath].currentVersionIndex = nextVersion;

  } catch (error) {
    console.error('❌ Failed to commit transaction entry to Database:', error.message);
  }
}



router.post('/commit-payload', async (req, res) => {
  const { filePath, docName, currentText } = req.body;

  if (!filePath || currentText === undefined) {
    return res.status(400).json({ error: 'Missing absolute filePath or text data buffer streams.' });
  }

  try {
   
    let repo = await Repository.findOne({ googleDocId: filePath });
    if (!repo) {
      repo = new Repository({
        googleDocId: filePath,
        docName: docName || path.basename(filePath),
        refreshToken: 'CLI_TERMINAL_AGENT',
        currentVersionIndex: 1
      });
      await repo.save();

     
      const genesisCommit = new Commit({
        googleDocId: filePath,
        versionIndex: 1,
        deltas: [[0, currentText]],
        commitType: 'GENESIS'
      });
      await genesisCommit.save();

      return res.json({ message: 'Genesis cloud repository mapped successfully!', version: 1 });
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
      return res.json({ message: 'Ledger stable. No updates to commit.', version: repo.currentVersionIndex });
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

    res.json({ message: 'Version state synced successfully!', version: nextVersion });

  } catch (error) {
    console.error('Cloud synchronization processing crashed:', error.message);
    res.status(500).json({ error: 'Internal system fault logging snapshot matrix.' });
  }
});

module.exports = router;