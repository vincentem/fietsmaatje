import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyEvent } from '@/lib/notify';
import { createTransaction } from '@/lib/transactions';
import { createUserNotification } from '@/lib/user-notifications';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  const limit = Number(url.searchParams.get('limit') || 100);
  try {
    if (userId) {
      const res = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [Number(userId), limit]);
      return NextResponse.json(res.rows);
    }
    const res = await query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1', [limit]);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('GET transactions error', err);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// create a transaction (used by booking flow)
export async function POST(req: Request) {
  const body = await req.json();
  const { user_id = null, reservation_id = null, amount_cents, currency = 'EUR', payment_method = null, provider_response = null } = body;
  const amountCents = Number(amount_cents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'amount_cents must be a positive number' }, { status: 400 });
  }

  try {
    const { transaction, paid } = await createTransaction(query, {
      userId: user_id,
      reservationId: reservation_id,
      amountCents,
      currency,
      paymentMethod: payment_method,
      providerResponse: provider_response,
    });

    try {
      await notifyEvent(paid ? 'transaction.paid' : 'transaction.created', 'transaction', transaction.id, transaction);
    } catch (e) {
      console.error(e);
    }

    if (transaction.user_id && !transaction.reservation_id) {
      const title = paid ? 'Saldo opgewaardeerd' : 'Betaling gestart';
      const body = paid
        ? 'Je saldo is succesvol bijgewerkt.'
        : 'Je betaling is gestart. We verwerken deze zodra de betaling is afgerond.';
      try {
        await createUserNotification({
          userId: transaction.user_id,
          type: paid ? 'payment.topup' : 'payment.created',
          title,
          body,
          payload: {
            payment: {
              transaction_id: transaction.id,
              amount_cents: transaction.amount_cents,
              status: transaction.status,
              method: transaction.payment_method,
            },
          },
        });
      } catch (err) {
        console.error('Failed to create payment notification', err);
      }
    }

    return NextResponse.json(transaction);
  } catch (err) {
    console.error('POST transactions error', err);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
