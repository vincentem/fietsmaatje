import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyEvent } from '@/lib/notify';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const bikeId = Number(params.id);
  try {
    const res = await query('SELECT * FROM maintenance_logs WHERE bike_id = $1 ORDER BY created_at DESC', [bikeId]);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('GET maintenance error', err);
    return NextResponse.json({ error: 'Failed to fetch maintenance logs' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const bikeId = Number(params.id);
  const body = await req.json();
  const { mechanic_id, type = 'inspection', status_after, notes, duration_minutes, parts = null, attachments = null } = body;

  try {
    const res = await query(
      `INSERT INTO maintenance_logs (bike_id, mechanic_id, type, status_after, notes, duration_minutes, parts, attachments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [bikeId, mechanic_id, type, status_after, notes, duration_minutes, parts, attachments]
    );

    // optionally update bike status and last_maintenance_at
    if (status_after) {
      await query('UPDATE bikes SET status = $1, last_maintenance_at = now() WHERE id = $2', [status_after, bikeId]);
    } else {
      await query('UPDATE bikes SET last_maintenance_at = now() WHERE id = $1', [bikeId]);
    }
    // audit + notify
    try {
      await notifyEvent('maintenance.created', 'bike', bikeId, { log: res.rows[0] });
    } catch (err) {
      console.error('notify error', err);
    }

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('POST maintenance error', err);
    return NextResponse.json({ error: 'Failed to create maintenance log' }, { status: 500 });
  }
}
