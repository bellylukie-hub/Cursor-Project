const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  requireAuth: process.env.REQUIRE_AUTH !== 'false',
  dataDir: process.env.DATA_DIR || path.join(__dirname, '../../data'),
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads')
};
