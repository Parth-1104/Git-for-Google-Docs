#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const chokidar = require('chokidar');
const mammoth = require('mammoth');
const axios = require('axios');
require('dotenv').config();

const args = process.argv.slice(2);
const command = args[0];
const targetFile = args[1];

const BACKEND_URL = "https://git-for-google-docs.onrender.com";
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.gitdoc_config.json');

// --- LOGIN COMMAND HANDLER ---
if (command === 'login') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n===========================================');
  console.log('🔑 GITDOC CLI AUTHENTICATION SETUP');
  console.log('===========================================\n');
  
  rl.question('Paste your auth token from the web dashboard: ', (token) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      console.log('❌ Token cannot be empty.');
      rl.close();
      process.exit(1);
    }

    try {
      fs.writeFileSync(configPath, JSON.stringify({ token: trimmedToken }, null, 2));
      console.log('\n✅ Successfully authenticated! Config saved to:', configPath);
      console.log('👉 You can now track documents using: gitdoc track <path_to_file.docx>\n');
    } catch (err) {
      console.error('❌ Failed to save configuration file:', err.message);
    }
    rl.close();
  });
  return;
}

// --- TRACK COMMAND HANDLER ---
if (command !== 'track' || !targetFile) {
  console.log('\n❌ Invalid Usage Sequence Detected.');
  console.log('💡 Usage instructions:');
  console.log('   gitdoc login');
  console.log('   gitdoc track <path_to_file.docx>\n');
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  console.error('\n❌ Authentication Error: No active session found.');
  console.error('👉 Please run "gitdoc login" first to link your account.\n');
  process.exit(1);
}

let userToken = '';
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  userToken = config.token;
} catch (err) {
  console.error('\n❌ Error reading local session configuration file.\n');
  process.exit(1);
}

if (!userToken) {
  console.error('\n❌ Authentication Token missing inside configuration profile.\n');
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
console.log(`🚀 GITDOC LOCAL AGENT DEPLOYED SUCCESSFULLY`);
console.log(`🔍 Monitoring Asset: ${fileName}`);
console.log(`📡 Connection Target: ${BACKEND_URL}`);
console.log(`⚡ Automated sync active on "Cmd + S"...`);
console.log(`===========================================`);

const watcher = chokidar.watch(fileDirectory, {
  persistent: true,
  ignoreInitial: true,
  depth: 0
});

watcher.on('all', async (event, changedFilePath) => {
  const changedFileName = path.basename(changedFilePath);

  if (changedFileName === fileName && event === 'change') {
    try {
      console.log(`\n💾 Action Intercepted: System changes flushed to disk...`);
      
      const extraction = await mammoth.extractRawText({ path: absolutePath });
      const currentText = extraction.value;

      console.log(`📤 Dispatching differential bytes payload stream to cloud...`);
      
      const response = await axios.post(`${BACKEND_URL}/api/word/commit-payload`, {
        filePath: absolutePath,
        docName: fileName,
        currentText: currentText
      }, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
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