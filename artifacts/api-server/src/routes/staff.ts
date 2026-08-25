import { Router } from 'express';
import { randomInt } from 'crypto';
import { verifyBearerToken, verifyIdToken, FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from '../lib/server-auth';

const router = Router();

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#!';
  const all = upper + lower + digits;
  const pick = (charset: string) => charset[randomInt(charset.length)];
  const required = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(special)];
  const extra: string[] = [];
  for (let i = 0; i < 5; i++) extra.push(pick(all));
  const chars = [...required, ...extra];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function toFSValue(val: unknown): unknown {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { integerValue: String(val) };
  if (val === null || val === undefined) return { nullValue: null };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFSValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) fields[k] = toFSValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function firestorePatch(collection: string, id: string, data: Record<string, unknown>, token: string) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFSValue(v);
  const url = `${FIRESTORE_BASE}/${collection}/${id}?key=${FIREBASE_API_KEY}`;
  return fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  });
}

async function firestorePost(collection: string, data: Record<string, unknown>, token: string) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFSValue(v);
  return fetch(`${FIRESTORE_BASE}/${collection}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  });
}

// POST /api/staff/create
router.post('/staff/create', async (req, res) => {
  const adminUid = await verifyBearerToken(req.headers.authorization);
  if (!adminUid) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const { email, displayName, role, clubId, clubName, phone } = req.body;
    if (!email || !displayName || !role || !clubId || !clubName) {
      res.status(400).json({ error: 'email, displayName, role, clubId, clubName are required' });
      return;
    }

    const adminIdToken = req.headers.authorization!.slice(7);

    const tempPassword = generateTempPassword();
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: tempPassword, displayName, returnSecureToken: true }),
      }
    );
    const signUpData = await signUpRes.json() as any;
    if (!signUpRes.ok) {
      const msg = signUpData?.error?.message || 'Failed to create account';
      if (msg === 'EMAIL_EXISTS') { res.status(409).json({ error: 'An account with this email already exists.' }); return; }
      res.status(400).json({ error: msg });
      return;
    }

    const newUid: string = signUpData.localId;
    const newUserIdToken: string = signUpData.idToken;
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] ?? displayName;
    const lastName = nameParts.slice(1).join(' ') || '';
    const now = new Date().toISOString();
    const userRole = role === 'analyst' ? 'analyst' : role === 'scout' ? 'scout' : 'coach';

    await firestorePatch('users', newUid, { id: newUid, email, firstName, lastName, creationTimestamp: now, isEmailVerified: true, role: userRole, profileCompleted: true, onboardingStep: 'complete', displayName, phone: phone ?? '', createdByAdmin: adminUid, updatedAt: now }, newUserIdToken);
    await firestorePost('club_members', { userId: newUid, clubId, clubName, role, status: 'active', displayName, firstName, lastName, joinedAt: now, invitedAt: now, invitedBy: adminUid, createdAt: now }, adminIdToken);

    res.json({ success: true, uid: newUid, email, displayName, role, tempPassword, message: `Account created. Share these credentials securely with ${displayName}.` });
  } catch (err: any) {
    console.error('[staff/create]', err?.message ?? err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
