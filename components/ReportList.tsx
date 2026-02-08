import Link from 'next/link';
import { listReports } from '@/lib/reports';

export default async function ReportList() {
  const reports = await listReports({ limit: 20 });

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <Link key={r.id} href={`/report/${r.id}`} className="block rounded bg-white p-4 hover:shadow">
          <div className="flex items-center justify-between">
            <div className="font-medium">{r.school_name || 'โรงเรียน (ไม่ระบุ)'}</div>
            <span className="text-xs rounded px-2 py-1 border">{r.status}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {r.category} • {r.severity}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {new Date(r.observed_at).toLocaleDateString('th-TH')} • risk {Math.round((r.risk_score ?? 0) * 100)}%
          </div>
        </Link>
      ))}
      {reports.length === 0 && <div className="rounded bg-white p-4 text-sm">ยังไม่มีข้อมูล</div>}
    </div>
  );
}
