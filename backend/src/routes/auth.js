const express = require('express');
const { login, formatUserSession, getUserById } = require('../services/authService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const result = login(username, password, req.ip);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, (_req, res) => {
  res.json({ ok: true, message: 'Logged out. Discard client token.' });
});

module.exports = router;
