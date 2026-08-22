import { Router } from 'express';
import { verifyBearerToken, verifyBearerOrInternal } from '../lib/server-auth';
import { sendSMS, sendSMSBatch, normalizePhone } from '../lib/bulksms';

const router = Router();

// POST /api/sms/send
router.post('/sms/send', async (req, res) => {
  const uid = await verifyBearerOrInternal(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const { to, message, batch } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (batch && Array.isArray(batch)) {
      const batchResult = await sendSMSBatch(batch, message);
      res.json({ success: batchResult.sent > 0, sent: batchResult.sent, failed: batchResult.failed });
      return;
    }

    if (!to) {
      res.status(400).json({ error: 'to or batch is required' });
      return;
    }

    const result = await sendSMS(to, message);
    res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

export default router;
