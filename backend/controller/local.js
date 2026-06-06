


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


const track = async (req, res) => {
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
  }



  module.exports={track}