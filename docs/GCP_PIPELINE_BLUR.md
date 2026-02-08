# GCP Pipeline: blur ก่อนเผยแพร่ (สเปคสั้น)

## เป้าหมาย
- รูปที่ผู้ใช้อัปโหลดต้องผ่านการเบลอ (หน้า/ทะเบียน/บ้านเลขที่/PII text) ก่อนถูกเผยแพร่
- ลดความเสี่ยง PDPA/doxxing ตั้งแต่ต้นน้ำ

## สถาปัตยกรรมที่แนะนำ (Google-first)
1) Client สร้าง report ก่อน แล้วขอ **signed upload URL** จาก `/api/reports/{id}/attachments/request`
2) Client อัปโหลดขึ้น path `uploads-temp/{uid}/{reportId}/{timestamp}.ext` ใน TEMP bucket
3) Cloud Function (Storage trigger) ทำ:
   - ใช้ Vision API ตรวจ face/plate/text
   - เบลอ แล้วเขียนไป **uploads-public/**
   - บันทึก metadata กลับ Firestore `processed_uploads` / `attachments_pending`
4) Client เรียก `/api/reports/{id}/attachments/commit` เพื่อยืนยันและบันทึกลง `attachments`
5) ฝั่งหน้าเว็บ แสดงเฉพาะ public URLs จาก `attachments`

## หมายเหตุ
- ใน MVP ถ้ายังไม่ทำ Vision/blur: ให้บังคับ “crop/ปิดทับ” ใน client ก่อนอัปโหลด
