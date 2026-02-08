# Deploy บน GCP/Firebase (Production-ish)

เอกสารนี้ใช้กับแอป "เรื่องใกล้ตัว" (Next.js + Firebase + Cloud Run + Cloud Functions)

## 0) สิ่งที่ต้องมี
- `gcloud` CLI
- `firebase-tools`
- Docker (ถ้า build local)
- Billing เปิดบน Google Cloud project

## 1) สร้างโปรเจกต์และเปิดบริการ
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com
```

Firebase:
```bash
firebase login
firebase use --add
```

เปิดบริการใน Firebase Console:
- Authentication (Google provider)
- Firestore (Native mode)
- Storage

## 2) สร้าง buckets
ตั้งชื่อ bucket ตัวอย่าง:
- TEMP: `<PROJECT_ID>-uploads-temp`
- PUBLIC: `<PROJECT_ID>-uploads-public`

```bash
gcloud storage buckets create gs://<PROJECT_ID>-uploads-temp --location=asia-southeast1
gcloud storage buckets create gs://<PROJECT_ID>-uploads-public --location=asia-southeast1
```

ทำ PUBLIC bucket ให้อ่านได้:
```bash
gcloud storage buckets add-iam-policy-binding gs://<PROJECT_ID>-uploads-public \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

## 3) ตั้ง CORS สำหรับ signed URL PUT
สร้างไฟล์ `cors-temp.json`:
```json
[
  {
    "origin": ["https://<YOUR_DOMAIN>", "http://localhost:3000"],
    "method": ["PUT", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

ใช้ CORS กับ TEMP bucket:
```bash
gcloud storage buckets update gs://<PROJECT_ID>-uploads-temp --cors-file=cors-temp.json
```

## 4) ตั้งค่า Firestore/Storage Rules + Index
ใน repo นี้มีไฟล์:
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`

Deploy rules/index:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 5) ตั้งค่า Environment Variables

### 5.1 สำหรับ Next.js (Cloud Run)
ต้องมีค่าต่อไปนี้:
- `NEXT_PUBLIC_BASE_URL=https://<YOUR_DOMAIN_OR_RUN_URL>`
- `NEXT_PUBLIC_FIREBASE_API_KEY=...`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=<PROJECT_ID>`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<PROJECT_ID>.appspot.com` (หรือ bucket หลักที่ใช้ client SDK)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...`
- `NEXT_PUBLIC_FIREBASE_APP_ID=...`
- `GCS_BUCKET_TEMP=<PROJECT_ID>-uploads-temp`
- `GCS_BUCKET_PUBLIC=<PROJECT_ID>-uploads-public`
- `MAX_UPLOAD_BYTES=10485760` (แนะนำ 10MB ต่อรูป)

หมายเหตุ: Cloud Run/Functions ใช้ ADC ได้ ไม่ต้องใส่ service account JSON หาก IAM ถูกต้อง

### 5.2 สำหรับ Cloud Functions
ต้องมี:
- `GCS_BUCKET_PUBLIC=<PROJECT_ID>-uploads-public`
- `MAX_UPLOAD_BYTES=10485760`

ตั้งค่า (Functions v1 runtime config):
```bash
firebase functions:config:set app.gcs_bucket_public="<PROJECT_ID>-uploads-public"
```
หรือใช้ env ตามวิธีที่ทีมใช้อยู่ (repo นี้อ่านจาก `process.env.GCS_BUCKET_PUBLIC`)

## 6) Deploy Cloud Functions (blurAndPublish)
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

ตรวจว่า trigger ทำงานกับ object finalize และ service account มีสิทธิ์:
- อ่าน TEMP bucket
- เขียน PUBLIC bucket
- เขียน Firestore collections `processed_uploads`, `attachments_pending`

## 7) Deploy Next.js ไป Cloud Run

Build + push image ด้วย Cloud Build:
```bash
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/<PROJECT_ID>/ruang-klai-tua/web:latest
```

Deploy:
```bash
gcloud run deploy ruang-klai-tua-web \
  --image asia-southeast1-docker.pkg.dev/<PROJECT_ID>/ruang-klai-tua/web:latest \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NEXT_PUBLIC_BASE_URL=https://<RUN_URL>,GCS_BUCKET_TEMP=<PROJECT_ID>-uploads-temp,GCS_BUCKET_PUBLIC=<PROJECT_ID>-uploads-public,NEXT_PUBLIC_FIREBASE_API_KEY=<...>,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<...>,NEXT_PUBLIC_FIREBASE_PROJECT_ID=<PROJECT_ID>,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<...>,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<...>,NEXT_PUBLIC_FIREBASE_APP_ID=<...>
```

หลัง deploy ให้แก้ `NEXT_PUBLIC_BASE_URL` เป็น custom domain จริงถ้ามี

## 8) ตั้ง Custom Domain (ถ้ามี)
- ใช้ Cloud Run domain mapping หรือวางหลัง Load Balancer
- บังคับ HTTPS
- อัปเดต `NEXT_PUBLIC_BASE_URL` ให้ตรงโดเมนจริง

## 9) Smoke Test Checklist
1. Login ด้วย Google ได้และได้ session cookie
2. ส่งรายงานใหม่ได้เมื่อกดยอมรับ consent
3. แนบรูป 1-3 รูปได้
4. เส้นทางอัปโหลดทำงานครบ:
- `POST /api/reports`
- `POST /api/reports/{id}/attachments/request`
- PUT signed URL ไป TEMP bucket
- Function `blurAndPublish` ทำงาน
- `POST /api/reports/{id}/attachments/commit` สำเร็จ
5. หน้า `/report/{id}` แสดงรูปจาก `attachments`
6. ปุ่ม confirm/flag ทำงานและกันกดซ้ำ
7. report ถูกซ่อนอัตโนมัติเมื่อ `flag_count >= 3`
  - มี safeguard: ถ้า report มี confirm เพียงพอ ระบบจะไม่ซ่อนอัตโนมัติทันที
8. เคส risk สูงเริ่มที่สถานะ `HELD`

## 10) หมายเหตุ MVP
- Query หน้า list ใช้รูปแบบเลี่ยง `where !=` เพื่อไม่ชน index ซับซ้อน
- หากเปิดใช้ query ซับซ้อนเพิ่ม ให้เพิ่ม index ใน `firestore.indexes.json` แล้ว deploy ใหม่
- TEMP bucket ถูกเขียนผ่าน signed URL เท่านั้น (client SDK write ถูกปิดด้วย storage rules)
