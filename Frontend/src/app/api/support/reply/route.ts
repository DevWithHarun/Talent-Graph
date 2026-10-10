import { NextRequest, NextResponse } from 'next/server';
import { sendAgentReplyNotification } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      ticketId,
      replyText,
      agentName = 'Talent Graph Support',
      recipientEmail,
      recipientName = 'User',
      ticketSubject = 'Support Request',
      recipientPhone,
      sendEmail = true,
      sendSms = false,
      newStatus = 'pending_user',
    } = data;

    if (!ticketId || !replyText) {
      return NextResponse.json({ error: 'ticketId and replyText are required' }, { status: 400 });
    }

    let emailSent = false;
    let smsSent = false;

    // Send email notification to user
    if (sendEmail && recipientEmail) {
      try {
        await sendAgentReplyNotification({
          ticketId,
          subject: ticketSubject,
          replyBody: replyText,
          senderName: recipientName,
          senderEmail: recipientEmail,
          agentName,
        });
        emailSent = true;
      } catch (err) {
        console.warn('[support/reply] Email notification failed (non-fatal):', err);
      }
    }

    // Send SMS notification if requested
    if (sendSms && recipientPhone?.trim()) {
      try {
        const smsMessage = `Hi ${recipientName}, Talent Graph Support replied to ticket #${ticketId.slice(0, 8)}: "${replyText.slice(0, 100)}...". Check your email ${recipientEmail || ''} for full details.`;
        const smsResult = await sendSMS(recipientPhone.trim(), smsMessage);
        smsSent = smsResult.success;
      } catch (err) {
        console.warn('[support/reply] SMS dispatch failed (non-fatal):', err);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      smsSent,
      ticketId,
      newStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
