import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Get all locations or create new one
export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, address, instructions, hours_type, created_at FROM locations ORDER BY name'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
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

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { name, address, instructions, hours_type } = await request.json();

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO locations (name, address, instructions, hours_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, instructions || null, hours_type || 'SCHEDULED']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
