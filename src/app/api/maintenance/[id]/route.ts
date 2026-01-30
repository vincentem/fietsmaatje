import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const maintenanceId = Number(id);
  const body = await req.json();
  const { notes, duration_minutes, parts, attachments } = body;
  try {
    const res = await query(
      `UPDATE maintenance_logs SET notes = $1, duration_minutes = $2, parts = $3, attachments = $4 WHERE id = $5 RETURNING *`,
      [notes, duration_minutes, parts, attachments, maintenanceId]
    );
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('PUT maintenance error', err);
    return NextResponse.json({ error: 'Failed to update maintenance log' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const maintenanceId = Number(id);
  try {
    await query('DELETE FROM maintenance_logs WHERE id = $1', [maintenanceId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE maintenance error', err);
    return NextResponse.json({ error: 'Failed to delete maintenance log' }, { status: 500 });
  }
}
