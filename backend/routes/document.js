
const express = require('express');
const { google } = require('googleapis');
const diffMatchPatch = require('diff-match-patch');
require('dotenv').config();

const {protect}=require('../middleware/authmiddleware.js')

const router = express.Router();
const dmp = new diffMatchPatch();

const User=require('../models/user.js')
const Repository=require('../models/repository.js')

const activeSyncJobs = {};

/**
 * ROUTE: POST /api/document/track
 * PURPOSE: "git init" using Google's live Changes Stream
 */
router.post('/track', protect, async (req, res) => {
  const { googleDocId } = req.body;

  if (!googleDocId) {
    return res.status(400).json({ error: 'Missing googleDocId parameter vector.' });
  }

  try {
    // 🔑 1. Identify the exact logged-in user from the auth middleware
    const userId = req.user.userId || req.user.id || req.user._id;
    const dbUser = await User.findById(userId);
    
    if (!dbUser || !dbUser.googleRefreshToken) {
      return res.status(401).json({ 
        error: 'Google background access permissions missing. Please sign out and sign back in to renew your grant.' 
      });
    }

    const refreshToken = dbUser.googleRefreshToken;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    console.log(`\n🔍 Initializing stream tracking for Doc ID: ${googleDocId} by user: ${dbUser.name || userId}`);
    
    const fileMetadata = await drive.files.get({ fileId: googleDocId, fields: 'name' });
    const docName = fileMetadata.data.name || 'Untitled Document';

    // 💾 2. PERSIST OR UPDATE REPOSITORY IN MONGODB LINKED TO THIS SPECIFIC USER
    let repository = await Repository.findOne({ owner: userId, googleDocId });
    
    if (!repository) {
      repository = new Repository({
        owner: userId,           // 👈 Binds this document strictly to the logged-in user!
        googleDocId,
        docName,
        refreshToken: 'GOOGLE_DRIVE_STREAM_AGENT',
        currentVersionIndex: 1
      });
      await repository.save();
      console.log(`📂 Created new Repository record for user ${userId}`);
    } else {
      // Update docName if it changed
      repository.docName = docName;
      await repository.save();
    }

    if (activeSyncJobs[googleDocId]) {
      return res.json({ message: 'Document is already being actively tracked.', repository });
    }

    const tokenResponse = await drive.changes.getStartPageToken({});
    let lastSavedPageToken = tokenResponse.data.startPageToken;

    activeSyncJobs[googleDocId] = { cachedText: "" };

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
          await processDocumentCommit(docs, googleDocId, repository._id);
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

    return res.json({
      message: `Stream engine successfully tracking "${docName}".`,
      googleDocId,
      repositoryId: repository._id
    });

  } catch (error) {
    console.error('Error initializing stream tracker:', error.message);
    return res.status(500).json({ error: `Failed to establish tracking link: ${error.message}` });
  }
});

async function processDocumentCommit(docsInstance, docId, repositoryId) {
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

    const diffs = dmp.diff_main(previousText, fullText);
    dmp.diff_cleanupEfficiency(diffs); 

    // Optional: Increment version index on repository schema upon successful commit
    await Repository.findByIdAndUpdate(repositoryId, { $inc: { currentVersionIndex: 1 } });

    activeSyncJobs[docId].cachedText = fullText;
    console.log(`✅ [Sync Success] Repository updated for version commit.`);

  } catch (error) {
    console.error('Failed to parse document text content or calculate diffs:', error.message);
  }
}

module.exports = router;