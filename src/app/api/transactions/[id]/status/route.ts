import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyEvent } from '@/lib/notify';
import { createUserNotification } from '@/lib/user-notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transactionId = Number(id);
  const body = await req.json();
  const { status } = body;
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });
  try {
    const res = await query('UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *', [status, transactionId]);
    if (res.rows[0]) {
      await query('INSERT INTO audit_logs (event_type, related_type, related_id, payload) VALUES ($1,$2,$3,$4)', ['transaction.status_changed','transaction', transactionId, { status }]);
      try { await notifyEvent('transaction.status_changed', 'transaction', transactionId, { status }); } catch (e) { console.error(e); }
      const tx = res.rows[0];
      if (tx.user_id) {
        try {
          const title = status === 'paid' ? 'Betaling ontvangen' : status === 'failed' ? 'Betaling mislukt' : 'Betaling bijgewerkt';
          const body = status === 'paid'
            ? 'Je betaling is ontvangen en verwerkt.'
            : status === 'failed'
            ? 'Je betaling is mislukt. Probeer opnieuw of neem contact op.'
            : `Status gewijzigd naar ${status}.`;
          await createUserNotification({
            userId: tx.user_id,
            type: `payment.${status}`,
            title,
            body,
            payload: {
              payment: {
                transaction_id: tx.id,
                amount_cents: tx.amount_cents,
                status: tx.status,
                method: tx.payment_method,
              },
            },
          });
        } catch (err) {
          console.error('Failed to create status notification', err);
        }
      }
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('POST transaction status error', err);
    return NextResponse.json({ error: 'Failed to update transaction status' }, { status: 500 });
  }
}
