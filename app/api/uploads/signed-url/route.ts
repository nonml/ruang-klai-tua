import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Storage } from '@google-cloud/storage';
import { requireUser, authErrorToStatus } from '@/lib/authServer';
import { checkRateLimit } from '@/lib/ratelimit';

const Schema = z.object({
  contentType: z.string().min(3).max(100),
  fileExt: z.string().min(1).max(10).regex(/^[a-zA-Z0-9]+$/),
});

function getStorage() {
  // Uses ADC on GCP. Locally: set GOOGLE_APPLICATION_CREDENTIALS.
  return new Storage();
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const rl = await checkRateLimit({ uid: user.uid, key: 'upload', maxPerDay: 20 });
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const bucketName = process.env.GCS_BUCKET_TEMP!;
    if (!bucketName) return NextResponse.json({ error: 'missing_bucket' }, { status: 500 });

    const now = Date.now();
    const objectName = `uploads-temp/${user.uid}/${now}.${parsed.data.fileExt}`;

    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    // V4 signed URL for PUT upload
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 10 * 60 * 1000, // 10 min
      contentType: parsed.data.contentType,
    });

    return NextResponse.json({
      uploadUrl,
      objectName,
      bucket: bucketName,
      expiresInSec: 600,
    });
  } catch (e) {
    return NextResponse.json({ error: 'auth_error' }, { status: authErrorToStatus(e) });
  }
}
