import { NextResponse, NextRequest } from 'next/server';
import { getClient, query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createUserNotification } from '@/lib/user-notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);

    const result = await query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reservationId = parseInt(id);
    const { status } = await request.json();

    // Check ownership or admin
    const resResult = await query(
      'SELECT volunteer_id FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (resResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (decoded.role !== 'ADMIN' && resResult.rows[0].volunteer_id !== decoded.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const result = await query(
      'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, reservationId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: Awaited<ReturnType<typeof getClient>> | null = null;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reservationId = parseInt(id);

    // Check ownership or admin
    const resResult = await query(
      'SELECT volunteer_id FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (resResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (decoded.role !== 'ADMIN' && resResult.rows[0].volunteer_id !== decoded.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const reservationDetails = await query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    );

    const reservation = reservationDetails.rows[0];
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    client = await getClient();
    await client.query('BEGIN');

    // Mark as canceled instead of deleting
    await client.query(
      'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['CANCELED', reservationId]
    );

    // Find paid transaction for this reservation
    const txRes = await client.query(
      `SELECT * FROM transactions
       WHERE reservation_id = $1 AND status = 'paid'
       ORDER BY created_at DESC
       LIMIT 1`,
      [reservationId]
    );

    let refundedAmount = 0;
    let refundTx: any = null;
    if (txRes.rows.length > 0) {
      const tx = txRes.rows[0];
      refundedAmount = tx.amount_cents;

      // Credit user balance
      await client.query(
        'UPDATE users SET balance_cents = balance_cents + $1 WHERE id = $2',
        [refundedAmount, reservation.volunteer_id]
      );

      // Create refund transaction (balance credit)
      const refundRes = await client.query(
        `INSERT INTO transactions (user_id, reservation_id, amount_cents, currency, status, payment_method, provider_response)
         VALUES ($1,$2,$3,$4,'paid',$5,$6)
         RETURNING *`,
        [
          reservation.volunteer_id,
          reservation.id,
          refundedAmount,
          tx.currency || 'EUR',
          'balance_refund',
          JSON.stringify({ refunded_from: tx.id })
        ]
      );
      refundTx = refundRes.rows[0];

      // Ledger entries for refund
      await client.query(
        'INSERT INTO ledger_entries (transaction_id, account, amount_cents, note) VALUES ($1,$2,$3,$4)',
        [refundTx.id, 'refunds', -refundedAmount, 'Reservation refund to balance']
      );
      await client.query(
        'INSERT INTO ledger_entries (transaction_id, account, amount_cents, note) VALUES ($1,$2,$3,$4)',
        [refundTx.id, 'user_balance', refundedAmount, 'Balance credit for canceled reservation']
      );
    }

    await client.query('COMMIT');

    try {
      const details = await query(
        `SELECT b.name as bike_name, b.code as bike_code, l.name as location_name
         FROM bikes b
         JOIN locations l ON l.id = b.location_id
         WHERE b.id = $1`,
        [reservation.bike_id]
      );
      const info = details.rows[0] || {};
      const body = refundedAmount > 0
        ? 'Je reservering is geannuleerd. Het bedrag is bijgeschreven op je saldo.'
        : 'Je reservering is geannuleerd.';
      await createUserNotification({
        userId: reservation.volunteer_id,
        type: 'booking.canceled',
        title: 'Reservering geannuleerd',
        body,
        payload: {
          reservation: {
            id: reservation.id,
            bike_id: reservation.bike_id,
            bike_name: info.bike_name,
            bike_code: info.bike_code,
            location_id: reservation.location_id,
            location_name: info.location_name,
            start_datetime: reservation.start_datetime,
            end_datetime: reservation.end_datetime,
            status: 'CANCELED',
          },
          ...(refundedAmount > 0 && refundTx
            ? {
                payment: {
                  transaction_id: refundTx.id,
                  amount_cents: refundedAmount,
                  status: refundTx.status,
                  method: refundTx.payment_method,
                },
              }
            : {}),
        },
      });
    } catch (err) {
      console.error('Failed to create cancel notification', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Reservation cancel rollback error:', rollbackError);
      }
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
