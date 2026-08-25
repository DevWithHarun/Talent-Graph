const BULKSMS_ENDPOINT = 'https://api.bulksms.com/v1/messages';

function getAuth(): string {
  const username = process.env.BULKSMS_USERNAME;
  const password = process.env.BULKSMS_PASSWORD;
  if (!username || !password) {
    throw new Error('BulkSMS credentials not configured. Set BULKSMS_USERNAME and BULKSMS_PASSWORD.');
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export function normalizePhone(phone: string): string {
  const clean = phone.replace(/[\s\-().]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return `+${clean.slice(2)}`;
  if (clean.startsWith('0') && clean.length === 10) return `+254${clean.slice(1)}`;
  if (clean.length === 9 && !clean.startsWith('0')) return `+254${clean}`;
  return `+${clean}`;
}

export interface SMSRecipient { phone: string; name: string; }
export interface SMSResult { sent: number; failed: number; total: number; error?: string; }

export async function sendBulkSMS(recipients: SMSRecipient[], body: string): Promise<SMSResult> {
  const valid = recipients.filter(r => r.phone?.trim());
  if (!valid.length) return { sent: 0, failed: recipients.length, total: recipients.length };

  const sender = process.env.BULKSMS_SENDER_ID || 'TalentGraph';
  const payload = valid.map(r => ({
    to: normalizePhone(r.phone),
    body,
    from: sender,
    encoding: 'UNICODE',
  }));

  const response = await fetch(BULKSMS_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: getAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = JSON.stringify(err);
    console.error('[BulkSMS] error:', msg);
    return { sent: 0, failed: valid.length, total: valid.length, error: msg };
  }

  const results = await response.json() as any;
  let sent = 0, failed = 0;
  for (const r of results) {
    if (['ACCEPTED', 'SCHEDULED', 'SENT'].includes(r.status?.type)) sent++;
    else failed++;
  }
  return { sent, failed, total: valid.length };
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendBulkSMS([{ phone: to, name: '' }], message);
    return { success: result.sent > 0, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendSMSBatch(
  recipients: { phone: string; name: string }[],
  message: string
): Promise<SMSResult> {
  return sendBulkSMS(recipients, message);
}
