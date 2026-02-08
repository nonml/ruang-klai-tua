import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { z } from 'zod';

const Schema = z.object({ idToken: z.string().min(10) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const expiresIn = 1000 * 60 * 60 * 24 * 7; // 7 days
  const sessionCookie = await adminAuth.createSessionCookie(parsed.data.idToken, { expiresIn });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('__session', sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('__session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
