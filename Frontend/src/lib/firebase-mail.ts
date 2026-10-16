import { collection, addDoc, Firestore } from 'firebase/firestore';

export interface TicketConfirmationEmailParams {
  ticketId: string;
  ticketCode?: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  trackingUrl?: string;
}

export function generateUserTicketEmailHtml(params: TicketConfirmationEmailParams): string {
  const code = params.ticketCode || (params.ticketId.startsWith('TG-') ? params.ticketId : `TG-${params.ticketId.slice(0, 6).toUpperCase()}`);
  const priority = params.priority?.toLowerCase() || 'medium';
  const slaText = priority === 'high' ? 'Within 1 hour (Urgent Priority)' : priority === 'low' ? 'Within 24 hours' : 'Within 4 hours';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app';
  const trackingUrl = params.trackingUrl || `${baseUrl}/?trackTicket=${code}`;

  const esc = (str?: string) => (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Support Ticket Received - #${code}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1E293B;border-radius:18px;overflow:hidden;max-width:100%;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5);border:1px solid #334155;">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="background:linear-gradient(90deg, #4F46E5, #06B6D4);padding:6px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:800;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase;">Talent Graph Kenya · Client Support</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;font-weight:700;color:#E0E7FF;background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:12px;">Ticket Received</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Header -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <div style="display:inline-block;padding:8px 12px;background:#312E81;border:1px solid #4338CA;border-radius:10px;margin-bottom:16px;">
                <span style="font-size:13px;font-weight:800;color:#818CF8;font-family:monospace;">REFERENCE CODE: #${esc(code)}</span>
              </div>
              <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#F8FAFC;line-height:1.3;">
                We've received your support request!
              </h1>
              <p style="margin:0;font-size:15px;color:#94A3B8;line-height:1.5;">
                Hi <strong style="color:#F1F5F9;">${esc(params.senderName || 'Valued User')}</strong>, your inquiry has been logged into our support queue. Our Superadmin and support team are already on it.
              </p>
            </td>
          </tr>

          <!-- Live Tracking Callout Card -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:14px;border:1px solid #3B82F6;padding:24px;text-align:center;">
                <tr>
                  <td>
                    <div style="font-size:12px;font-weight:800;color:#60A5FA;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Live Ticket Tracking</div>
                    <div style="font-size:18px;font-weight:800;color:#FFFFFF;margin-bottom:12px;">Track Your Case & View Superadmin Responses</div>
                    <p style="margin:0 0 18px;font-size:13px;color:#94A3B8;line-height:1.5;">
                      You do not have to wait in the dark. Click below to view live updates, see assignment status, and communicate directly with the Superadmin.
                    </p>
                    <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#2563EB);color:#FFFFFF;font-size:14px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(37,99,235,0.4);letter-spacing:0.5px;">
                      🔍 Track Your Ticket Live &rarr;
                    </a>
                    <div style="margin-top:12px;font-size:11px;color:#64748B;">
                      Direct link: <a href="${trackingUrl}" style="color:#38BDF8;word-break:break-all;">${trackingUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ticket Summary Details Box -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155;">
                <tr>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">Subject</p>
                    <p style="margin:0;font-size:15px;font-weight:800;color:#F1F5F9;">${esc(params.subject)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #1E293B;padding:12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">Category</p>
                          <p style="margin:0;font-size:13px;font-weight:700;color:#E2E8F0;">${esc(params.category || 'General Support')}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">Expected Response SLA</p>
                          <p style="margin:0;font-size:13px;font-weight:700;color:#34D399;">${slaText}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #1E293B;padding-top:14px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">Your Message</p>
                    <div style="background:#1E293B;padding:12px 14px;border-radius:8px;font-size:13px;line-height:1.6;color:#CBD5E1;border:1px solid #334155;">
                      ${esc(params.message).replace(/\n/g, '<br/>')}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- How to Track in Website -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#131C31;border-radius:10px;padding:14px 18px;border-left:4px solid #10B981;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#34D399;">💡 Tracking Without the Link?</p>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
                      Visit <a href="${baseUrl}" style="color:#38BDF8;text-decoration:none;">talentgraph.africa</a>, open the Support Assistant, switch to the <strong>"🔍 Track Case"</strong> tab, and enter your reference code <strong style="color:#F1F5F9;font-family:monospace;">${esc(code)}</strong> or your email <strong style="color:#F1F5F9;">${esc(params.senderEmail)}</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps & Guarantee -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">
                🔔 <strong>What happens next:</strong> As soon as our Superadmin or technical support team posts a reply to your case, you will automatically receive another email notification with the full response.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;padding:20px 32px;border-top:1px solid #1E293B;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#94A3B8;">Talent Graph Kenya</p>
              <p style="margin:0;font-size:11px;color:#475569;">
                Nairobi, Kenya · Automated Support Notification · You can follow up via email or through the live tracking portal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Queues ticket confirmation and tracking emails directly to Firebase Firestore
 * `mail` collection (Firebase Trigger Email extension schema) and alerts admin.
 */
export async function queueTicketConfirmationEmailFirebase(
  firestore: Firestore | null,
  params: TicketConfirmationEmailParams
): Promise<boolean> {
  if (!firestore) return false;
  try {
    const code = params.ticketCode || (params.ticketId.startsWith('TG-') ? params.ticketId : `TG-${params.ticketId.slice(0, 6).toUpperCase()}`);
    const userHtml = generateUserTicketEmailHtml({ ...params, ticketCode: code });
    const userText = `Hi ${params.senderName},\n\nWe received your support ticket #${code}: "${params.subject}".\n\nYou can track live updates and Superadmin replies anytime here:\n${params.trackingUrl || `https://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app/?trackTicket=${code}`}\n\nOur team will respond shortly.\nTalent Graph Kenya Support`;

    // 1. Queue email to the USER who created the ticket
    if (params.senderEmail && params.senderEmail.includes('@')) {
      await addDoc(collection(firestore, 'mail'), {
        to: [params.senderEmail.trim()],
        message: {
          subject: `[Received] Support Ticket #${code}: ${params.subject}`,
          text: userText,
          html: userHtml,
        },
        template: {
          name: 'ticket_creation_receipt',
          data: {
            ticketId: params.ticketId,
            ticketCode: code,
            senderName: params.senderName,
            subject: params.subject,
          },
        },
        ticketId: params.ticketId,
        ticketCode: code,
        type: 'ticket_user_confirmation',
        recipient: params.senderEmail.trim(),
        createdAt: new Date().toISOString(),
        status: 'queued',
      });
    }

    // 2. Queue alert to ADMIN (nzaiharun28@gmail.com)
    await addDoc(collection(firestore, 'mail'), {
      to: ['nzaiharun28@gmail.com'],
      message: {
        subject: `🔴 New Support Ticket #${code}: ${params.subject}`,
        text: `New support ticket #${code} created by ${params.senderName} (${params.senderEmail}):\n\nSubject: ${params.subject}\nMessage: ${params.message}\nCategory: ${params.category || 'General'}\nPriority: ${params.priority || 'medium'}\n\nReview in Superadmin dashboard:\nhttps://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app/admin/dashboard`,
        html: `<div style="font-family:sans-serif;padding:20px;background:#0F172A;color:#E2E8F0;border-radius:12px;">
          <h2 style="color:#EF4444;margin-top:0;">🔴 New Support Ticket #${code}</h2>
          <p><strong>From:</strong> ${params.senderName} (${params.senderEmail})</p>
          <p><strong>Subject:</strong> ${params.subject}</p>
          <p><strong>Category:</strong> ${params.category || 'General'} | <strong>Priority:</strong> ${params.priority || 'medium'}</p>
          <div style="background:#1E293B;padding:12px;border-radius:8px;margin:12px 0;">${params.message}</div>
          <p><a href="https://ais-dev-ighnw42ezqwtuwpkndursr-424356778833.europe-west2.run.app/admin/dashboard" style="background:#4F46E5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Open Superadmin Dashboard &rarr;</a></p>
        </div>`,
      },
      ticketId: params.ticketId,
      ticketCode: code,
      type: 'ticket_admin_alert',
      recipient: 'nzaiharun28@gmail.com',
      createdAt: new Date().toISOString(),
      status: 'queued',
    });

    return true;
  } catch (err) {
    console.warn('[firebase-mail] Client mail queue failed (non-fatal):', err);
    return false;
  }
}
