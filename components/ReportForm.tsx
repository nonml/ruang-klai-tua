'use client';

import { useState } from 'react';

const categories = [
  'ห้องน้ำ/สุขาภิบาล',
  'น้ำดื่ม/น้ำใช้',
  'ไฟฟ้า/แสงสว่าง',
  'อาคารชำรุด/อันตราย',
  'อุปกรณ์เรียน/ห้องเรียน',
  'ความปลอดภัยหน้าโรงเรียน/ทางม้าลาย',
  'อาหารกลางวัน (เชิงสังเกต)',
];

export default function ReportForm() {
  const [status, setStatus] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('กำลังส่ง...');
    const form = new FormData(e.currentTarget);
        const consent = form.get('consent');
    if (!consent) {
      setStatus('กรุณายอมรับข้อกำหนดก่อนส่ง');
      return;
    }

    const payload = {
      schoolName: String(form.get('schoolName') || ''),
      category: String(form.get('category') || ''),
      severity: String(form.get('severity') || 'LOW'),
      note: String(form.get('note') || ''),
      lat: Number(form.get('lat') || 0),
      lng: Number(form.get('lng') || 0),
      observedAt: new Date(String(form.get('observedAt') || new Date().toISOString())).toISOString(),
    };

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setStatus('ส่งไม่สำเร็จ: ' + JSON.stringify(j));
      return;
    }
    const j = await res.json();
    setStatus('ส่งสำเร็จ ✅ (สถานะเริ่มต้น: ' + j.data.status + ')');
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="rounded bg-white p-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">ชื่อโรงเรียน</label>
          <input name="schoolName" className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="เช่น โรงเรียน..." />
        </div>

        <div>
          <label className="text-sm font-medium">ประเภทปัญหา</label>
          <select name="category" className="mt-1 w-full rounded border px-3 py-2 text-sm" required>
            <option value="">เลือก...</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">ความเร่งด่วน</label>
          <select name="severity" className="mt-1 w-full rounded border px-3 py-2 text-sm">
            <option value="LOW">ต่ำ</option>
            <option value="MEDIUM">กลาง</option>
            <option value="HIGH">สูง</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">วันที่พบ</label>
          <input name="observedAt" type="date" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">ละติจูด</label>
          <input name="lat" className="mt-1 w-full rounded border px-3 py-2 text-sm" defaultValue="13.7563" />
        </div>

        <div>
          <label className="text-sm font-medium">ลองจิจูด</label>
          <input name="lng" className="mt-1 w-full rounded border px-3 py-2 text-sm" defaultValue="100.5018" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">สิ่งที่เห็น (สั้นๆ)</label>
        <textarea name="note" className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} maxLength={200}
          placeholder="หลีกเลี่ยงการกล่าวหา/ชื่อบุคคล/ข้อมูลเด็ก" />
      </div>

      <div className="flex items-center gap-2">
        <input id="consent" name="consent" type="checkbox" />
        <label htmlFor="consent" className="text-xs text-slate-700">
          ยอมรับ <a className="underline" href="/terms">ข้อกำหนด</a> และ <a className="underline" href="/privacy">นโยบายความเป็นส่วนตัว</a>
        </label>
      </div>

      <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">ส่งหลักฐาน</button>
      {status && <div className="text-xs text-slate-700">{status}</div>}

      <div className="text-xs text-slate-500">
        * ในระบบจริงจะดึงพิกัดจาก GPS อัตโนมัติ และบังคับอัปโหลดรูป 1–3 รูป (พร้อม auto-blur)
      </div>
    </form>
  );
}
