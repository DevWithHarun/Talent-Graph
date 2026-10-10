import { NextRequest, NextResponse } from 'next/server';
import { sendNewTicketNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await sendNewTicketNotification({
      ticketId: data.ticketCode || data.ticketId || `TG-${Date.now()}`,
      subject: data.subject || `Support request from ${data.name || 'User'}`,
      message: data.message || '',
      priority: 'medium',
      tag: data.category || 'General',
      senderName: data.name || 'User',
      senderEmail: data.email || 'nzaiharun28@gmail.com',
      slaDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Email delivery failed' }, { status: 500 });
  }
}
