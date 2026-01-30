import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { markUserNotificationRead } from '@/lib/user-notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isFinite(notificationId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const updated = await markUserNotificationRead(decoded.id, notificationId);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH user notifications error', err);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
