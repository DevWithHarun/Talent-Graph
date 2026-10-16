import { NextRequest } from 'next/server';
import { verifyBearerToken, FIREBASE_API_KEY, FIRESTORE_REST_BASE } from '@/lib/server-auth';
import { sendNewTicketNotification } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

const FIRESTORE_BASE = FIRESTORE_REST_BASE;
const FIRESTORE_KEY = `key=${FIREBASE_API_KEY}`;

function docToTicket(doc: any) {
  const f = doc.fields || {};
  const id = doc.name?.split('/').pop();
  const str = (k: string) => f[k]?.stringValue ?? null;
  const bool = (k: string) => f[k]?.booleanValue ?? false;
  const arr = (k: string) => f[k]?.arrayValue?.values?.map((v: any) => v.stringValue) ?? [];
  const ts = (k: string) => f[k]?.timestampValue ?? f[k]?.stringValue ?? null;
  return {
    id,
    senderUserId: str('senderUserId'),
    senderEmail: str('senderEmail') ?? '',
    senderName: str('senderName') ?? '',
    source: str('source') ?? 'in_app',
    subject: str('subject') ?? '',
    status: str('status') ?? 'open',
    priority: str('priority') ?? 'medium',
    tags: arr('tags'),
    assignedAgentId: str('assignedAgentId'),
    slaDeadline: ts('slaDeadline') ?? '',
    csatRating: str('csatRating'),
    accountProvisioned: bool('accountProvisioned'),
    provisionedUserId: str('provisionedUserId'),
    lastMessage: str('lastMessage'),
    createdAt: ts('createdAt') ?? '',
    updatedAt: ts('updatedAt') ?? '',
  };
}

export async function GET(req: NextRequest) {
  const uid = await verifyBearerToken(req);
  if (!uid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const status = params.get('status');
  const priority = params.get('priority');

  try {
    const url = `${FIRESTORE_BASE}/support_tickets?${FIRESTORE_KEY}&orderBy=updatedAt desc&pageSize=50`;
    const res = await fetch(url);
    const data = await res.json();
    let tickets = (data.documents || []).map(docToTicket);
    if (status && status !== 'all') tickets = tickets.filter((t: any) => t.status === status);
    if (priority && priority !== 'all') tickets = tickets.filter((t: any) => t.priority === priority);
    return Response.json({ tickets });
  } catch (err: any) {
    console.error('[support/tickets] GET failed', err);
    return Response.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Allow guest (no-login) ticket creation — auth is optional
  const uid = await verifyBearerToken(req);

  const body = await req.json();
  const {
    senderEmail,
    senderName,
    subject,
    message,
    priority = 'medium',
    tag,
    category,
    source = 'in_app',
    userRole,
    senderPhone,
    attachmentName,
  } = body;

  const effectiveTag = tag || category || 'technical';

  if (!senderEmail || !subject || !message) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Basic email format check for guest abuse protection
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const slaHours = priority === 'high' ? 1 : priority === 'medium' ? 4 : 24;
  const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
  const ticketCode = `TG-${Math.floor(10000 + Math.random() * 90000)}`;

  const ticketData: any = {
    fields: {
      ticketCode: { stringValue: ticketCode },
      senderUserId: uid ? { stringValue: uid } : { stringValue: 'anonymous' },
      senderEmail: { stringValue: senderEmail },
      senderName: { stringValue: senderName || senderEmail },
      source: { stringValue: uid ? source : 'public_guest' },
      subject: { stringValue: subject },
      status: { stringValue: 'open' },
      priority: { stringValue: priority },
      tags: { arrayValue: { values: [{ stringValue: effectiveTag }] } },
      assignedAgentId: { nullValue: null },
      slaDeadline: { stringValue: slaDeadline },
      csatRating: { nullValue: null },
      accountProvisioned: { booleanValue: false },
      provisionedUserId: { nullValue: null },
      lastMessage: { stringValue: message.slice(0, 100) },
      createdAt: { stringValue: now },
      updatedAt: { stringValue: now },
      isAnonymous: { booleanValue: !uid },
    },
  };
  if (userRole) ticketData.fields.userRole = { stringValue: String(userRole) };
  if (senderPhone) ticketData.fields.senderPhone = { stringValue: String(senderPhone) };
  if (attachmentName) ticketData.fields.attachmentName = { stringValue: String(attachmentName) };

  let ticketRes: Response;
  try {
    ticketRes = await fetch(`${FIRESTORE_BASE}/support_tickets?${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });
  } catch (err: any) {
    console.error('[support/tickets] Firestore create network error', err);
    return Response.json({ error: 'Network error creating ticket' }, { status: 500 });
  }

  if (!ticketRes.ok) {
    const errText = await ticketRes.text().catch(() => '');
    console.error('[support/tickets] Firestore create failed', ticketRes.status, errText);
    return Response.json({ error: `Failed to create ticket (${ticketRes.status})`, details: errText.slice(0, 500) }, { status: 500 });
  }
  const ticket = await ticketRes.json();
  const ticketId = ticket.name?.split('/').pop();

  try {
    await fetch(`${FIRESTORE_BASE}/support_tickets/${ticketId}/messages?${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          senderType: { stringValue: 'user' },
          senderName: { stringValue: senderName || senderEmail },
          body: { stringValue: message },
          sentVia: { stringValue: source },
          sentAt: { stringValue: now },
        },
      }),
    });
  } catch (err) {
    console.error('[support/tickets] message create failed (non-fatal)', err);
  }

  // Send confirmation & tracking email to user + alert to admin (fire-and-forget — never blocks the response)
  sendNewTicketNotification({
    ticketId,
    ticketCode,
    subject,
    message,
    priority,
    tag: effectiveTag,
    senderName: senderName || senderEmail,
    senderEmail,
    slaDeadline,
  }).catch(err => console.error('[email] Failed to send ticket notification:', err));

  // SMS follow-up if phone provided (fire-and-forget, uses BulkSMS wired API)
  if (senderPhone?.trim()) {
    const ref = `#${ticketCode}`;
    const smsBody = `Hi ${senderName || 'there'}, your Talent Graph support ticket ${ref} "${subject.slice(0, 40)}" is received. We'll reply within ${slaHours}h. Follow up via email ${senderEmail} or call +254727946012.`;
    sendSMS(senderPhone.trim(), smsBody).then(r => {
      if (!r.success) console.warn('[sms] ticket creation SMS failed', r.error);
      else console.log('[sms] ticket creation SMS sent to', senderPhone);
    }).catch(err => console.error('[sms] ticket creation SMS error', err));
  }

  return Response.json({ success: true, ticketId, ticketCode });
}
