import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { addMinutes, subMinutes } from 'date-fns';
import { BUFFER_TIME, TIME_INCREMENT, getLocationHours } from '@/lib/availability';

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

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

    const locationId = Number(request.nextUrl.searchParams.get('location_id'));
    const date = request.nextUrl.searchParams.get('date');
    const duration = Number(request.nextUrl.searchParams.get('duration'));

    if (!locationId || !date || !Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const dateObj = new Date(`${date}T00:00:00`);
    const hours = await getLocationHours(locationId, dateObj);
    if (!hours) {
      return NextResponse.json({ error: 'Location hours not found' }, { status: 404 });
    }

    const openMinutes = timeToMinutes(hours.open_time);
    const closeMinutes = timeToMinutes(hours.close_time);

    const slots: { time: string; available: boolean; available_count: number }[] = [];

    for (let m = openMinutes; m < closeMinutes; m += TIME_INCREMENT) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const start = new Date(`${date}T${timeStr}:00`);
      const end = addMinutes(start, Math.round(duration * 60));

      if (hours.is_closed || timeToMinutes(hours.close_time) < timeToMinutes(hours.open_time)) {
        slots.push({ time: timeStr, available: false, available_count: 0 });
        continue;
      }

      const endMinutes = timeToMinutes(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
      if (endMinutes > closeMinutes) {
        slots.push({ time: timeStr, available: false, available_count: 0 });
        continue;
      }

      const bufferedStart = subMinutes(start, BUFFER_TIME);
      const bufferedEnd = addMinutes(end, BUFFER_TIME);

      const availableResult = await query(
        `SELECT COUNT(*)::int AS count
         FROM bikes b
         WHERE b.location_id = $1
         AND b.status = 'AVAILABLE'
         AND NOT EXISTS (
           SELECT 1 FROM reservations r
           WHERE r.bike_id = b.id
           AND r.status IN ('BOOKED','COMPLETED')
           AND NOT (r.end_datetime <= $2 OR r.start_datetime >= $3)
         )`,
        [locationId, bufferedStart, bufferedEnd]
      );

      const count = availableResult.rows[0]?.count ?? 0;
      slots.push({ time: timeStr, available: count > 0, available_count: count });
    }

    return NextResponse.json({
      date,
      location_id: locationId,
      duration,
      slots,
    });
  } catch (error) {
    console.error('Availability timebar error:', error);
    return NextResponse.json({ error: 'Failed to compute availability' }, { status: 500 });
  }
}
