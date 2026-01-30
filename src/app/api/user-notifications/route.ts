import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { listUserNotifications } from '@/lib/user-notifications';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'all';
  const limit = Number(request.nextUrl.searchParams.get('limit') || 50);
  try {
    const items = await listUserNotifications(decoded.id, status, limit);
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET user notifications error', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
