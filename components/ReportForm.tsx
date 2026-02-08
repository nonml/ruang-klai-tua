'use client';

import { useEffect, useRef, useState } from 'react';
import { ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, normalizeExtension } from '@/lib/uploadPolicy';

type DraftPayload = {
  schoolName: string;
  category: string;
  severity: string;
  note: string;
  lat: number;
  lng: number;
  observedAt: string;
};

type DraftAttachment = {
  slot: number;
  fileName: string;
  contentType: string;
  fileExt: string;
  sizeBytes: number;
  status: 'pending_file' | 'requested' | 'uploaded' | 'committed' | 'failed';
  tempObjectName?: string;
  publicObjectName?: string;
  publicUrl?: string;
  error?: string;
};

type UploadDraft = {
  version: 1;
  reportId?: string;
  payload: DraftPayload;
  attachments: DraftAttachment[];
  updatedAt: string;
};

const DRAFT_KEY = 'ruangklaitua:submit:draft:v1';

const categories = [
  'ห้องน้ำ/สุขาภิบาล',
  'น้ำดื่ม/น้ำใช้',
  'ไฟฟ้า/แสงสว่าง',
  'อาคารชำรุด/อันตราย',
  'อุปกรณ์เรียน/ห้องเรียน',
  'ความปลอดภัยหน้าโรงเรียน/ทางม้าลาย',
  'อาหารกลางวัน (เชิงสังเกต)',
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readDraft(): UploadDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UploadDraft;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(draft: UploadDraft) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
}

function clearDraft() {
  window.localStorage.removeItem(DRAFT_KEY);
}

