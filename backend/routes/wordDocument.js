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

/**
 * 🚀 ROUTE: POST /api/word/track
 * PURPOSE: "git init" for a local Word file. Registers database state and deploys the OS watcher.
 */
router.post('/track', async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'Missing absolute filePath' });
  }

  const absolutePath = path.resolve(filePath);
  const fileDirectory = path.dirname(absolutePath);
  const fileName = path.basename(absolutePath);
  const tempFileName = `~$${fileName}`; // Word's transactional runtime lock file descriptor

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Target Word file not found at path.' });
  }

  if (trackedFiles[absolutePath]) {
    return res.json({ message: 'This document is already under active tracking.' });
  }

  try {
    console.log(`\n===========================================`);
    console.log(`🔍 INITIALIZING HIGH-SECURITY LEDGER FOR: ${fileName}`);

    // Extract initial baseline text when tracking starts
    const initialExtraction = await mammoth.extractRawText({ path: absolutePath });
    const baseText = initialExtraction.value;

    // 🗄️ DATABASE INITIALIZATION STATE MACHINE
    let repo = await Repository.findOne({ googleDocId: absolutePath });

    if (!repo) {
      console.log(`🆕 First-time file registration detected. Creating database footprint...`);
      
      repo = new Repository({
        googleDocId: absolutePath,
        docName: fileName,
        refreshToken: 'LOCAL_DESKTOP_DAEMON',
        currentVersionIndex: 1
      });
      await repo.save();

      // Seed the Genesis Commit (v1) directly to MongoDB
      const genesisCommit = new Commit({
        googleDocId: absolutePath,
        versionIndex: 1,
        deltas: [[0, baseText]], // Git equivalent of tracking raw text baseline setup
        commitType: 'GENESIS'
      });
      await genesisCommit.save();
      console.log(`🍃 Genesis structural record written to MongoDB ledger.`);
    } else {
      console.log(`📂 Existing repository found in database. Fast-forwarding state tracking...`);
    }

    // Mount unified tracking runtime parameters in system RAM
    trackedFiles[absolutePath] = {
      cachedText: baseText,                        // Last committed text benchmark block
      liveBuffer: baseText,                        // 🛡️ High-frequency RAM cache catching "Don't Save" strokes
      currentVersionIndex: repo.currentVersionIndex,
      watcher: chokidar.watch(fileDirectory, {
        persistent: true,
        ignoreInitial: true,
        depth: 0
      })
    };

    console.log(`📌 Baseline Synced at Version Reference Index: v${repo.currentVersionIndex}`);
    console.log(`===========================================`);

    // ⚡ INTERCEPTOR OS LIFESTYLE TIMING LINKS
    trackedFiles[absolutePath].watcher.on('all', async (event, changedFilePath) => {
      const changedFileName = path.basename(changedFilePath);

      // TRACKER 1: Passive In-Memory Text Scraping (Updates your RAM buffer during typing)
      // Tracks changes whenever Word hits the core document filesystem stream or updates owner logs
      if ((changedFileName === fileName || changedFileName === tempFileName) && event === 'change') {
        try {
          const extraction = await mammoth.extractRawText({ path: absolutePath });
          if (extraction.value && extraction.value !== trackedFiles[absolutePath].liveBuffer) {
            // Silently capture Word's auto-flushed disk blocks into our memory layer
            trackedFiles[absolutePath].liveBuffer = extraction.value; 
          }
        } catch (e) {
          // Soft catch to bypass transient EBUSY locks while Word writes binary segments
        }
      }

      // TRACKER 2: User explicitly hits Save (Cmd + S) on the primary file
      if (changedFileName === fileName && event === 'change') {
        console.log(`\n💾 EVENT ROUTER: User Triggered Manual Save (Cmd + S)`);
        await executeCommitGateway(absolutePath, false);
      }

      // TRACKER 3: User clicks the Red Cross button (Word deletes the lock file)
      if (changedFileName === tempFileName && event === 'unlink') {
        console.log(`\n🚨 EVENT ROUTER: Document Closed ("Don't Save" Protection Fired)`);
        
        // ⏳ A tiny 50ms pause allows final async FS threads to settle right as the lock clears
        setTimeout(async () => {
          await executeCommitGateway(absolutePath, true);
        }, 50);
      }
    });

    res.json({
      message: `Tracking activated for "${fileName}". Database ledger hooked.`,
      absolutePath,
      currentVersion: repo.currentVersionIndex
    });

  } catch (error) {
    console.error('Failed to initialize local tracking matrix:', error.message);
    res.status(500).json({ error: 'Failed to establish tracking system.' });
  }
});





/**
 * 💾 ROUTE: GET /api/word/download-commit
 * PURPOSE: Reconstructs a historical text state directly from raw delta operations and builds a downloadable .docx binary.
 */
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

/**
 * 📡 ROUTE: GET /api/word/commits
 */
/**
 * 📡 ROUTE: GET /api/word/commits
 * PURPOSE: Fetches the full version timeline sequence for a file to render on your frontend dashboard.
 */
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


/**
 * 📥 ROUTE: POST /api/word/commit-payload
 * PURPOSE: Endpoint for the terminal CLI. Accepts text directly from the user's machine,
 * computes the Git diff, and logs it straight into MongoDB Atlas.
 */
router.post('/commit-payload', async (req, res) => {
  const { filePath, docName, currentText } = req.body;

  if (!filePath || currentText === undefined) {
    return res.status(400).json({ error: 'Missing absolute filePath or text data buffer streams.' });
  }

  try {
    // 1. Check or initialize the master repository footprint in the cloud database
    let repo = await Repository.findOne({ googleDocId: filePath });
    if (!repo) {
      repo = new Repository({
        googleDocId: filePath,
        docName: docName || path.basename(filePath),
        refreshToken: 'CLI_TERMINAL_AGENT',
        currentVersionIndex: 1
      });
      await repo.save();

      // Seed baseline genesis block
      const genesisCommit = new Commit({
        googleDocId: filePath,
        versionIndex: 1,
        deltas: [[0, currentText]],
        commitType: 'GENESIS'
      });
      await genesisCommit.save();

      return res.json({ message: 'Genesis cloud repository mapped successfully!', version: 1 });
    }

    // 2. Fetch the absolute last recorded commit from the database to find the baseline text
    const lastCommit = await Commit.findOne({ googleDocId: filePath }).sort({ versionIndex: -1 });
    
    // Reconstruct the previous text state directly from the last DB commit's deltas
    let previousText = "";
    if (lastCommit) {
      if (lastCommit.commitType === 'GENESIS') {
        previousText = lastCommit.deltas[0][1];
      } else {
        // Direct reconstruction from equal/insert operations
        lastCommit.deltas.forEach(([op, txt]) => {
          if (op === 0 || op === 1) previousText += txt;
        });
      }
    }

    // 3. Prevent duplicate blocks if no change occurred
    if (currentText === previousText) {
      return res.json({ message: 'Ledger stable. No updates to commit.', version: repo.currentVersionIndex });
    }

    // 4. Calculate Character-level Variations
    const nextVersion = repo.currentVersionIndex + 1;
    const diffs = dmp.diff_main(previousText, currentText);
    dmp.diff_cleanupEfficiency(diffs);

    // 5. Commit to cloud storage
    const newCommit = new Commit({
      googleDocId: filePath,
      versionIndex: nextVersion,
      deltas: diffs,
      commitType: 'MANUAL_SAVE'
    });
    await newCommit.save();

    // Advance repository version tracking pointer index
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