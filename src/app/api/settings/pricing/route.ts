import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const DEFAULT_FEE_CENTS = 1000;

export async function GET() {
  try {
    const res = await query('SELECT value_text FROM app_settings WHERE key = $1 LIMIT 1', ['reservation_fee_cents']);
    const raw = res.rows[0]?.value_text;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return NextResponse.json({ fee_cents: Math.round(parsed) });
    }
  } catch (err) {
    console.error('Error loading pricing settings', err);
  }

  const fallbackRaw = process.env.RESERVATION_FEE_CENTS ?? DEFAULT_FEE_CENTS;
  const fallbackParsed = Number(fallbackRaw);
  const fee = Number.isFinite(fallbackParsed) && fallbackParsed >= 0 ? Math.round(fallbackParsed) : DEFAULT_FEE_CENTS;
  return NextResponse.json({ fee_cents: fee });
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const feeCents = Number(body?.fee_cents);
    if (!Number.isFinite(feeCents) || feeCents < 0) {
      return NextResponse.json({ error: 'fee_cents required' }, { status: 400 });
    }

    await query(
      `INSERT INTO app_settings (key, value_text)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value_text = $2, updated_at = CURRENT_TIMESTAMP`,
      ['reservation_fee_cents', String(Math.round(feeCents))]
    );

    return NextResponse.json({ fee_cents: Math.round(feeCents) });
  } catch (err) {
    console.error('Error updating pricing settings', err);
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
  }
}
