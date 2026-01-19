import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export function getPasswordHash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

interface TokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
  exp?: number;
}

function createToken(data: Omit<TokenPayload, 'exp'>, expiresInMinutes: number): string {
  return jwt.sign(data, config.jwtSecret, {
    expiresIn: `${expiresInMinutes}m`,
  });
}

export function createAccessToken(subject: string, role: string): string {
  return createToken(
    { sub: subject, role, type: 'access' },
    config.accessTokenExpiresMinutes
  );
}

export function createRefreshToken(subject: string, role: string): string {
  return createToken(
    { sub: subject, role, type: 'refresh' },
    config.refreshTokenExpiresMinutes
  );
}

export function decodeToken(token: string, verifyType?: 'access' | 'refresh'): TokenPayload {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (verifyType && payload.type !== verifyType) {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    throw error;
  }
}
