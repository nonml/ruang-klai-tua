import { adminDb } from '@/lib/firebaseAdmin';

export async function checkRateLimit(opts: { uid: string; key: string; maxPerDay: number }) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = adminDb.collection('rate_limits').doc(`${opts.key}:${opts.uid}:${day}`);

  const snap = await ref.get();
  const used = snap.exists ? (snap.data()!.count as number) : 0;
  if (used >= opts.maxPerDay) return { ok: false, used };

  await ref.set({ count: used + 1, day, uid: opts.uid, key: opts.key }, { merge: true });
  return { ok: true, used: used + 1 };
}
