# Deploy บน Google (Firebase + GCP) 🚀

> เป้าหมาย: ใช้บริการ Google ให้ครบวงจร: Auth, Firestore, Storage, Functions, Hosting/Run

## A) ตั้งค่า Firebase Project
1) สร้าง Firebase project
2) เปิดใช้:
- Authentication (Google Sign-in)
- Firestore
- Cloud Storage
- Cloud Functions

## B) ตั้งค่า Storage buckets
สร้าง 2 bucket:
- TEMP: `GCS_BUCKET_TEMP` (private) เช่น `ruangklaitua-temp`
- PUBLIC: `GCS_BUCKET_PUBLIC` (public-read หรือใช้ signed read ก็ได้) เช่น `ruangklaitua-public`

## C) ตั้งค่า env
### Next.js (Cloud Run หรือ Hosting + Functions)
ตั้งค่า env:
- `GCS_BUCKET_TEMP=...`
- `GCS_BUCKET_PUBLIC=...`
- Firebase client vars (`NEXT_PUBLIC_FIREBASE_*`)
- (Server) ใช้ **ADC** บน GCP (แนะนำ)

### Functions
ตั้งค่า env ของ Functions:
- `GCS_BUCKET_PUBLIC=...`

## D) Deploy แนวทาง 2 แบบ
### แบบ 1 (แนะนำสำหรับ MVP): Cloud Run สำหรับ Next.js + Firebase Functions สำหรับ blur
1) Build Next.js และ deploy เข้า Cloud Run
2) Deploy Functions: `cd functions && npm i && npm run build && firebase deploy --only functions`
3) ตั้งโดเมน/HTTPS

### แบบ 2: Firebase Hosting + Functions (ต้องมี next-on-functions setup)
Repo นี้ให้สเกลตันไว้ แต่ production แนะนำ Cloud Run จะยืดหยุ่นกว่า

## E) Flow อัปโหลดภาพ (MVP)
1) Client ขอ signed URL: `POST /api/uploads/signed-url`
2) Client PUT รูปไปยัง `gs://TEMP/uploads-temp/{uid}/{ts}.ext`
3) Function `blurAndPublish` ทำ blur แล้วคัดไป public bucket
4) Client/Server ผูก public URL เข้ากับ report (แนะนำใส่ reportId ในชื่อ object)

## TODO ที่ควรให้ Codex ปิดงาน
- ปรับ naming ให้มี reportId: `uploads-temp/{uid}/{reportId}/{ts}.ext`
- เพิ่ม endpoint `/api/reports/{id}/attach` เพื่อผูกไฟล์ที่ blur แล้วเข้ากับ report
- เพิ่ม CORS config ให้ PUT upload ทำงานจากเว็บ
