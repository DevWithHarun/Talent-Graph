import nodemailer from 'nodemailer';
import { FIRESTORE_REST_BASE, FIREBASE_API_KEY } from '@/lib/server-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nzaiharun28@gmail.com';

function createTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Queues an email directly to Firebase Firestore `mail` collection (Firebase Trigger Email Extension schema)
 * via Firestore REST API. This works both on the server and in preview environments without needing SMTP credentials.
 */
export async function queueEmailInFirestore(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  ticketId?: string;
  ticketCode?: string;
  type?: string;
}): Promise<boolean> {
  try {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const validRecipients = recipients.filter(Boolean);
    if (!validRecipients.length) return false;

    const body = {
      fields: {
        to: { arrayValue: { values: validRecipients.map(e => ({ stringValue: e })) } },
        message: {
          mapValue: {
            fields: {
              subject: { stringValue: params.subject },
              html: { stringValue: params.html },
              text: { stringValue: params.text || params.subject },
            },
          },
        },
        recipient: { stringValue: validRecipients[0] },
        ticketId: params.ticketId ? { stringValue: params.ticketId } : { nullValue: null },
        ticketCode: params.ticketCode ? { stringValue: params.ticketCode } : { nullValue: null },
        type: { stringValue: params.type || 'email_notification' },
        status: { stringValue: 'queued' },
        createdAt: { stringValue: new Date().toISOString() },
      },
    };

    const res = await fetch(`${FIRESTORE_REST_BASE}/mail?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('[email] Firestore mail queue returned status', res.status);
      return false;
    }
    console.log('[email] Successfully queued email in Firebase /mail collection for', validRecipients.join(', '));
    return true;
  } catch (err) {
    console.warn('[email] Firestore mail queue failed (non-fatal):', err);
    return false;
  }
}

export interface TicketEmailPayload {
  ticketId: string;
  ticketCode?: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | string;
  tag?: string;
  category?: string;
  senderName: string;
  senderEmail: string;
  slaDeadline?: string;
  trackingUrl?: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: '🔴 HIGH — 1 h SLA',
  medium: '🟡 MEDIUM — 4 h SLA',
  low: '🟢 LOW — 24 h SLA',
};

export async function sendNewTicketNotification(payload: TicketEmailPayload): Promise<void> {
  const code = payload.ticketCode || (payload.ticketId.startsWith('TG-') ? payload.ticketId : `TG-${payload.ticketId.slice(0, 6).toUpperCase()}`);
  const priorityColor = PRIORITY_COLOR[payload.priority] ?? '#6B7280';
  const priorityLabel = PRIORITY_LABEL[payload.priority] ?? payload.priority;
  const deadline = payload.slaDeadline
    ? new Date(payload.slaDeadline).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
    : 'Within 4 hours';
  const categoryTag = payload.tag || payload.category || 'General Support';
  const baseUrl = process.env.APP_URL || 'https://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app';
  const trackingUrl = payload.trackingUrl || `${baseUrl}/?trackTicket=${code}`;

  // 1. User Ticket Confirmation & Live Tracking HTML Email Template
  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,-apple-system,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:100%;border:1px solid #334155;">

        <!-- Top Accent Bar -->
        <tr>
          <td style="background:linear-gradient(90deg, #4F46E5, #06B6D4);padding:6px 24px;">
            <p style="margin:0;font-size:11px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">
              Talent Graph Kenya · Client Support
            </p>
          </td>
        </tr>

        <!-- Ticket Reference Badge & Heading -->
        <tr>
          <td style="padding:28px 32px 16px;">
            <div style="display:inline-block;padding:6px 12px;background:#312E81;border:1px solid #4338CA;border-radius:8px;margin-bottom:14px;">
              <span style="font-size:13px;font-weight:800;color:#818CF8;font-family:monospace;">TICKET #${escHtml(code)}</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#F8FAFC;">We've received your support request!</h1>
            <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.5;">
              Hi <strong style="color:#F1F5F9;">${escHtml(payload.senderName || 'Valued User')}</strong>, your inquiry has been recorded and assigned to our support queue.
            </p>
          </td>
        </tr>

        <!-- Live Tracking Callout Card -->
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;border:1.5px solid #3B82F6;padding:20px;text-align:center;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#60A5FA;letter-spacing:1px;text-transform:uppercase;">Live Ticket Tracking</p>
                  <p style="margin:0 0 14px;font-size:16px;font-weight:800;color:#FFFFFF;">Track Progress & Superadmin Responses</p>
                  <p style="margin:0 0 18px;font-size:13px;color:#94A3B8;line-height:1.5;">
                    You do not need to wait in the dark. Click below to view live updates, see assignment status, and communicate directly with the Superadmin.
                  </p>
                  <a href="${trackingUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;font-size:14px;font-weight:800;text-decoration:none;padding:12px 30px;border-radius:10px;letter-spacing:0.5px;">
                    🔍 Track Your Ticket Live &rarr;
                  </a>
                  <p style="margin:12px 0 0;font-size:11px;color:#64748B;">
                    Direct tracking link: <a href="${trackingUrl}" style="color:#38BDF8;word-break:break-all;">${trackingUrl}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ticket Details Box -->
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155;">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Subject</p>
                  <p style="margin:0;font-size:15px;font-weight:800;color:#F8FAFC;">${escHtml(payload.subject)}</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #1E293B;padding:12px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%">
                        <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Category</p>
                        <p style="margin:0;font-size:13px;font-weight:700;color:#E2E8F0;text-transform:capitalize;">${escHtml(categoryTag)}</p>
                      </td>
                      <td width="50%">
                        <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Expected Response</p>
                        <p style="margin:0;font-size:13px;font-weight:700;color:#34D399;">${priorityLabel}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #1E293B;padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Your Message</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#CBD5E1;">${escHtml(payload.message).replace(/\n/g, '<br/>')}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Tracking Instructions -->
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#131C31;border-radius:10px;padding:14px 18px;border-left:4px solid #10B981;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#34D399;">💡 Tip: Tracking from the Website</p>
                  <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
                    You can also track your ticket anytime by opening the Support Assistant on our site, switching to <strong>"🔍 Track Case"</strong>, and entering your code <strong style="color:#F1F5F9;font-family:monospace;">${escHtml(code)}</strong>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Guarantee -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">
              🔔 As soon as our Superadmin or Support Agent responds, you will receive an automatic email notification at <strong>${escHtml(payload.senderEmail)}</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0F172A;padding:16px 32px;border-top:1px solid #1E293B;text-align:center;">
            <p style="margin:0;font-size:11px;color:#475569;">Talent Graph Kenya · Automated confirmation · Follow up live via the link above</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // 2. Admin Alert HTML Email Template
  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:${priorityColor};padding:4px 24px;">
            <p style="margin:0;font-size:12px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">
              ${priorityLabel} — Ticket #${escHtml(code)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#F8FAFC;">New Support Ticket</p>
            <p style="margin:0;font-size:13px;color:#94A3B8;">Talent Graph Kenya · Superadmin Support Queue</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155;">
              <tr>
                <td style="padding-bottom:14px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Subject</p>
                  <p style="margin:0;font-size:16px;font-weight:800;color:#F8FAFC;">${escHtml(payload.subject)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;border-top:1px solid #1E293B;padding-top:14px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Message</p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#CBD5E1;">${escHtml(payload.message).replace(/\n/g, '<br/>')}</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #1E293B;padding-top:14px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">User Info</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#E2E8F0;">${escHtml(payload.senderName)} (${escHtml(payload.senderEmail)})</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Category: ${escHtml(categoryTag)} | SLA Deadline: ${deadline}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <a href="${baseUrl}/admin/dashboard" style="display:inline-block;background:#4F46E5;color:#fff;font-size:13px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:10px;">
              Open Superadmin Dashboard →
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Always queue user confirmation email to Firebase Firestore `mail` collection
  if (payload.senderEmail && payload.senderEmail.includes('@')) {
    await queueEmailInFirestore({
      to: payload.senderEmail.trim(),
      subject: `[Received] Support Ticket #${code}: ${payload.subject}`,
      html: userHtml,
      text: `Hi ${payload.senderName},\n\nWe received your support ticket #${code}: "${payload.subject}".\n\nTrack your ticket live and view Superadmin responses here:\n${trackingUrl}\n\nTalent Graph Kenya Support`,
      ticketId: payload.ticketId,
      ticketCode: code,
      type: 'ticket_user_confirmation',
    }).catch(err => console.warn('[email] Failed queuing user confirmation to Firestore:', err));
  }

  // Always queue admin alert email to Firebase Firestore `mail` collection
  await queueEmailInFirestore({
    to: ADMIN_EMAIL,
    subject: `🔴 New Support Ticket #${code}: ${payload.subject}`,
    html: adminHtml,
    text: `New support ticket #${code} from ${payload.senderName} (${payload.senderEmail}):\n${payload.subject}\n\n${payload.message}`,
    ticketId: payload.ticketId,
    ticketCode: code,
    type: 'ticket_admin_alert',
  }).catch(err => console.warn('[email] Failed queuing admin alert to Firestore:', err));

  // If SMTP credentials are configured, send via nodemailer as well
  const transport = createTransport();
  if (transport) {
    try {
      if (payload.senderEmail && payload.senderEmail.includes('@')) {
        await transport.sendMail({
          from: `"Talent Graph Support" <${process.env.SMTP_USER || 'support@talentgraph.africa'}>`,
          to: payload.senderEmail.trim(),
          subject: `[Received] Support Ticket #${code}: ${payload.subject}`,
          html: userHtml,
        });
      }
      await transport.sendMail({
        from: `"Talent Graph Support" <${process.env.SMTP_USER || 'support@talentgraph.africa'}>`,
        to: ADMIN_EMAIL,
        subject: `🔴 New support ticket #${code}: ${payload.subject}`,
        html: adminHtml,
      });
      console.log('[email] SMTP emails sent successfully for ticket', code);
    } catch (smtpErr) {
      console.warn('[email] SMTP transport error (already queued in Firebase):', smtpErr);
    }
  } else {
    console.log('[email] SMTP not configured; ticket confirmation successfully queued in Firebase Firestore /mail for', payload.senderEmail);
  }
}

