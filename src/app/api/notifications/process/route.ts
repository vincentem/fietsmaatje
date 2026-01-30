import { NextResponse } from 'next/server';
import { processPendingNotifications } from '@/lib/notify';

export async function POST() {
  try {
    await processPendingNotifications(50);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('process notifications error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
