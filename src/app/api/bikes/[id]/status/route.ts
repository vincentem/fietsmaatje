import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyEvent } from '@/lib/notify';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const bikeId = Number(params.id);
  const body = await req.json();
  const { status } = body;
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });

  try {
    const res = await query('UPDATE bikes SET status = $1, last_maintenance_at = now() WHERE id = $2 RETURNING *', [status, bikeId]);
    try {
      await notifyEvent('bike.status_changed', 'bike', bikeId, { status: res.rows[0].status });
    } catch (err) {
      console.error('notify error', err);
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('POST bike status error', err);
    return NextResponse.json({ error: 'Failed to update bike status' }, { status: 500 });
  }
}
