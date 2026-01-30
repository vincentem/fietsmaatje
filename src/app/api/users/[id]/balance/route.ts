import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { notifyEvent } from '@/lib/notify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { id } = await params;
    const userId = Number(id);
    const { delta_cents = 0, note = '' } = await request.json();
    if (!delta_cents) return NextResponse.json({ error: 'delta_cents required' }, { status: 400 });

    // Update balance
    const res = await query('UPDATE users SET balance_cents = balance_cents + $1 WHERE id = $2 RETURNING id, email, name, balance_cents', [delta_cents, userId]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ledger entry
    await query('INSERT INTO ledger_entries (transaction_id, account, amount_cents, note) VALUES (NULL,$1,$2,$3)', [delta_cents > 0 ? 'bank' : 'adjustments', delta_cents, note || 'Balance adjustment']);

    // audit + notify (audit is best-effort)
    try {
      await query(
        'INSERT INTO audit_logs (event_type, related_type, related_id, payload) VALUES ($1,$2,$3,$4)',
        ['user.balance_changed', 'user', userId, { delta_cents, note }]
      );
    } catch (auditErr) {
      console.warn('Audit log insert failed', auditErr);
    }
    try { await notifyEvent('user.balance_changed','user', userId, { delta_cents, note }); } catch(e) { console.error(e); }

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('POST user balance error', err);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}
