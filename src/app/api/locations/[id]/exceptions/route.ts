import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Manage location hour exceptions (holidays, special closures)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locationId = parseInt(id);

    const result = await query(
      'SELECT * FROM location_hour_exceptions WHERE location_id = $1 ORDER BY date',
      [locationId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exceptions' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const locationId = parseInt(id);
    const { date, open_time, close_time, is_closed, reason } = await request.json();

    const result = await query(
      `INSERT INTO location_hour_exceptions (location_id, date, open_time, close_time, is_closed, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (location_id, date) DO UPDATE SET open_time = $3, close_time = $4, is_closed = $5, reason = $6
       RETURNING *`,
      [locationId, date, open_time || null, close_time || null, is_closed || false, reason || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update exception' },
      { status: 500 }
    );
  }
}
