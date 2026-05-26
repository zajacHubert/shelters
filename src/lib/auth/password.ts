import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hash, salt] = stored.split('.');
  if (!hash || !salt) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return timingSafeEqual(hashBuf, derived);
}
