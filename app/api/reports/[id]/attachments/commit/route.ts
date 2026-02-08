import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, authErrorToStatus } from '@/lib/authServer';
import { checkRateLimit } from '@/lib/ratelimit';
import { getClientIp, getIpFingerprint } from '@/lib/requestMeta';
import {
  parseTempObjectName,
  processedUploadDocId,
  tempToPublicObjectName,
} from '@/lib/uploadPaths';
import { getReportOwnedBy } from '@/lib/reports';
import { adminDb } from '@/lib/firebaseAdmin';
import { addAttachment } from '@/lib/attachments';

const Schema = z.object({
  publicUrl: z.string().url(),
  publicObjectName: z.string().min(10),
  tempObjectName: z.string().min(10).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const report = await getReportOwnedBy(params.id, user.uid);
    if (!report) {
      return NextResponse.json({ error: 'report_not_found_or_forbidden' }, { status: 404 });
    }

    const ip = getClientIp(req);
    const rl = await checkRateLimit({
      uid: user.uid,
      key: 'attachment_commit',
      maxPerDay: 40,
      maxPerMinute: 12,
      ipFingerprint: getIpFingerprint(ip),
    });
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    let processed: any = null;
    let tempObjectName = parsed.data.tempObjectName;

    if (tempObjectName) {
      const path = parseTempObjectName(tempObjectName);
      if (!path || path.uid !== user.uid || path.reportId !== params.id) {
        return NextResponse.json({ error: 'forbidden_temp_object' }, { status: 403 });
      }

      const expectedPublicObject = tempToPublicObjectName(tempObjectName);
      if (expectedPublicObject !== parsed.data.publicObjectName) {
        return NextResponse.json({ error: 'public_object_mismatch' }, { status: 400 });
      }

      const processedId = processedUploadDocId(tempObjectName);
      processed = await adminDb.collection('processed_uploads').doc(processedId).get();
    } else {
      const snap = await adminDb
        .collection('processed_uploads')
        .where('uid', '==', user.uid)
        .where('report_id', '==', params.id)
        .where('public_object', '==', parsed.data.publicObjectName)
        .limit(1)
        .get();
      processed = snap.empty ? null : snap.docs[0]!;
      tempObjectName = snap.empty ? undefined : String(snap.docs[0]!.data().temp_object || '');
    }

    if (!processed || !processed.exists) {
      return NextResponse.json({ error: 'not_processed_yet' }, { status: 409 });
    }

    const pdata = processed.data() as any;
    if (pdata.status && pdata.status !== 'PROCESSED') {
      return NextResponse.json({ error: 'upload_rejected_by_policy' }, { status: 400 });
    }
    if (pdata.uid !== user.uid || pdata.report_id !== params.id) {
      return NextResponse.json({ error: 'processed_upload_forbidden' }, { status: 403 });
    }
    if (pdata.public_object !== parsed.data.publicObjectName || pdata.public_url !== parsed.data.publicUrl) {
      return NextResponse.json({ error: 'processed_upload_mismatch' }, { status: 400 });
    }

    const attachment = await addAttachment({
      report_id: params.id,
      uid: user.uid,
      public_url: pdata.public_url,
      public_object: pdata.public_object,
      temp_object: tempObjectName || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ data: attachment });
  } catch (e) {
    return NextResponse.json({ error: 'auth_error' }, { status: authErrorToStatus(e) });
  }
}
