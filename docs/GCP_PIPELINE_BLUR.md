# GCP Pipeline: blur ก่อนเผยแพร่ (สเปคสั้น)

## เป้าหมาย
- รูปที่ผู้ใช้อัปโหลดต้องผ่านการเบลอ (หน้า/ทะเบียน/บ้านเลขที่/PII text) ก่อนถูกเผยแพร่
- ลดความเสี่ยง PDPA/doxxing ตั้งแต่ต้นน้ำ

## สถาปัตยกรรมที่แนะนำ (Google-first)
1) Client ขอ **signed upload URL** จาก `/api/uploads/signed-url`
2) Client อัปโหลดขึ้น **GCS bucket: uploads-temp/**
3) Cloud Function (Storage trigger) ทำ:
   - ใช้ Vision API ตรวจ face/plate/text
   - เบลอ แล้วเขียนไป **uploads-public/**
   - บันทึก metadata กลับ Firestore `attachments`
4) ฝั่งหน้าเว็บ แสดงเฉพาะ public URLs

## หมายเหตุ
- ใน MVP ถ้ายังไม่ทำ Vision/blur: ให้บังคับ “crop/ปิดทับ” ใน client ก่อนอัปโหลด
