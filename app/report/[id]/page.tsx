import { listAttachmentsByReport } from '@/lib/attachments';
import { getReportById } from '@/lib/reports';

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const report = await getReportById(params.id);

  if (!report) {
    return <div className="rounded bg-white p-4">ไม่พบเคส</div>;
  }

  const attachments = await listAttachmentsByReport(report.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🧾 เคส #{report.id.slice(0, 8)}</h1>
      <div className="rounded bg-white p-4 space-y-2">
        <div className="text-sm"><span className="font-medium">สถานะ:</span> {report.status}</div>
        <div className="text-sm"><span className="font-medium">โรงเรียน:</span> {report.school_name || '-'}</div>
        <div className="text-sm"><span className="font-medium">ประเภท:</span> {report.category}</div>
        <div className="text-sm"><span className="font-medium">ความเร่งด่วน:</span> {report.severity}</div>
        <div className="text-sm"><span className="font-medium">สิ่งที่เห็น:</span> {report.note || '-'}</div>
        <div className="text-xs text-slate-500">ข้อมูลจากหลักฐาน ณ วันที่ {new Date(report.observed_at).toLocaleDateString('th-TH')}</div>
      </div>

      {attachments.length > 0 && (
        <div className="rounded bg-white p-4 space-y-3">
          <div className="text-sm font-medium">รูปหลักฐานหลังเบลอ</div>
          <div className="grid gap-3 md:grid-cols-3">
            {attachments.map((a) => (
              <a key={a.id} href={a.public_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border">
                <img src={a.public_url} alt="หลักฐาน" className="h-40 w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <form action={`/api/reports/${report.id}/confirm`} method="post">
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">ยืนยัน (Confirm)</button>
        </form>
        <form action={`/api/reports/${report.id}/flag`} method="post">
          <button className="rounded border px-3 py-2 text-sm">รายงาน (Report)</button>
        </form>
      </div>

      <p className="text-xs text-slate-600">
        ระบบนี้ไม่ใช่เวทีกล่าวหาและไม่จัดอันดับบุคคล/โรงเรียน โดยใช้หลักฐานเพื่อแจ้งปัญหาเชิงสาธารณะเท่านั้น
      </p>
    </div>
  );
}
