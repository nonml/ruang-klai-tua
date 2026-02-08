import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Storage } from '@google-cloud/storage';
import { requireUser, authErrorToStatus } from '@/lib/authServer';
import { checkRateLimit } from '@/lib/ratelimit';
import { getClientIp, getIpFingerprint } from '@/lib/requestMeta';
import { buildTempObjectName, buildPublicUrl, tempToPublicObjectName } from '@/lib/uploadPaths';
import { getReportOwnedBy } from '@/lib/reports';
import {
  ALLOWED_CONTENT_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  isAllowedUpload,
} from '@/lib/uploadPolicy';

const Schema = z.object({
  contentType: z.string().min(3).max(100),
  fileExt: z.string().min(1).max(10).regex(/^[a-zA-Z0-9]+$/),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

function getStorage() {
  return new Storage();
}

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
      key: 'upload_request',
      maxPerDay: 30,
      maxPerMinute: 8,
      ipFingerprint: getIpFingerprint(ip),
    });
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    if (!isAllowedUpload(parsed.data.contentType, parsed.data.fileExt)) {
      return NextResponse.json({ error: 'unsupported_file_type' }, { status: 400 });
    }

    const tempBucketName = process.env.GCS_BUCKET_TEMP;
    const publicBucketName = process.env.GCS_BUCKET_PUBLIC;
    if (!tempBucketName || !publicBucketName) {
      return NextResponse.json({ error: 'missing_bucket' }, { status: 500 });
    }

    const objectName = buildTempObjectName({
      uid: user.uid,
      reportId: params.id,
      fileExt: parsed.data.fileExt,
    });
    const publicObjectName = tempToPublicObjectName(objectName);
    const publicUrl = buildPublicUrl(publicBucketName, publicObjectName);

    const storage = getStorage();
    const file = storage.bucket(tempBucketName).file(objectName);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 10 * 60 * 1000,
      contentType: parsed.data.contentType,
    });

    return NextResponse.json({
      uploadUrl,
      objectName,
      publicObjectName,
      publicUrl,
      expiresInSec: 600,
      maxUploadBytes: MAX_UPLOAD_BYTES,
      allowedContentTypes: ALLOWED_CONTENT_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS,
    });
  } catch (e) {
    return NextResponse.json({ error: 'auth_error' }, { status: authErrorToStatus(e) });
  }
}
