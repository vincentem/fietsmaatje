import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Dashboard summary for volunteer: balance + next reservation + completed count
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    const [userResult, completedResult, nextResult] = await Promise.all([
      query('SELECT balance_cents FROM users WHERE id = $1', [userId]),
      query(
        'SELECT COUNT(*)::int AS total_completed FROM reservations WHERE volunteer_id = $1 AND status = $2',
        [userId, 'COMPLETED']
      ),
      query(
        `SELECT id, start_datetime
         FROM reservations
         WHERE volunteer_id = $1 AND status = $2 AND start_datetime > NOW()
         ORDER BY start_datetime ASC
         LIMIT 1`,
        [userId, 'BOOKED']
      ),
    ]);

    const balanceCents = userResult.rows[0]?.balance_cents ?? 0;
    const totalCompleted = completedResult.rows[0]?.total_completed ?? 0;
    const nextReservation = nextResult.rows[0] ?? null;

    return NextResponse.json({
      balance_cents: balanceCents,
      total_completed: totalCompleted,
      next_reservation: nextReservation,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
