import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

const COOKIE_NAME = '__session';

export async function requireUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) throw new Error('UNAUTHENTICATED');
  const decoded = await adminAuth.verifySessionCookie(token, true);
  return { uid: decoded.uid };
}

export function authErrorToStatus(e: unknown): number {
  if (String(e).includes('UNAUTHENTICATED')) return 401;
  return 500;
}
