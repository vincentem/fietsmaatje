import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const dbRes = await query('SELECT current_database() AS name, current_user AS user');
    const countRes = await query("SELECT COUNT(*)::int AS table_count FROM pg_tables WHERE schemaname='public'");

    return NextResponse.json({
      ok: true,
      database: dbRes.rows[0]?.name ?? null,
      user: dbRes.rows[0]?.user ?? null,
      tableCount: countRes.rows[0]?.table_count ?? 0,
    });
  } catch (error) {
    console.error('DB health check failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}