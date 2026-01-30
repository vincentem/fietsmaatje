import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locationId = parseInt(id);

    // Get location
    const location = await query(
      'SELECT * FROM locations WHERE id = $1',
      [locationId]
    );

    if (location.rows.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Get weekly hours
    const weeklyHours = await query(
      'SELECT * FROM location_weekly_hours WHERE location_id = $1 ORDER BY weekday',
      [locationId]
    );

    // Get hour exceptions
    const exceptions = await query(
      'SELECT * FROM location_hour_exceptions WHERE location_id = $1 ORDER BY date',
      [locationId]
    );

    return NextResponse.json({
      location: location.rows[0],
      weeklyHours: weeklyHours.rows,
      exceptions: exceptions.rows,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const locationId = parseInt(id);
    const { name, address, instructions, hours_type } = await request.json();

    const result = await query(
      'UPDATE locations SET name = $1, address = $2, instructions = $3, hours_type = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, address, instructions, hours_type, locationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const locationId = parseInt(id);

    await query(
      'DELETE FROM locations WHERE id = $1',
      [locationId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
