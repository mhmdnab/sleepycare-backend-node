import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // MongoDB
  mongodbUri: string;
  mongodbDb: string;

  // JWT
  jwtSecret: string;
  jwtAlgorithm: string;
  accessTokenExpiresMinutes: number;
  refreshTokenExpiresMinutes: number;

  // OAuth (optional, disabled)
  googleClientId: string | null;
  appleClientId: string | null;
  appleIssuer: string | null;
  appleAudience: string | null;

  // Admin
  adminEmail: string | null;
  adminPassword: string | null;

  // Frontend
  frontendUrl: string | null;

  // Cloudflare R2 Storage
  r2EndpointUrl: string | null;
  r2AccessKeyId: string | null;
  r2SecretAccessKey: string | null;
  r2BucketName: string | null;
  r2PublicUrl: string | null;

  // Server
  port: number;
}

function getEnvVar(key: string, required: boolean = false): string | null {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || null;
}

export const config: Config = {
  // MongoDB
  mongodbUri: getEnvVar('MONGODB_URI', true)!,
  mongodbDb: getEnvVar('MONGODB_DB') || 'sleepycare',

  // JWT
  jwtSecret: getEnvVar('JWT_SECRET', true)!,
  jwtAlgorithm: 'HS256',
  accessTokenExpiresMinutes: parseInt(getEnvVar('ACCESS_TOKEN_EXPIRES_MINUTES') || '30', 10),
  refreshTokenExpiresMinutes: parseInt(getEnvVar('REFRESH_TOKEN_EXPIRES_MINUTES') || '10080', 10), // 7 days

  // OAuth (optional)
  googleClientId: getEnvVar('GOOGLE_CLIENT_ID'),
  appleClientId: getEnvVar('APPLE_CLIENT_ID'),
  appleIssuer: getEnvVar('APPLE_ISSUER'),
  appleAudience: getEnvVar('APPLE_AUDIENCE'),

  // Admin
  adminEmail: getEnvVar('ADMIN_EMAIL'),
  adminPassword: getEnvVar('ADMIN_PASSWORD'),

  // Frontend
  frontendUrl: getEnvVar('FRONTEND_URL'),

  // Cloudflare R2 Storage
  r2EndpointUrl: getEnvVar('R2_ENDPOINT_URL'),
  r2AccessKeyId: getEnvVar('R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: getEnvVar('R2_SECRET_ACCESS_KEY'),
  r2BucketName: getEnvVar('R2_BUCKET_NAME'),
  r2PublicUrl: getEnvVar('R2_PUBLIC_URL'),

  // Server
  port: parseInt(getEnvVar('PORT') || '8000', 10),
};
