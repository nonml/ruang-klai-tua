import { adminDb } from '@/lib/firebaseAdmin';

export type Attachment = {
  id: string;
  report_id: string;
  uid: string;
  public_url: string;
  public_object: string;
  temp_object: string | null;
  created_at: string;
};

type AttachmentInput = Omit<Attachment, 'id'>;

const COL = 'attachments';

export async function addAttachment(input: AttachmentInput): Promise<Attachment> {
  const existing = await adminDb.collection(COL).where('public_object', '==', input.public_object).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0]!;
    return { id: doc.id, ...(doc.data() as any) } as Attachment;
  }

  const ref = await adminDb.collection(COL).add(input as any);
  return { id: ref.id, ...input };
}

export async function listAttachmentsByReport(reportId: string): Promise<Attachment[]> {
  const snap = await adminDb
    .collection(COL)
    .where('report_id', '==', reportId)
    .orderBy('created_at', 'asc')
    .limit(10)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Attachment[];
}
