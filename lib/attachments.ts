import { adminDb } from '@/lib/firebaseAdmin';

export type Attachment = {
  report_id: string;
  public_url: string;
  created_at: string;
};

export async function addAttachment(input: Attachment) {
  await adminDb.collection('attachments').add(input as any);
}
