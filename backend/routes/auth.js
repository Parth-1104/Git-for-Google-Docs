
const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
require('dotenv').config();



const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * 🔗 ROUTE: GET /api/auth/google
 * PURPOSE: Generates the Google Login Link and sends it to the frontend
 */
router.get('/google', (req, res) => {
  // Define the exact permissions we configured in the Google Console
  const scopes = [
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes,
    prompt: 'consent' 
  });

  res.json({ url });
});

/**
 * 🔄 ROUTE: GET /api/auth/google/callback
 * PURPOSE: Google redirects here with an authorization code. We exchange it for access tokens.
 */
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authentication code missing.');
  }

  try {
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Tokens successfully retrieved from Google!');
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token); // Keep this safe!

    // TODO: In a production app, save tokens.refresh_token to your MongoDB user record.
    
    // For now, let's display a success message directly in the browser with the tokens
    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Your MERN backend is now authenticated with Google.</p>
      <p><strong>Copy your Refresh Token safely for the next step:</strong></p>
      <code>${tokens.refresh_token || 'Refresh token already granted previously. If blank, clear app permissions in Google Account and retry.'}</code>
    `);

  } catch (error) {
    console.error('Error during Google authentication callback:', error);
    res.status(500).send('Authentication failed.');
  }
});

module.exports = router;