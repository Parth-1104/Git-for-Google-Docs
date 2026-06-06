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

/**
 * 🚀 ROUTE: POST /api/word/track
 * PURPOSE: "git init" for a local Word file. Registers database state and deploys the OS watcher.
 */
router.post('/track', track);






router.get('/download-commit', async (req, res) => {
  const { filePath, targetVersion } = req.query;

  if (!filePath || !targetVersion) {
    return res.status(400).json({ error: 'Missing filePath or targetVersion parameter.' });
  }

  try {
    const absolutePath = path.resolve(decodeURIComponent(filePath));
    const targetVersionNum = parseInt(targetVersion, 10);

    // 1. Fetch all commits from Genesis up to our target version ordered chronologically
    const commits = await Commit.find({
      googleDocId: absolutePath,
      versionIndex: { $lte: targetVersionNum }
    }).sort({ versionIndex: 1 });

    if (commits.length === 0) {
      return res.status(404).json({ error: 'No version history records found for this document.' });
    }

    // 2. State Machine Reconstruction: Replay the raw diff operations step-by-step
    let reconstructedText = "";

    for (const commit of commits) {
      if (commit.commitType === 'GENESIS') {
        // Version 1 is always our starting baseline text string block
        reconstructedText = commit.deltas[0][1];
      } else {
        // Loop through the atomic diff components to morph the text state to the next version
        let nextTextIteration = "";
        
        commit.deltas.forEach(([operation, text]) => {
          if (operation === 0 || operation === 1) {
            // 0 (EQUAL) and 1 (INSERT) both contribute characters to the next version state
            nextTextIteration += text;
          }
          // -1 (DELETE) blocks are explicitly ignored so they drop out of the string matrix
        });
        
        reconstructedText = nextTextIteration;
      }
    }

    // 3. Compile the pure reconstructed text string into native Word paragraph segments
    const textLines = reconstructedText.split('\n');
    const documentParagraphs = textLines.map(line => {
      return new Paragraph({
        children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
        spacing: { after: 200 }
      });
    });

    // 4. Generate the native docx File Container
    const doc = new Document({
      sections: [{
        properties: {},
        children: documentParagraphs
      }]
    });

    // 5. Pack binary buffer and stream headers back as an attachment file download
    const buffer = await Packer.toBuffer(doc);
    const downloadName = `v${targetVersionNum}_${path.basename(absolutePath)}`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    
    return res.send(buffer);

  } catch (error) {
    console.error('Failed to construct downloadable asset:', error.message);
    return res.status(500).json({ error: 'Failed to compile version target file binary mapping.' });
  }
});


router.get('/commits', async (req, res) => {
  let { filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: 'Missing filePath query parameter' });
  }

  try {
    // 1. 🌟 THE FIX: Explicitly decode percent-encoded symbols sent via URL string queries
    const decodedPath = decodeURIComponent(filePath);
    const absolutePath = path.resolve(decodedPath);

    // 2. Structural Guard: Verify if this file has actually been initialized in our records
    const repoExists = await Repository.findOne({ googleDocId: absolutePath });
    if (!repoExists) {
      return res.status(404).json({ 
        error: 'Target file has not been initialized under active tracking tracking loops yet.' 
      });
    }

    // 3. Pull all recorded diff structures ordered from newest version index downwards
    const commits = await Commit.find({ googleDocId: absolutePath }).sort({ versionIndex: -1 });
    
    res.json({
      filePath: absolutePath,
      fileName: path.basename(absolutePath),
      currentVersion: repoExists.currentVersionIndex,
      commits: commits.map(c => ({
        version: c.versionIndex,
        type: c.commitType || 'MANUAL_SAVE',
        timestamp: c.timestamp,
        changes: c.deltas.map(part => ({
          operation: part[0] === 1 ? 'INSERT' : part[0] === -1 ? 'DELETE' : 'EQUAL',
          text: part[1]
        }))
      }))
    });
  } catch (error) {
    console.error('Timeline compilation failure:', error.message);
    res.status(500).json({ error: 'Failed to retrieve version history timeline compilation metrics.' });
  }
});

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