export interface TicketResolvedEmailPayload {
  ticketId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  csatBaseUrl: string;
}

export async function sendTicketResolvedNotification(payload: TicketResolvedEmailPayload): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    console.warn('[email] SMTP_USER / SMTP_PASS not set — skipping resolved notification');
    return;
  }

  const stars = [1, 2, 3, 4, 5];
  const starColors = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];
  const starLabels = ['Very bad', 'Bad', 'OK', 'Good', 'Excellent'];

  const starButtons = stars.map(n =>
    `<a href="${payload.csatBaseUrl}/api/support/csat?ticketId=${payload.ticketId}&rating=${n}"
        style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;font-size:22px;text-decoration:none;border-radius:10px;background:${starColors[n - 1]}18;border:1.5px solid ${starColors[n - 1]}44;margin:0 4px;"
        title="${starLabels[n - 1]}">
      ${'⭐'.repeat(1)}${n}
    </a>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#22C55E;padding:4px 24px;">
            <p style="margin:0;font-size:12px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">✅ Ticket Resolved</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#F8FAFC;">Your issue has been resolved</p>
            <p style="margin:0;font-size:13px;color:#94A3B8;">Talent Graph Kenya · Client Support</p>
          </td>
        </tr>

        <!-- Ticket info -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155;">
              <tr>
                <td>
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Ticket</p>
                  <p style="margin:0;font-size:15px;font-weight:800;color:#F8FAFC;">${escHtml(payload.subject)}</p>
                  <p style="margin:6px 0 0;font-size:12px;color:#64748B;">Hi ${escHtml(payload.senderName)}, your support request has been marked as resolved by our team. If you still need help, you can open a new ticket from your dashboard.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CSAT -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1E3A5F;border-radius:12px;padding:24px;border:1px solid #2563EB44;text-align:center;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#93C5FD;letter-spacing:1px;text-transform:uppercase;">How did we do?</p>
                  <p style="margin:0 0 16px;font-size:12px;color:#64748B;">Tap a number to rate your support experience</p>
                  <div style="white-space:nowrap;">
                    ${stars.map(n =>
                      `<a href="${payload.csatBaseUrl}/api/support/csat?ticketId=${payload.ticketId}&rating=${n}"
                          style="display:inline-block;width:46px;height:46px;line-height:46px;text-align:center;font-size:18px;font-weight:900;color:#fff;text-decoration:none;border-radius:10px;background:${starColors[n - 1]};margin:0 3px;"
                          title="${starLabels[n - 1]}">${n}</a>`
                    ).join('')}
                  </div>
                  <p style="margin:12px 0 0;font-size:10px;color:#475569;">1 = Very bad &nbsp;·&nbsp; 5 = Excellent</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0;font-size:11px;color:#475569;">Ticket ID: ${payload.ticketId}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0F172A;padding:16px 32px;border-top:1px solid #1E293B;">
            <p style="margin:0;font-size:11px;color:#475569;">Talent Graph Kenya · Automated notification · Do not reply to this email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"Talent Graph Support" <${process.env.SMTP_USER}>`,
    to: payload.senderEmail,
    subject: `✅ Resolved: ${payload.subject}`,
    html,
  });
}

