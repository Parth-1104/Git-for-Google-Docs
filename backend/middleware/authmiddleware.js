// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * 🔒 MIDDLEWARE: protect
 * PURPOSE: Intercepts incoming requests, validates the Bearer JWT token from React,
 * and attaches the authenticated user's ID directly to the request context object.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for the token inside the incoming HTTP Authorization header string matrix
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split "Bearer <token>" to extract the raw string signature
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token integrity using your signature secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Inject the authenticated identity parameters straight into the Express lifecycle request pipeline
      req.user = { id: decoded.userId, email: decoded.email };

      // Pass control forward onto your route controllers smoothly
      return next();
    } catch (error) {
      console.error('JWT Session Validation Failed:', error.message);
      return res.status(401).json({ error: 'Session expired or unverified signature. Please re-authenticate.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Missing validation token headers.' });
  }
};

module.exports = { protect };