import { adminDb } from '@/lib/firebaseAdmin';

export type ReportStatus = 'PENDING' | 'VERIFIED' | 'HELD' | 'HIDDEN';

export type ReportRow = {
  id: string;
  created_at: string;
  school_name: string | null;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  note: string | null;
  lat: number;
  lng: number;
  observed_at: string;
  status: ReportStatus;
  risk_score: number | null;
  risk_reasons: string[] | null;
  confirm_count: number;
  flag_count: number;
  owner_uid: string; // Firebase uid
};

const COL = 'reports';

export async function listReports({ limit }: { limit: number }): Promise<ReportRow[]> {
  const snap = await adminDb
    .collection(COL)
    .where('status', '!=', 'HIDDEN')
    .orderBy('status')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ReportRow[];
}

export async function getReportById(id: string): Promise<ReportRow | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as any) } as ReportRow;
}

export async function createReport(input: Omit<ReportRow, 'id'>): Promise<ReportRow | null> {
  const ref = await adminDb.collection(COL).add(input as any);
  return { id: ref.id, ...input };
}

export async function confirmReport(id: string, byUid: string): Promise<ReportRow | null> {
  const ref = adminDb.collection(COL).doc(id);
  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const r = snap.data() as any;

    const confirms = (r.confirms ?? {}) as Record<string, boolean>;
    if (confirms[byUid]) return { id: snap.id, ...r } as ReportRow;

    confirms[byUid] = true;
    const confirm_count = Object.keys(confirms).length;
    let status: ReportStatus = r.status;
    if (r.status === 'PENDING' && confirm_count >= 2) status = 'VERIFIED';

    tx.update(ref, { confirms, confirm_count, status });
    return { id: snap.id, ...r, confirms, confirm_count, status } as ReportRow;
  });
}

export async function flagReport(id: string, byUid: string): Promise<ReportRow | null> {
  const ref = adminDb.collection(COL).doc(id);
  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const r = snap.data() as any;

    const flags = (r.flags ?? {}) as Record<string, boolean>;
    if (flags[byUid]) return { id: snap.id, ...r } as ReportRow;

    flags[byUid] = true;
    const flag_count = Object.keys(flags).length;
    let status: ReportStatus = r.status;
    if (flag_count >= 3) status = 'HIDDEN';

    tx.update(ref, { flags, flag_count, status });
    return { id: snap.id, ...r, flags, flag_count, status } as ReportRow;
  });
}