export interface AgentReplyEmailPayload {
  ticketId: string;
  subject: string;
  replyBody: string;
  agentName: string;
  senderName: string;
  senderEmail: string;
}

export async function sendAgentReplyNotification(payload: AgentReplyEmailPayload): Promise<void> {
  const baseUrl = process.env.APP_URL || 'https://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app';
  const trackingUrl = `${baseUrl}/?trackTicket=${payload.ticketId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:#4F46E5;padding:4px 24px;">
            <p style="margin:0;font-size:12px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">Agent Reply</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#F8FAFC;">Support Update from Superadmin</p>
            <p style="margin:0;font-size:13px;color:#94A3B8;">Talent Graph Kenya · Client Support</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155;">
              <tr>
                <td style="padding-bottom:14px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Ticket</p>
                  <p style="margin:0;font-size:15px;font-weight:800;color:#F8FAFC;">${escHtml(payload.subject)}</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #1E293B;padding-top:14px;padding-bottom:14px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;">Reply from ${escHtml(payload.agentName)}</p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#CBD5E1;">${escHtml(payload.replyBody).replace(/\n/g, '<br/>')}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;text-align:center;">
            <a href="${trackingUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;font-size:13px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:10px;">
              View & Reply in Live Ticket Portal &rarr;
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748B;">Hi ${escHtml(payload.senderName)}, the support team has responded to your ticket.</p>
            <p style="margin:14px 0 0;font-size:11px;color:#475569;">Ticket ID: ${payload.ticketId}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0F172A;padding:16px 32px;border-top:1px solid #1E293B;">
            <p style="margin:0;font-size:11px;color:#475569;">Talent Graph Kenya · Automated notification · Do not reply to this email</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Always queue reply to Firebase Firestore `mail` collection
  if (payload.senderEmail && payload.senderEmail.includes('@')) {
    await queueEmailInFirestore({
      to: payload.senderEmail.trim(),
      subject: `Re: ${payload.subject}`,
      html,
      text: `Hi ${payload.senderName},\n\n${payload.agentName} replied to your support ticket:\n\n${payload.replyBody}\n\nView live updates here: ${trackingUrl}`,
      ticketId: payload.ticketId,
      type: 'agent_reply_notification',
    }).catch(err => console.warn('[email] Failed queuing reply email to Firestore:', err));
  }

  const transport = createTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from: `"Talent Graph Support" <${process.env.SMTP_USER || 'support@talentgraph.africa'}>`,
        to: [payload.senderEmail, ADMIN_EMAIL].filter(Boolean).join(', '),
        subject: `Re: ${payload.subject}`,
        html,
      });
    } catch (smtpErr) {
      console.warn('[email] SMTP reply error (queued in Firestore):', smtpErr);
    }
  }
}

export async function sendCampaignEmail(params: {
  to: string;
  firstName: string;
  role: string;
  subject: string;
  rawBody: string;
  campaignId: string;
  unsubscribeBaseUrl: string;
}): Promise<boolean> {
  const transport = createTransport();
  if (!transport) return false;

  try {
    const personalizedBody = params.rawBody
      .replace(/\{\{first_name\}\}/gi, escHtml(params.firstName))
      .replace(/\{\{role\}\}/gi, escHtml(params.role));

    const unsubscribeUrl = `${params.unsubscribeBaseUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(params.to)}&campaign=${params.campaignId}`;
    const personalizedSubject = params.subject
      .replace(/\{\{first_name\}\}/gi, params.firstName)
      .replace(/\{\{role\}\}/gi, params.role);

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,-apple-system,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:100%;">

        <tr>
          <td style="background:#4F46E5;padding:12px 32px;">
            <p style="margin:0;font-size:13px;font-weight:900;color:#fff;letter-spacing:1px;">TALENT GRAPH KENYA</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <div style="font-size:14px;line-height:1.7;color:#CBD5E1;white-space:pre-line;">${personalizedBody}</div>
          </td>
        </tr>

        <tr>
          <td style="background:#0F172A;padding:16px 32px;border-top:1px solid #1E293B;">
            <p style="margin:0;font-size:11px;color:#475569;">
              Talent Graph Kenya &nbsp;·&nbsp;
              <a href="${unsubscribeUrl}" style="color:#6366F1;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transport.sendMail({
      from: `"Talent Graph Kenya" <${process.env.SMTP_USER}>`,
      to: params.to,
      subject: personalizedSubject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[email] Campaign send error:', err);
    return false;
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
