import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';

initializeApp();
const db = getFirestore();

const storage = new Storage();
const vision = new ImageAnnotatorClient();
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseTempObject(name: string): { uid: string; reportId: string } | null {
  const parts = name.split('/');
  if (parts.length !== 4) return null;
  const [prefix, uid, reportId] = parts;
  if (prefix !== 'uploads-temp' || !uid || !reportId) return null;
  return { uid, reportId };
}

function toPublicObjectName(tempObject: string): string {
  return tempObject.replace('uploads-temp/', 'uploads-public/').replace(/\.[a-zA-Z0-9]+$/, '.jpg');
}

function processedDocId(tempObject: string): string {
  return Buffer.from(tempObject).toString('base64url');
}

export const blurAndPublish = functions.storage.object().onFinalize(async (object) => {
  const bucketName = object.bucket;
  const name = object.name || '';
  const contentType = object.contentType || '';
  const objectSize = Number(object.size || 0);

  if (!name.startsWith('uploads-temp/')) return;
  if (!contentType.startsWith('image/')) return;

  const parsed = parseTempObject(name);
  if (!parsed) return;

  const pDocId = processedDocId(name);
  if (!ALLOWED_CONTENT_TYPES.has(contentType) || objectSize <= 0 || objectSize > MAX_UPLOAD_BYTES) {
    await db.collection('processed_uploads').doc(pDocId).set(
      {
        uid: parsed.uid,
        report_id: parsed.reportId,
        created_at: new Date().toISOString(),
        temp_object: name,
        status: 'REJECTED_UPLOAD_POLICY',
        size_bytes: objectSize,
        content_type: contentType,
      },
      { merge: true },
    );
    await storage.bucket(bucketName).file(name).delete().catch(() => null);
    return;
  }

  const publicBucket = process.env.GCS_BUCKET_PUBLIC;
  if (!publicBucket) throw new Error('Missing GCS_BUCKET_PUBLIC');

  const tempBucket = storage.bucket(bucketName);
  const [buf] = await tempBucket.file(name).download();

  const [faceRes] = await vision.faceDetection({ image: { content: buf } });
  const faces = faceRes.faceAnnotations || [];

  const [textRes] = await vision.textDetection({ image: { content: buf } });
  const fullText = textRes.fullTextAnnotation?.text || '';
  const piiSignals = {
    has_phone_like: /0\d{8,9}/.test(fullText.replace(/[^0-9]/g, '')),
    has_long_digit_like: /\d{10,}/.test(fullText.replace(/[^0-9]/g, '')),
  };

  let out = sharp(buf);
  const meta = await out.metadata();

  if (meta.width && meta.height) {
    const divisor = faces.length > 0 ? 10 : 20;
    out = out
      .resize(Math.round(meta.width / divisor), Math.round(meta.height / divisor), {
        kernel: sharp.kernel.nearest,
      })
      .resize(meta.width, meta.height, { kernel: sharp.kernel.nearest });
  }

  const outBuf = await out.jpeg({ quality: 85 }).toBuffer();

  const publicName = toPublicObjectName(name);
  const pubBucket = storage.bucket(publicBucket);
  await pubBucket.file(publicName).save(outBuf, {
    contentType: 'image/jpeg',
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  try {
    await pubBucket.file(publicName).makePublic();
  } catch (e) {
    functions.logger.warn('makePublic failed; rely on bucket IAM/public policy', e);
  }

  const publicUrl = `https://storage.googleapis.com/${publicBucket}/${publicName}`;
  const createdAt = new Date().toISOString();

  const processedData = {
    uid: parsed.uid,
    report_id: parsed.reportId,
    created_at: createdAt,
    status: 'PROCESSED',
    temp_object: name,
    public_object: publicName,
    public_url: publicUrl,
    text_chars: fullText.length,
    pii_signals: piiSignals,
    faces: faces.length,
    content_type: contentType,
    size_bytes: objectSize,
  };

  await db.collection('processed_uploads').doc(pDocId).set(processedData, { merge: true });
  await db.collection('attachments_pending').doc(pDocId).set(processedData, { merge: true });

  await tempBucket.file(name).delete().catch(() => null);
});
