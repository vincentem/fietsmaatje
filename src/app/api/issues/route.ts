import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Get all issues or create new one
export async function GET(request: NextRequest) {
  try {
    const bikeId = request.nextUrl.searchParams.get('bike_id');
    const status = request.nextUrl.searchParams.get('status');
    const severity = request.nextUrl.searchParams.get('severity');

    let sql = 'SELECT id, bike_id, reported_by_user_id, reservation_id, category, severity, description, status, created_at FROM issues WHERE 1=1';
    const params: any[] = [];

    if (bikeId) {
      sql += ` AND bike_id = $${params.length + 1}`;
      params.push(parseInt(bikeId));
    }
    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (severity) {
      sql += ` AND severity = $${params.length + 1}`;
      params.push(severity);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
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

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { bike_id, reservation_id, category, severity, description } =
      await request.json();

    if (!bike_id || !category || !description) {
      return NextResponse.json(
        { error: 'Bike ID, category, and description are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO issues (bike_id, reported_by_user_id, reservation_id, category, severity, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        bike_id,
        decoded.id,
        reservation_id || null,
        category,
        severity || 'LOW',
        description,
        'OPEN',
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
