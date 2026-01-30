import { NextResponse, NextRequest } from 'next/server';
import { getClient, query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateReservation } from '@/lib/availability';
import { calculateReservationFeeCents } from '@/lib/pricing';
import { createTransaction } from '@/lib/transactions';
import { notifyEvent } from '@/lib/notify';
import { createUserNotification } from '@/lib/user-notifications';

export async function GET(request: NextRequest) {
  try {
    const volunteerId = request.nextUrl.searchParams.get('volunteer_id');
    const bikeId = request.nextUrl.searchParams.get('bike_id');
    const locationId = request.nextUrl.searchParams.get('location_id');
    const status = request.nextUrl.searchParams.get('status');
    
    let sql = 'SELECT id, bike_id, location_id, volunteer_id, start_datetime, end_datetime, status, created_at FROM reservations WHERE 1=1';
    const params: any[] = [];

    if (volunteerId) {
      sql += ` AND volunteer_id = $${params.length + 1}`;
      params.push(parseInt(volunteerId));
    }
    if (bikeId) {
      sql += ` AND bike_id = $${params.length + 1}`;
      params.push(parseInt(bikeId));
    }
    if (locationId) {
      sql += ` AND location_id = $${params.length + 1}`;
      params.push(parseInt(locationId));
    }
    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY start_datetime DESC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { bike_id, location_id, start_datetime, end_datetime } = await request.json();

    if (!bike_id || !location_id || !start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const startTime = new Date(start_datetime);
    const endTime = new Date(end_datetime);

    // Validate reservation using availability engine
    const validation = await validateReservation(bike_id, location_id, startTime, endTime);
    if (!validation.available) {
      return NextResponse.json(
        { error: validation.reason || 'Reservation not available' },
        { status: 400 }
      );
    }

    client = await getClient();
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO reservations (bike_id, location_id, volunteer_id, start_datetime, end_datetime, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [bike_id, location_id, decoded.id, startTime, endTime, 'BOOKED']
    );

    const amountCents = await calculateReservationFeeCents();
    const { transaction, paid } = await createTransaction(client.query.bind(client), {
      userId: decoded.id,
      reservationId: result.rows[0].id,
      amountCents,
      currency: 'EUR',
    });

    await client.query('COMMIT');

    try {
      await notifyEvent(paid ? 'transaction.paid' : 'transaction.created', 'transaction', transaction.id, transaction);
    } catch (err) {
      console.error('Failed to notify transaction event', err);
    }

    const reservation = result.rows[0];

    try {
      const details = await query(
        `SELECT b.name as bike_name, b.code as bike_code, l.name as location_name
         FROM bikes b
         JOIN locations l ON l.id = b.location_id
         WHERE b.id = $1`,
        [reservation.bike_id]
      );
      const info = details.rows[0] || {};
      const title = 'Reservering bevestigd';
      const body = paid
        ? 'Je reservering is bevestigd en betaald.'
        : 'Je reservering is bevestigd. Betaling staat open.';
      await createUserNotification({
        userId: decoded.id,
        type: 'booking.confirmed',
        title,
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
            status: reservation.status,
          },
          payment: {
            transaction_id: transaction.id,
            amount_cents: transaction.amount_cents,
            status: transaction.status,
            method: transaction.payment_method,
          },
        },
      });
    } catch (err) {
      console.error('Failed to create booking notification', err);
    }

    return NextResponse.json({ ...reservation, transaction }, { status: 201 });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Reservation rollback error:', rollbackError);
      }
    }
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