async function commitWithRetry(reportId: string, item: DraftAttachment): Promise<void> {
  if (!item.publicUrl || !item.publicObjectName || !item.tempObjectName) {
    throw new Error('attachment_payload_incomplete');
  }

  const maxRetry = 24;
  for (let i = 0; i < maxRetry; i += 1) {
    const res = await fetch(`/api/reports/${reportId}/attachments/commit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        publicUrl: item.publicUrl,
        publicObjectName: item.publicObjectName,
        tempObjectName: item.tempObjectName,
      }),
    });

    if (res.ok) return;
    if (res.status === 409) {
      await sleep(2500);
      continue;
    }

    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `commit_failed_${res.status}`);
  }

  throw new Error('processing_timeout');
}

export default function ReportForm() {
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const isRecoveringRef = useRef(false);

  useEffect(() => {
    const draft = readDraft();
    if (!draft || !draft.reportId) return;

    const resumable = draft.attachments.filter(
      (a) => (a.status === 'requested' || a.status === 'uploaded') && a.tempObjectName && a.publicObjectName && a.publicUrl,
    );

    if (resumable.length === 0) {
      if (draft.attachments.some((a) => a.status === 'pending_file')) {
        setStatus('พบรายการส่งค้างอยู่ กรุณาเลือกไฟล์อีกครั้งเพื่ออัปโหลดต่อ');
      }
      return;
    }

    isRecoveringRef.current = true;
    setStatus('กำลังกู้สถานะอัปโหลดค้าง...');

    (async () => {
      let local = draft;
      for (const item of resumable) {
        try {
          await commitWithRetry(local.reportId!, item);
          local = {
            ...local,
            attachments: local.attachments.map((a) =>
              a.slot === item.slot ? { ...a, status: 'committed', error: undefined } : a,
            ),
            updatedAt: new Date().toISOString(),
          };
          saveDraft(local);
        } catch (e) {
          local = {
            ...local,
            attachments: local.attachments.map((a) =>
              a.slot === item.slot ? { ...a, status: 'failed', error: String(e) } : a,
            ),
            updatedAt: new Date().toISOString(),
          };
          saveDraft(local);
          setStatus(`กู้งานบางส่วนไม่สำเร็จ: ${String(e)}`);
          isRecoveringRef.current = false;
          return;
        }
      }

      if (local.attachments.every((a) => a.status === 'committed')) {
        clearDraft();
        setStatus('กู้สถานะสำเร็จ: ไฟล์แนบถูกผูกกับรายงานเรียบร้อยแล้ว');
      }
      isRecoveringRef.current = false;
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading || isRecoveringRef.current) return;

    setUploading(true);
    setStatus('กำลังส่ง...');

    const form = new FormData(e.currentTarget);
    const consent = form.get('consent');
    if (!consent) {
      setUploading(false);
      setStatus('กรุณายอมรับข้อกำหนดก่อนส่ง');
      return;
    }

    const selected = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (selected.length < 1 || selected.length > 3) {
      setUploading(false);
      setStatus('กรุณาแนบรูปหลักฐาน 1-3 รูป');
      return;
    }
    const files = selected.slice(0, 3);
    for (const f of files) {
      const ext = normalizeExtension(f.name.split('.').pop() || '');
      const contentType = f.type || 'image/jpeg';
      if (!ALLOWED_CONTENT_TYPES.includes(contentType as any) || !ALLOWED_EXTENSIONS.includes(ext as any)) {
        setUploading(false);
        setStatus('รองรับเฉพาะไฟล์ JPG/PNG/WEBP เท่านั้น');
        return;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        setUploading(false);
        setStatus('ไฟล์ใหญ่เกินกำหนด (สูงสุด 10MB ต่อรูป)');
        return;
      }
    }

    const payload: DraftPayload = {
      schoolName: String(form.get('schoolName') || ''),
      category: String(form.get('category') || ''),
      severity: String(form.get('severity') || 'LOW'),
      note: String(form.get('note') || ''),
      lat: Number(form.get('lat') || 0),
      lng: Number(form.get('lng') || 0),
      observedAt: new Date(String(form.get('observedAt') || new Date().toISOString())).toISOString(),
    };

    let draft: UploadDraft = {
      version: 1,
      payload,
      attachments: files.map((f, idx) => ({
        slot: idx,
        fileName: f.name,
        contentType: f.type || 'image/jpeg',
        fileExt: normalizeExtension(f.name.split('.').pop() || 'jpg') || 'jpg',
        sizeBytes: f.size,
        status: 'pending_file',
      })),
      updatedAt: new Date().toISOString(),
    };
    saveDraft(draft);

    try {
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!reportRes.ok) {
        const j = await reportRes.json().catch(() => ({}));
        throw new Error(`create_report_failed: ${JSON.stringify(j)}`);
      }

      const reportJson = await reportRes.json();
      const reportId = String(reportJson?.data?.id || '');
      if (!reportId) throw new Error('missing_report_id');

      draft = { ...draft, reportId, updatedAt: new Date().toISOString() };
      saveDraft(draft);

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]!;
        const base = draft.attachments[i]!;

        const requestRes = await fetch(`/api/reports/${reportId}/attachments/request`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contentType: base.contentType,
            fileExt: base.fileExt,
            sizeBytes: base.sizeBytes,
          }),
        });
        if (!requestRes.ok) {
          const j = await requestRes.json().catch(() => ({}));
          throw new Error(`request_upload_failed: ${JSON.stringify(j)}`);
        }

        const requestJson = await requestRes.json();
        const nextAttachment: DraftAttachment = {
          ...base,
          status: 'requested',
          tempObjectName: requestJson.objectName,
          publicObjectName: requestJson.publicObjectName,
          publicUrl: requestJson.publicUrl,
          error: undefined,
        };

        draft = {
          ...draft,
          attachments: draft.attachments.map((a) => (a.slot === i ? nextAttachment : a)),
          updatedAt: new Date().toISOString(),
        };
        saveDraft(draft);

        const putRes = await fetch(requestJson.uploadUrl, {
          method: 'PUT',
          headers: { 'content-type': base.contentType },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(`upload_failed_${putRes.status}`);
        }

        draft = {
          ...draft,
          attachments: draft.attachments.map((a) => (a.slot === i ? { ...a, status: 'uploaded' } : a)),
          updatedAt: new Date().toISOString(),
        };
        saveDraft(draft);

        await commitWithRetry(reportId, nextAttachment);

        draft = {
          ...draft,
          attachments: draft.attachments.map((a) => (a.slot === i ? { ...a, status: 'committed' } : a)),
          updatedAt: new Date().toISOString(),
        };
        saveDraft(draft);

        setStatus(`อัปโหลดและผูกรูปสำเร็จ ${i + 1}/${files.length}`);
      }

      clearDraft();
      setStatus(`ส่งสำเร็จ ✅ รายงานถูกสร้างและผูกรูป ${files.length} รูปเรียบร้อย`);
      e.currentTarget.reset();
    } catch (err) {
      setStatus(`ส่งไม่สำเร็จ: ${String(err)}`);
    } finally {
      setUploading(false);
    }
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
        <textarea
          name="note"
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          rows={3}
          maxLength={200}
          placeholder="หลีกเลี่ยงการกล่าวหา/ชื่อบุคคล/ข้อมูลเด็ก"
        />
      </div>

      <div>
        <label className="text-sm font-medium">แนบรูปหลักฐาน (1-3 รูป)</label>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          required
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input id="consent" name="consent" type="checkbox" />
        <label htmlFor="consent" className="text-xs text-slate-700">
          ยอมรับ <a className="underline" href="/terms">ข้อกำหนด</a> และ <a className="underline" href="/privacy">นโยบายความเป็นส่วนตัว</a>
        </label>
      </div>

      <button disabled={uploading} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
        {uploading ? 'กำลังส่ง...' : 'ส่งหลักฐาน'}
      </button>
      {status && <div className="text-xs text-slate-700">{status}</div>}

      <div className="text-xs text-slate-500">
        ระบบจะสร้างรายงานก่อน แล้วอัปโหลดรูปเข้า temp bucket เพื่อเบลออัตโนมัติก่อนเผยแพร่
      </div>
    </form>
  );
}
