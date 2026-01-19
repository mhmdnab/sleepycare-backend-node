import crypto from 'crypto';
import axios from 'axios';
import { User, IUser } from '../models/user.model';
import { PasswordResetToken } from '../models/passwordReset.model';
import {
  getPasswordHash,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
} from '../utils/security';
import { HttpException } from '../middleware/error.middleware';
import { UserCreate, TokenResponse } from '../schemas/user.schema';
import { config } from '../config';

export async function registerUser(data: UserCreate): Promise<IUser> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new HttpException(400, 'Email already registered');
  }

  const user = new User({
    name: data.name,
    email: data.email.toLowerCase(),
    password_hash: getPasswordHash(data.password),
    role: 'user',
    provider: 'local',
  });

  await user.save();
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<IUser> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.password_hash) {
    throw new HttpException(400, 'Invalid credentials');
  }

  if (!verifyPassword(password, user.password_hash)) {
    throw new HttpException(400, 'Invalid credentials');
  }

  return user;
}

export function generateTokensForUser(user: IUser): TokenResponse {
  const accessToken = createAccessToken(user._id.toString(), user.role);
  const refreshToken = createRefreshToken(user._id.toString(), user.role);
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
  };
}

export async function createPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Silently return to prevent email enumeration
    return;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const resetDoc = new PasswordResetToken({
    user_id: user._id,
    token,
    expires_at: expiresAt,
  });
  await resetDoc.save();

  // Build reset link
  const frontendUrl = config.frontendUrl || 'https://sleepycare.com';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // Send email via frontend API
  try {
    await axios.post(
      `${frontendUrl}/api/auth/forgot-password`,
      {
        email: user.email,
        resetToken: token,
        resetLink,
        userName: user.name,
      },
      { timeout: 30000 }
    );
  } catch (error) {
    // Log error but don't fail the request - token is still created
    console.error(`Failed to send password reset email to ${user.email}:`, error);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetDoc = await PasswordResetToken.findOne({ token });
  if (!resetDoc) {
    throw new HttpException(400, 'Invalid token');
  }

  if (resetDoc.used || resetDoc.expires_at < new Date()) {
    throw new HttpException(400, 'Expired token');
  }

  const user = await User.findById(resetDoc.user_id);
  if (!user) {
    throw new HttpException(400, 'User not found');
  }

  user.password_hash = getPasswordHash(newPassword);
  await user.save();

  resetDoc.used = true;
  await resetDoc.save();
}

// OAuth functions (disabled but kept for future use)
export async function loginWithGoogle(idToken: string): Promise<IUser> {
  throw new HttpException(501, 'Google OAuth is not implemented');
}

export async function loginWithApple(idToken: string): Promise<IUser> {
  throw new HttpException(501, 'Apple OAuth is not implemented');
}
