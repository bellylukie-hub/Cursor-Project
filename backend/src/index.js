const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { authenticate } = require('./middleware/auth');

const app = express();

const corsOptions = env.corsOrigin === '*'
  ? {}
  : { origin: env.corsOrigin.split(',').map(s => s.trim()), credentials: true };

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'truckcontrol-api',
    version: '1.0.0',
    environment: env.nodeEnv,
    requireAuth: env.requireAuth
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', authenticate, apiRoutes);

const frontendDir = path.join(__dirname, '../..');
app.use(express.static(frontendDir, {
  index: false,
  maxAge: env.nodeEnv === 'production' ? '1h' : 0
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: env.nodeEnv === 'production' ? 'Internal server error' : err.message });
});

app.listen(env.port, () => {
  console.log(`TruckControl ${env.nodeEnv} server on http://localhost:${env.port}`);
  console.log(`  API:  http://localhost:${env.port}/api/health`);
  console.log(`  UI:   http://localhost:${env.port}/`);
  console.log(`  Auth: ${env.requireAuth ? 'REQUIRED (production)' : 'optional (dev headers allowed)'}`);
});
