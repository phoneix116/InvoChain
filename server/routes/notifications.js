const express = require('express');
const router = express.Router();
const notifications = require('../services/notifications');

// Simple guard using env flag
const ENABLE_TEST_ENDPOINT = (process.env.NOTIFICATIONS_TEST_ENABLED || '').toLowerCase() === 'true';

// POST /api/notifications/test - send a test email (requires NOTIFICATIONS_TEST_ENABLED=true)
router.post('/test', async (req, res) => {
  try {
    if (!ENABLE_TEST_ENDPOINT) return res.status(403).json({ error: 'Disabled' });
    if (!notifications.ENABLED) return res.status(503).json({ error: 'Email not configured' });

    const { to, subject, html } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });

    const result = await notifications.sendGenericEmail({ to, subject, html: html || '<p>Test email from Invoice Chain.</p>' });
    res.json({ success: true, provider: notifications.provider, result: result.ok ? 'sent' : (result.disabled ? 'disabled' : 'error'), details: result.ok ? undefined : result.error?.message });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send test email', message: e.message });
  }
});

module.exports = router;
