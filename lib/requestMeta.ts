import { createHash } from 'crypto';

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

export function getIpFingerprint(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
