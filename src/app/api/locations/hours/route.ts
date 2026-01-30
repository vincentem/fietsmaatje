import { NextResponse, NextRequest } from 'next/server';
import { 
  getLocationHours, 
  setWeeklyHours, 
  setException, 
  deleteException 
} from '@/lib/location-hours';

export async function GET(request: NextRequest) {
  const locationId = request.nextUrl.searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId required' }, { status: 400 });
  }

  try {
    const hours = await getLocationHours(parseInt(locationId));
    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching hours:', error);
    return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { action, locationId, weekday, isClosed, openTime, closeTime, date, reason } = await request.json();

  try {
    if (action === 'setWeeklyHours') {
      const result = await setWeeklyHours(locationId, weekday, isClosed, openTime, closeTime);
      return NextResponse.json(result);
    }

    if (action === 'setException') {
      const result = await setException(locationId, date, isClosed, openTime, closeTime, reason);
      return NextResponse.json(result);
    }

    if (action === 'deleteException') {
      await deleteException(parseInt(request.nextUrl.searchParams.get('exceptionId') || '0'));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing hours:', error);
    return NextResponse.json({ error: 'Failed to manage hours' }, { status: 500 });
  }
}
