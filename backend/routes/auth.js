// routes/auth.js
const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

// 🔌 IMPORT YOUR MODELS
const User = require('../models/user.js'); // Ensure this matches your models filename exactly (case-sensitive on Mac/Linux)

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * 🔗 ROUTE: GET /api/auth/google
 * PURPOSE: Generates the Google Login Link and sends it to the frontend
 * UPDATES: Added 'openid', 'profile', and 'email' scopes to extract user profile data.
 */
router.get('/google', (req, res) => {
  const scopes = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes,
    prompt: 'consent' // Forces Google to send the refresh_token every time for safety
  });

  res.json({ url });
});

/**
 * 🔄 ROUTE: GET /api/auth/google/callback
 * PURPOSE: Google redirects here with an authorization code. 
 * We exchange it for tokens, sync the User in MongoDB, and issue a platform session JWT.
 */
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authentication code missing.');
  }

  try {
    // 1. Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('✅ Tokens successfully retrieved from Google!');

    // 2. Fetch user profile details using the authenticated client
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const { id: googleId, email, name, picture } = userInfoResponse.data;

    // 3. Sync User profile info in MongoDB Atlas
    let user = await User.findOne({ googleId });
    
    if (!user) {
      console.log(`🆕 Creating fresh system registration footprint for: ${email}`);
      user = new User({
        googleId,
        email,
        displayName: name,
        avatarUrl: picture,
        googleRefreshToken: tokens.refresh_token // Store it safely for background doc-fetches
      });
      await user.save();
    } else if (tokens.refresh_token) {
      // If the user already existed but re-authenticated, update their refresh token if sent
      user.googleRefreshToken = tokens.refresh_token;
      await user.save();
    }

    // 4. Issue a 7-day JWT access token for your React frontend session state
    // routes/auth.js (Inside your Google callback)
const sessionToken = jwt.sign(
  { 
    id: user._id,       // ✅ Explicitly pass both formats to prevent 
    userId: user._id,   //    property matching failures downstream
    email: user.email 
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

    // 5. Cleanly redirect back to your React Frontend App
    // We append the session token and basic info as query params so React can grab it
    const FRONTEND_DASHBOARD_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    
    // ✅ Redirects straight to http://localhost:5173/dashboard?token=...
return res.redirect(`${FRONTEND_DASHBOARD_URL}/dashboard?token=${sessionToken}&name=${encodeURIComponent(user.displayName)}&avatar=${encodeURIComponent(user.avatarUrl)}`);

  } catch (error) {
    console.error('❌ Google authentication callback crashed:', error);
    
    // Send the actual systemic error text back to the browser so we can read it instantly
    return res.status(500).send(`
      <h1>Authentication Failed</h1>
      <p><strong>System Error Details:</strong></p>
      <pre style="background: #1a1a1a; color: #ff6b6b; padding: 15px; border-radius: 8px; font-family: monospace; overflow-x: auto;">${error.stack || error.message}</pre>
    `);
  }
}); // 💡 FIXED: Re-added this missing closing callback function brace block!

module.exports = router;