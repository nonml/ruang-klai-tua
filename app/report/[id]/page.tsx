import { getReportById } from '@/lib/reports';

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const report = await getReportById(params.id);

  if (!report) {
    return <div className="rounded bg-white p-4">ไม่พบเคส</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🧾 เคส #{report.id.slice(0, 8)}</h1>
      <div className="rounded bg-white p-4 space-y-2">
        <div className="text-sm"><span className="font-medium">สถานะ:</span> {report.status}</div>
        <div className="text-sm"><span className="font-medium">โรงเรียน:</span> {report.school_name || '-'}</div>
        <div className="text-sm"><span className="font-medium">ประเภท:</span> {report.category}</div>
        <div className="text-sm"><span className="font-medium">ความเร่งด่วน:</span> {report.severity}</div>
        <div className="text-sm"><span className="font-medium">สิ่งที่เห็น:</span> {report.note || '-'}</div>
        <div className="text-xs text-slate-500">วันที่พบ: {new Date(report.observed_at).toLocaleDateString('th-TH')}</div>
      </div>

      <div className="flex gap-2">
        <form action={`/api/reports/${report.id}/confirm`} method="post">
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">ยืนยัน (Confirm)</button>
        </form>
        <form action={`/api/reports/${report.id}/flag`} method="post">
          <button className="rounded border px-3 py-2 text-sm">รายงาน (Report)</button>
        </form>
      </div>

      <p className="text-xs text-slate-600">
        หมายเหตุ: ปุ่มยืนยัน/รายงานในสเกลตันนี้เป็นตัวอย่าง flow — ในระบบจริงจะผูกกับตัวตน (LINE) และมี rate limit
      </p>
    </div>
  );
}
