import { Router } from 'express';
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from '../lib/server-auth';

const router = Router();

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'name, email, and message are required' });
      return;
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      res.status(400).json({ error: 'Invalid input types' });
      return;
    }
    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      res.status(400).json({ error: 'Input too long' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const docBody = {
      fields: {
        name: { stringValue: name.trim() },
        email: { stringValue: email.trim().toLowerCase() },
        message: { stringValue: message.trim() },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'new' },
      },
    };

    const firestoreRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/contact_inquiries?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docBody),
      }
    );

    if (!firestoreRes.ok) {
      const err = await firestoreRes.json().catch(() => ({}));
      console.error('[contact] Firestore error:', (err as any)?.error?.message);
      res.status(500).json({ error: 'Failed to submit. Please try again.' });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[contact] Error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

export default router;
