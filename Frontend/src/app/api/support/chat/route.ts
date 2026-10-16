import { NextRequest, NextResponse } from 'next/server';
import { askSupportBot } from '@/lib/support-bot';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const reply = await askSupportBot(data.message || '', data.history || []);
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
