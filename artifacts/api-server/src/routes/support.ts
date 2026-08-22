import { Router } from 'express';
import { verifyBearerToken, FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from '../lib/server-auth';

const router = Router();

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val: unknown): unknown {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { integerValue: String(val) };
  if (val === null || val === undefined) return { nullValue: null };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// GET /api/support/tickets
router.get('/support/tickets', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const status = req.query.status as string | undefined;
    let url = `${FIRESTORE_BASE}/support_tickets?key=${FIREBASE_API_KEY}&pageSize=50&orderBy=createdAt%20desc`;
    const firestoreRes = await fetch(url);
    if (!firestoreRes.ok) { res.status(firestoreRes.status).json({ error: 'Failed to fetch tickets' }); return; }
    const data = await firestoreRes.json();
    const tickets = (data.documents ?? []).map((doc: any) => {
      const f = doc.fields || {};
      const str = (k: string) => f[k]?.stringValue ?? null;
      const bool = (k: string) => f[k]?.booleanValue ?? false;
      const arr = (k: string) => f[k]?.arrayValue?.values?.map((v: any) => v.stringValue) ?? [];
      return {
        id: doc.name?.split('/').pop(),
        senderUserId: str('senderUserId'),
        senderEmail: str('senderEmail') ?? '',
        senderName: str('senderName') ?? '',
        subject: str('subject') ?? '',
        status: str('status') ?? 'open',
        priority: str('priority') ?? 'medium',
        tags: arr('tags'),
        lastMessage: str('lastMessage'),
        createdAt: str('createdAt') ?? '',
      };
    });
    const filtered = status ? tickets.filter((t: any) => t.status === status) : tickets;
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/support/tickets
router.post('/support/tickets', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const { subject, message, priority = 'medium', source = 'in_app' } = req.body;
    if (!subject || !message) { res.status(400).json({ error: 'subject and message are required' }); return; }

    const now = new Date().toISOString();
    const slaHours: Record<string, number> = { high: 1, medium: 4, low: 24 };
    const slaDeadline = new Date(Date.now() + (slaHours[priority] ?? 4) * 3600 * 1000).toISOString();

    const docBody = {
      fields: {
        senderUserId: { stringValue: uid },
        subject: { stringValue: subject },
        lastMessage: { stringValue: message },
        priority: { stringValue: priority },
        status: { stringValue: 'open' },
        source: { stringValue: source },
        slaDeadline: { stringValue: slaDeadline },
        createdAt: { stringValue: now },
        updatedAt: { stringValue: now },
      },
    };

    const firestoreRes = await fetch(
      `${FIRESTORE_BASE}/support_tickets?key=${FIREBASE_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docBody) }
    );
    if (!firestoreRes.ok) { res.status(500).json({ error: 'Failed to create ticket' }); return; }
    const doc = await firestoreRes.json();
    res.json({ success: true, ticketId: doc.name?.split('/').pop() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
