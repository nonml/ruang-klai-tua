import terms from '@/docs/terms';

export default function TermsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">ข้อกำหนดการใช้งาน</h1>
      <div className="rounded bg-white p-4 prose max-w-none">
        <pre className="whitespace-pre-wrap text-sm">{terms}</pre>
      </div>
    </div>
  );
}
