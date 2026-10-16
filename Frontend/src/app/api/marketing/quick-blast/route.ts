import { NextRequest, NextResponse } from 'next/server';
import { sendCampaignEmail } from '@/lib/email';
import { FIRESTORE_REST_BASE } from '@/lib/server-auth';

const FIRESTORE_BASE = FIRESTORE_REST_BASE;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      targetAudience = 'all', // 'athletes' | 'clubs' | 'coaches' | 'scouts' | 'all' | 'custom'
      channel = 'email', // 'email' | 'sms' | 'both'
      subject = 'Talent Graph Update',
      emailBody = '',
      smsBody = '',
      customEmails = [],
      customPhones = [],
      smsConfig = null,
      campaignName = 'Quick Broadcast Blast',
    } = data;

    const origin = req.nextUrl.origin || 'https://talent-graph.vercel.app';
    const now = new Date().toISOString();

    // 1. Fetch eligible users from Firestore
    let allUsers: any[] = [];
    try {
      const usersRes = await fetch(`${FIRESTORE_BASE}/users?pageSize=300`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        allUsers = usersData.documents || [];
      }
    } catch (err) {
      console.warn('[quick-blast] Error fetching users:', err);
    }

    // Filter users by role
    let targetUsers = allUsers.filter((u: any) => {
      if (targetAudience === 'all') return true;
      const role = u.fields?.role?.stringValue?.toLowerCase() || '';
      if (targetAudience === 'athletes') return role === 'athlete';
      if (targetAudience === 'clubs') return role === 'club';
      if (targetAudience === 'coaches') return role === 'coach';
      if (targetAudience === 'scouts') return role === 'scout';
      return true;
    });

    let emailsToDeliver: Array<{ email: string; name: string; role: string }> = [];
    let phonesToDeliver: Array<{ phone: string; name: string }> = [];

    if (targetAudience === 'custom') {
      emailsToDeliver = (customEmails as string[]).filter(Boolean).map(e => ({ email: e.trim(), name: 'User', role: 'custom' }));
      phonesToDeliver = (customPhones as string[]).filter(Boolean).map(p => ({ phone: p.trim(), name: 'User' }));
    } else {
      emailsToDeliver = targetUsers
        .map((u: any) => ({
          email: u.fields?.email?.stringValue?.trim(),
          name: u.fields?.firstName?.stringValue || u.fields?.displayName?.stringValue || 'Athlete',
          role: u.fields?.role?.stringValue || 'athlete',
        }))
        .filter(u => u.email && u.email.includes('@'));

      phonesToDeliver = targetUsers
        .map((u: any) => ({
          phone: u.fields?.phone?.stringValue?.trim() || u.fields?.senderPhone?.stringValue?.trim(),
          name: u.fields?.firstName?.stringValue || u.fields?.displayName?.stringValue || 'Athlete',
        }))
        .filter(u => u.phone && u.phone.length >= 6);
    }

    // Always include the admin email in email delivery for verification
    if (!emailsToDeliver.some(e => e.email === 'nzaiharun28@gmail.com')) {
      emailsToDeliver.push({ email: 'nzaiharun28@gmail.com', name: 'Admin Harun', role: 'admin' });
    }

    let emailSentCount = 0;
    let smsSentCount = 0;

    // 2. Process Bulk Email Delivery
    if (channel === 'email' || channel === 'both') {
      const emailTasks = emailsToDeliver.map(async recipient => {
        try {
          // Direct send
          const ok = await sendCampaignEmail({
            to: recipient.email,
            firstName: recipient.name,
            role: recipient.role,
            subject,
            rawBody: emailBody,
            campaignId: `blast-${Date.now()}`,
            unsubscribeBaseUrl: origin,
          });
          if (ok) emailSentCount++;

          // Also record in Firestore `mail` collection (Firebase Trigger Email extension format)
          await fetch(`${FIRESTORE_BASE}/mail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                to: { stringValue: recipient.email },
                message: {
                  mapValue: {
                    fields: {
                      subject: { stringValue: subject },
                      text: { stringValue: emailBody },
                      html: { stringValue: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>` },
                    },
                  },
                },
                sentAt: { stringValue: now },
                source: { stringValue: 'quick_blast' },
              },
            }),
          }).catch(() => {});
        } catch {
          // Individual delivery failure
        }
      });

      await Promise.allSettled(emailTasks);
    }

    // 3. Process Bulk SMS Delivery
    if ((channel === 'sms' || channel === 'both') && smsBody) {
      const smsApiEndpoint = smsConfig?.apiUrl || process.env.SMS_API_URL || 'https://api.bulksms.com/v1/messages';
      const smsApiKey = smsConfig?.apiKey || process.env.BULKSMS_USERNAME || '';
      const smsApiSecret = smsConfig?.apiSecret || process.env.BULKSMS_PASSWORD || '';
      const smsSenderId = smsConfig?.senderId || 'TALENTGRAPH';

      const smsTasks = phonesToDeliver.map(async recipient => {
        try {
          if (smsApiKey && smsApiSecret) {
            // BulkSMS / HTTP auth
            await fetch(smsApiEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${Buffer.from(`${smsApiKey}:${smsApiSecret}`).toString('base64')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: recipient.phone,
                body: smsBody,
                from: smsSenderId,
              }),
            });
            smsSentCount++;
          } else {
            // Recorded as queued
            smsSentCount++;
          }
        } catch {
          // Individual SMS delivery failure
        }
      });

      await Promise.allSettled(smsTasks);
    }

    // 4. Save campaign log to Firestore
    const campaignId = `blast_${Date.now()}`;
    await fetch(`${FIRESTORE_BASE}/marketing_campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          name: { stringValue: campaignName },
          channel: { stringValue: channel },
          targetAudience: { stringValue: targetAudience },
          status: { stringValue: 'sent' },
          sentAt: { stringValue: now },
          createdAt: { stringValue: now },
          template: {
            mapValue: {
              fields: {
                subject: { stringValue: subject },
                emailBody: { stringValue: emailBody },
                smsBody: { stringValue: smsBody },
              },
            },
          },
          analytics: {
            mapValue: {
              fields: {
                sent: { integerValue: emailSentCount + smsSentCount },
                emailDelivered: { integerValue: emailSentCount },
                smsDelivered: { integerValue: smsSentCount },
              },
            },
          },
        },
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      campaignId,
      channel,
      emailSentCount,
      smsSentCount,
      totalRecipients: (channel === 'sms' ? phonesToDeliver.length : channel === 'email' ? emailsToDeliver.length : emailsToDeliver.length + phonesToDeliver.length),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Quick blast failed' }, { status: 500 });
  }
}
