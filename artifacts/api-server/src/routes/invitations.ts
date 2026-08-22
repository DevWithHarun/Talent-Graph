import { Router } from 'express';
import { verifyBearerToken } from '../lib/server-auth';
import { sendSMS } from '../lib/bulksms';

const router = Router();

// POST /api/invitations/send — sends an SMS invitation
router.post('/invitations/send', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const { phone, playerName, teamName, position, senderName, message, inviteUrl } = req.body;

    if (!phone || !playerName || !teamName) {
      res.status(400).json({ error: 'phone, playerName, teamName are required' });
      return;
    }

    const smsBody = [
      `Talent Graph Invitation ⚽`,
      `Hi ${playerName}!`,
      `You have been invited to join ${teamName}.`,
      position ? `Position: ${position}` : null,
      `From: ${senderName || 'A scout'}`,
      message?.trim() ? message.trim() : null,
      inviteUrl ? `View invite: ${inviteUrl}` : null,
      `Reply STOP to opt out.`,
    ].filter(Boolean).join('\n');

    const result = await sendSMS(phone, smsBody);
    res.json({
      success: result.success,
      smsStatus: result.success ? 'sent' : 'failed',
      error: result.error,
    });
  } catch (err: any) {
    console.error('[invitations/send]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
