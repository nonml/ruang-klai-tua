import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เรื่องใกล้ตัว | Civic Info Hub',
  description: 'รายงานและติดตามเรื่องใกล้ตัวด้วยหลักฐานและความปลอดภัย',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="font-semibold">🧩 เรื่องใกล้ตัว</div>
            <nav className="flex gap-4 text-sm">
              <a className="hover:underline" href="/login">เข้าสู่ระบบ</a>
              <a className="hover:underline" href="/">ใกล้ฉัน</a>
              <a className="hover:underline" href="/search">ค้นหา</a>
              <a className="hover:underline" href="/submit">ส่งหลักฐาน</a>
              <a className="hover:underline" href="/terms">Terms</a>
              <a className="hover:underline" href="/privacy">Privacy</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mt-10 border-t bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-600">
            ระบบนี้เน้น “ข้อมูลจากหลักฐาน ณ วันที่…” ไม่ใช่เวทีกล่าวหา • โปรดหลีกเลี่ยงข้อมูลส่วนบุคคล
          </div>
        </footer>
      </body>
    </html>
  );
}
