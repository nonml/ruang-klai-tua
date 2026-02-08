import ReportList from '@/components/ReportList';

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">📍 ใกล้ฉัน</h1>
      <p className="text-sm text-slate-700">
        แสดงเคสล่าสุด (ตัวอย่าง UI) — เวอร์ชัน MVP จะเติม “แผนที่ + ฟิลเตอร์ระยะ” ในรอบถัดไป
      </p>
      <ReportList />
    </div>
  );
}
