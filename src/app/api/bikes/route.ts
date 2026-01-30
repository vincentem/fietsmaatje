import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { addMinutes, subMinutes } from 'date-fns';
import { BUFFER_TIME } from '@/lib/availability';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get('location_id');
    const date = request.nextUrl.searchParams.get('date');
    const startTime = request.nextUrl.searchParams.get('start_time');
    const duration = request.nextUrl.searchParams.get('duration');
    
    let sql = 'SELECT id, code, name, location_id, status, notes, created_at FROM bikes';
    const params: any[] = [];

    if (locationId) {
      sql += ' WHERE location_id = $1';
      params.push(parseInt(locationId));
    }

    // If booking parameters are supplied, filter to bikes that are AVAILABLE and not reserved
    if (locationId && date && startTime && duration) {
      const hours = Number(duration);
      if (!Number.isFinite(hours) || hours <= 0) {
        return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
      }
      const start = new Date(`${date}T${startTime}:00`);
      const end = addMinutes(start, Math.round(hours * 60));
      const bufferedStart = subMinutes(start, BUFFER_TIME);
      const bufferedEnd = addMinutes(end, BUFFER_TIME);

      sql +=
        ' AND status = $2 AND NOT EXISTS (' +
        'SELECT 1 FROM reservations r ' +
        'WHERE r.bike_id = bikes.id ' +
        "AND r.status IN ('BOOKED','COMPLETED') " +
        'AND NOT (r.end_datetime <= $3 OR r.start_datetime >= $4)' +
        ')';
      params.push('AVAILABLE', bufferedStart, bufferedEnd);
    }

    sql += ' ORDER BY location_id, code';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bikes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { code, name, location_id, status, notes } = await request.json();

    if (!code || !location_id) {
      return NextResponse.json(
        { error: 'Code and location_id are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO bikes (code, name, location_id, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [code, name || null, location_id, status || 'AVAILABLE', notes || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create bike' },
      { status: 500 }
    );
  }
}
