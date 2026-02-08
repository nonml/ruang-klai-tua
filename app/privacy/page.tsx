import privacy from '@/docs/privacy';

export default function PrivacyPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">นโยบายความเป็นส่วนตัว</h1>
      <div className="rounded bg-white p-4">
        <pre className="whitespace-pre-wrap text-sm">{privacy}</pre>
      </div>
    </div>
  );
}
