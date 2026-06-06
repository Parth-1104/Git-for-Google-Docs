#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const mammoth = require('mammoth');
const axios = require('axios');

// Catch running command line syntax arguments (e.g., gitdoc track ./test.docx)
const args = process.argv.slice(2);
const command = args[0];
const targetFile = args[1];

// 🌐 Target Local or Live Backend Deploy URL
const BACKEND_URL = "http://localhost:8080";

if (command !== 'track' || !targetFile) {
  console.log('\n❌ Invalid Usage Sequence Detected.');
  console.log('💡 Run it like this: gitdoc track <path_to_file.docx>\n');
  process.exit(1);
}

const absolutePath = path.resolve(targetFile);
const fileDirectory = path.dirname(absolutePath);
const fileName = path.basename(absolutePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`\n❌ Execution Error: Target file not found at path: ${absolutePath}\n`);
  process.exit(1);
}

console.log(`\n===========================================`);
console.log(`🚀 GITDOC LOCAL AGENT DEPLOYED SUCCESSFULY`);
console.log(`🔍 Monitoring Asset: ${fileName}`);
console.log(`📡 Connection Target: ${BACKEND_URL}`);
console.log(`⚡ Automated sync active on "Cmd + S"...`);
console.log(`===========================================`);

// Mount filesystem watcher loop targeting parent space directory
const watcher = chokidar.watch(fileDirectory, {
  persistent: true,
  ignoreInitial: true,
  depth: 0
});

watcher.on('all', async (event, changedFilePath) => {
  const changedFileName = path.basename(changedFilePath);

  // Catch the manual save timestamp write variations on your hard disk drive
  if (changedFileName === fileName && event === 'change') {
    try {
      console.log(`\n💾 Action Intercepted: System changes flushed to disk...`);
      
      // 1. Process character text conversion natively inside the terminal sandbox
      const extraction = await mammoth.extractRawText({ path: absolutePath });
      const currentText = extraction.value;

      console.log(`📤 Dispatching differential bytes payload stream to cloud...`);
      
      // 2. Ship clean processing object models up to your main Express instance server router
      const response = await axios.post(`${BACKEND_URL}/api/word/commit-payload`, {
        filePath: absolutePath,
        docName: fileName,
        currentText: currentText
      });

      console.log(`✅ [Sync Success] Ledger adjusted to Version Reference Index: v${response.data.version}`);

    } catch (error) {
      if (error.response) {
        console.error(`❌ Sync Rejected by Backend:`, error.response.data.error);
      } else {
        console.error(`❌ Connectivity Error linking with Cloud Gateway:`, error.message);
      }
    }
  }
});