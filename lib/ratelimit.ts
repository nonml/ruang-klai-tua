import { adminDb } from '@/lib/firebaseAdmin';

type RateLimitOptions = {
  uid: string;
  key: string;
  maxPerDay: number;
  maxPerMinute?: number;
  ipFingerprint?: string;
};

type RateLimitResult = {
  ok: boolean;
  usedDay: number;
  usedMinute?: number;
};

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function minuteKey(now: Date): string {
  return now.toISOString().slice(0, 16);
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const day = dayKey(now);
  const minute = minuteKey(now);

  const dayRef = adminDb.collection('rate_limits').doc(`day:${opts.key}:${opts.uid}:${day}`);
  const minuteScope = opts.ipFingerprint ? `${opts.uid}:${opts.ipFingerprint}` : opts.uid;
  const minuteRef = adminDb.collection('rate_limits').doc(`minute:${opts.key}:${minuteScope}:${minute}`);

  return adminDb.runTransaction(async (tx) => {
    const [daySnap, minuteSnap] = await Promise.all([tx.get(dayRef), tx.get(minuteRef)]);

    const usedDay = daySnap.exists ? Number(daySnap.data()?.count ?? 0) : 0;
    if (usedDay >= opts.maxPerDay) {
      return { ok: false, usedDay };
    }

    const maxMinute = opts.maxPerMinute ?? Number.POSITIVE_INFINITY;
    const usedMinute = minuteSnap.exists ? Number(minuteSnap.data()?.count ?? 0) : 0;
    if (usedMinute >= maxMinute) {
      return { ok: false, usedDay, usedMinute };
    }

    tx.set(
      dayRef,
      {
        count: usedDay + 1,
        key: opts.key,
        uid: opts.uid,
        day,
        updated_at: now.toISOString(),
      },
      { merge: true },
    );

    if (Number.isFinite(maxMinute)) {
      tx.set(
        minuteRef,
        {
          count: usedMinute + 1,
          key: opts.key,
          uid: opts.uid,
          ip_fingerprint: opts.ipFingerprint ?? null,
          minute,
          updated_at: now.toISOString(),
        },
        { merge: true },
      );
    }

    return { ok: true, usedDay: usedDay + 1, usedMinute: usedMinute + 1 };
  });
}
