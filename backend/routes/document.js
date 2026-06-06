
const express = require('express');
const { google } = require('googleapis');
const diffMatchPatch = require('diff-match-patch');
require('dotenv').config();

const router = express.Router();
const dmp = new diffMatchPatch();

const activeSyncJobs = {};

/**
 * ROUTE: POST /api/document/track
 * PURPOSE: "git init" using Google's live Changes Stream
 */
router.post('/track', async (req, res) => {
  const { googleDocId, refreshToken } = req.body;

  if (!googleDocId || !refreshToken) {
    return res.status(400).json({ error: 'Missing googleDocId or refreshToken' });
  }

  if (activeSyncJobs[googleDocId]) {
    return res.json({ message: 'Document is already being actively tracked.' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    console.log(`\n🔍 Initializing stream tracking for Doc ID: ${googleDocId}`);
    
    
    const fileMetadata = await drive.files.get({ fileId: googleDocId, fields: 'name' });
    const docName = fileMetadata.data.name || 'Untitled Document';
    console.log(`📂 Document Found: "${docName}"`);

    
    const tokenResponse = await drive.changes.getStartPageToken({});
    let lastSavedPageToken = tokenResponse.data.startPageToken;
    console.log(`📌 Git HEAD Checkpoint initialized at Token: ${lastSavedPageToken}`);

    activeSyncJobs[googleDocId] = {
      cachedText: ""
    };

    
    activeSyncJobs[googleDocId].intervalId = setInterval(async () => {
      try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });

       
        const changesResponse = await drive.changes.list({
          pageToken: lastSavedPageToken,
          fields: 'nextPageToken, newStartPageToken, changes(fileId, time)'
        });

        const changes = changesResponse.data.changes || [];

       
        const docWasModified = changes.some(change => change.fileId === googleDocId);

        if (docWasModified) {
          console.log(`\n⚡ Live Change Stream Event Captured for "${docName}"!`);
          

          await processDocumentCommit(docs, googleDocId);
        }


        if (changesResponse.data.newStartPageToken) {
          lastSavedPageToken = changesResponse.data.newStartPageToken;
        } else if (changesResponse.data.nextPageToken) {
          lastSavedPageToken = changesResponse.data.nextPageToken;
        }

      } catch (err) {
        console.error(`❌ Stream poll error for ${googleDocId}:`, err.message);
      }
    }, 5000);

    res.json({
      message: `Stream engine successfully tracking "${docName}".`,
      googleDocId
    });

  } catch (error) {
    console.error('Error initializing stream tracker:', error.message);
    res.status(500).json({ error: 'Failed to establish tracking link.' });
  }
});


async function processDocumentCommit(docsInstance, docId) {
  try {
    const docContent = await docsInstance.documents.get({ documentId: docId });
    
    let fullText = '';
    const bodyElements = docContent.data.body.content;
    
    bodyElements.forEach(element => {
      if (element.paragraph) {
        element.paragraph.elements.forEach(el => {
          if (el.textRun) {
            fullText += el.textRun.content;
          }
        });
      }
    });

    const previousText = activeSyncJobs[docId].cachedText || "";
    
    
    if (fullText === previousText) return;

    console.log(`📄 Version Content Loaded (${fullText.length} characters).`);

    const diffs = dmp.diff_main(previousText, fullText);
    dmp.diff_cleanupEfficiency(diffs); 

    console.log(`📐 Computed Live Git Diffs:`);
    
    diffs.forEach(part => {
      const operation = part[0]; // 0 = Equal, 1 = Insert, -1 = Delete
      const text = part[1];

      if (operation === 1) {
        process.stdout.write(`\x1b[32m[+] "${text}"\x1b[0m `); // Green
      } else if (operation === -1) {
        process.stdout.write(`\x1b[31m[-] "${text}"\x1b[0m `); // Red
      }
    });
    console.log("\n-------------------------------------------");


    activeSyncJobs[docId].cachedText = fullText;

  } catch (error) {
    console.error('Failed to parse document text content or calculate diffs:', error.message);
  }
}

module.exports = router;