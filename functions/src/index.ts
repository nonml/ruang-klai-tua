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

/**
 * Storage trigger:
 * 1) รับไฟล์จาก bucket temp (uploads-temp/**)
 * 2) ใช้ Vision ตรวจ face/plate/text ที่เป็น PII
 * 3) เบลอ + เขียนไป bucket public (uploads-public/**)
 * 4) บันทึก attachment ลง Firestore
 *
 * NOTE: โค้ดนี้เป็น “สเกลตันพร้อมจุดสำคัญ” เพื่อให้ต่อให้ครบจริงได้เร็ว
 */
export const blurAndPublish = functions.storage.object().onFinalize(async (object) => {
  const bucketName = object.bucket;
  const name = object.name || '';
  const contentType = object.contentType || '';

  // only process temp uploads
  if (!name.startsWith('uploads-temp/')) return;
  if (!contentType.startsWith('image/')) return;

  const publicBucket = process.env.GCS_BUCKET_PUBLIC;
  if (!publicBucket) throw new Error('Missing GCS_BUCKET_PUBLIC');

  const tempBucket = storage.bucket(bucketName);
  const [buf] = await tempBucket.file(name).download();

  // Vision detect
  // Faces
  const [faceRes] = await vision.faceDetection({ image: { content: buf } });
  const faces = faceRes.faceAnnotations || [];

  // Text (for PII text blur): optional
  const [textRes] = await vision.textDetection({ image: { content: buf } });
  const fullText = textRes.fullTextAnnotation?.text || '';

  // TODO: Detect plate numbers etc. (Vision does not have plate API; use text detection + heuristics)
  // TODO: Expand PII extraction rules based on Thai context

  // Build blur regions (very simplified: blur entire image if faces detected, as safe default)
  let out = sharp(buf);
  const meta = await out.metadata();

  if (faces.length > 0 && meta.width && meta.height) {
    // Safe default: pixelate entire image if any face detected (prevents leakage)
    out = out.resize(Math.round(meta.width / 10), Math.round(meta.height / 10), { kernel: sharp.kernel.nearest })
             .resize(meta.width, meta.height, { kernel: sharp.kernel.nearest });
  }

  // TODO: If no faces, still blur likely PII regions (text boxes) from text detection.
  // For MVP safety: apply mild pixelation always
  if (faces.length === 0 && meta.width && meta.height) {
    out = out.resize(Math.round(meta.width / 20), Math.round(meta.height / 20), { kernel: sharp.kernel.nearest })
             .resize(meta.width, meta.height, { kernel: sharp.kernel.nearest });
  }

  const outBuf = await out.jpeg({ quality: 85 }).toBuffer();

  // Write to public bucket
  const publicName = name.replace('uploads-temp/', 'uploads-public/').replace(/\.[a-zA-Z0-9]+$/, '.jpg');
  const pubBucket = storage.bucket(publicBucket);
  await pubBucket.file(publicName).save(outBuf, {
    contentType: 'image/jpeg',
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  // Make it publicly readable (or use signed read URLs; choose one policy)
  await pubBucket.file(publicName).makePublic();

  const publicUrl = `https://storage.googleapis.com/${publicBucket}/${publicName}`;

  // Derive report_id from path convention if you embed it in object name (recommended)
  // current convention: uploads-temp/{uid}/{timestamp}.ext => no report_id yet.
  // TODO: Change upload naming to include report_id, e.g. uploads-temp/{uid}/{reportId}/{timestamp}.ext
  await db.collection('processed_uploads').add({
    created_at: new Date().toISOString(),
    temp_object: name,
    public_object: publicName,
    public_url: publicUrl,
    text_extract: fullText.slice(0, 5000),
    faces: faces.length,
  });

  // Optionally delete temp file
  await tempBucket.file(name).delete().catch(() => null);
});
