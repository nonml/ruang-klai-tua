import { NextResponse } from 'next/server';
import { flagReport } from '@/lib/reports';
import { requireUser, authErrorToStatus } from '@/lib/authServer';
import { checkRateLimit } from '@/lib/ratelimit';
import { getClientIp, getIpFingerprint } from '@/lib/requestMeta';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const rl = await checkRateLimit({
      uid: user.uid,
      key: 'flag',
      maxPerDay: 30,
      maxPerMinute: 5,
      ipFingerprint: getIpFingerprint(getClientIp(req)),
    });
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

    await flagReport(params.id, user.uid);

    return NextResponse.redirect(
      new URL(`/report/${params.id}`, process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'),
    );
  } catch (e) {
    return NextResponse.json({ error: 'auth_error' }, { status: authErrorToStatus(e) });
  }
}
