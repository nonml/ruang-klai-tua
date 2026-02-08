import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createReport, listReports } from '@/lib/reports';
import { assessRisk } from '@/lib/risk';
import { requireUser, authErrorToStatus } from '@/lib/authServer';
import { checkRateLimit } from '@/lib/ratelimit';

const CreateSchema = z.object({
  schoolName: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(80),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  note: z.string().max(200).optional(),
  lat: z.number(),
  lng: z.number(),
  observedAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? '20');
  const data = await listReports({ limit: Math.min(Math.max(limit, 1), 50) });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit({ uid: user.uid, key: 'create_report', maxPerDay: 5 });
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited', used: rl.used }, { status: 429 });

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const risk = await assessRisk({
      note: parsed.data.note ?? '',
      ocrText: '',
    });

    const status = risk.score >= 0.8 ? 'HELD' : 'PENDING';

    const nowIso = new Date().toISOString();

    const created = await createReport({
      created_at: nowIso,
      school_name: parsed.data.schoolName ?? null,
      category: parsed.data.category,
      severity: parsed.data.severity,
      note: parsed.data.note ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      observed_at: parsed.data.observedAt ?? nowIso,
      status,
      risk_score: risk.score,
      risk_reasons: risk.reasons,
      confirm_count: 0,
      flag_count: 0,
      owner_uid: user.uid,
    });

    // TODO: Upload pipeline: create signed upload URL -> temp bucket -> blur -> publish URL(s)

    return NextResponse.json({ data: created, risk });
  } catch (e) {
    return NextResponse.json({ error: 'auth_error' }, { status: authErrorToStatus(e) });
  }
}
