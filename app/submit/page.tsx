import ReportForm from '@/components/ReportForm';

export default function SubmitPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">➕ ส่งหลักฐาน</h1>
      <p className="text-sm text-slate-700">
        ทุกโพสต์เริ่มเป็น “ยังไม่ยืนยัน” และระบบจะพยายามเบลอข้อมูลส่วนบุคคลอัตโนมัติ
      </p>
      <ReportForm />
    </div>
  );
}
