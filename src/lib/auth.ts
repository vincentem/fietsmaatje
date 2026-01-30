import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRY = '7d';

export interface DecodedToken {
  id: number;
  email: string;
  role: 'VOLUNTEER' | 'ADMIN';
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

export async function getUserById(userId: number) {
  try {
    const result = await query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await query(
      'SELECT id, email, name, role, is_active, password_hash FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: any; token: string } | null> {
  try {
    const user = await getUserByEmail(email);
    
    if (!user || !user.is_active) {
      return null;
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return null;
    }

    const token = generateToken(user.id, user.email, user.role);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}
