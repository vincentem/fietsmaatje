import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { authenticateUser, hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name } = await request.json();

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password required' },
          { status: 400 }
        );
      }

      const result = await authenticateUser(email, password);
      if (!result) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json(result);
    }

    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name required' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);

      const result = await query(
        'INSERT INTO users (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id, email, name, role',
        [email, passwordHash, name, 'VOLUNTEER']
      );

      const user = result.rows[0];
      const token = generateToken(user.id, user.email, user.role);

      return NextResponse.json({ user, token }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
