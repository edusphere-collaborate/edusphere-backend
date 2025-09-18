import { randomBytes, createHash } from 'crypto';

export function generateTokenUrlSafe(length = 32): string {
  // base64url token
  return randomBytes(length).toString('base64url');
}

export function hashToken(token: string): string {
  // SHA256 hex is fine for token hashing (fast + deterministic)
  return createHash('sha256').update(token).digest('hex');
}
