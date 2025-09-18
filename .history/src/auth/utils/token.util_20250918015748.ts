import * as crypto from 'crypto';

export function generateTokenUrlSafe(length = 32): string {
  // base64url token
  return randomBytes(length).toString('base64url');
}

/**
 * Hashes a token using SHA-256
 * @param token Raw token string
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
