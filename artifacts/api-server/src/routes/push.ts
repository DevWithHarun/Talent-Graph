/**
 * Push notification route.
 * Requires: VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT env vars.
 * Install web-push: pnpm --filter @workspace/api-server add web-push
 */
import { Router } from 'express';
import { verifyBearerToken } from '../lib/server-auth';

const router = Router();

// POST /api/push/send
router.post('/push/send', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const VAPID_PUBLIC = process.env.VITE_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@talentgraph.ke';

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    res.status(503).json({ error: 'Push notifications not configured. Set VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' });
    return;
  }

  try {
    // Dynamically import web-push (optional dependency)
    let webpush: any;
    try {
      webpush = await import('web-push');
      webpush = webpush.default ?? webpush;
    } catch {
      res.status(503).json({ error: 'web-push package not installed. Run: pnpm --filter @workspace/api-server add web-push' });
      return;
    }

    const { subscriptions, title, body, url, tag } = req.body;
    if (!subscriptions?.length || !title || !body) {
      res.status(400).json({ error: 'subscriptions, title, body are required' });
      return;
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const payload = JSON.stringify({ title, body, url: url ?? '/', tag: tag ?? 'default' });
    const results = await Promise.allSettled(
      subscriptions.map((sub: any) => webpush.sendNotification(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    res.json({ success: sent > 0, sent, failed });
  } catch (err: any) {
    console.error('[push/send]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
