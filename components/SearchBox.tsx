export default function SearchBox() {
  return (
    <div className="rounded bg-white p-4 space-y-2">
      <div className="text-sm font-medium">ตัวอย่างช่องค้นหา (MVP)</div>
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="พิมพ์ชื่อโรงเรียน/ประเภทปัญหา (ยังไม่เชื่อมจริง)"
      />
      <div className="text-xs text-slate-500">
        หมายเหตุ: ในเฟส 1 จะทำ autocomplete ชื่อโรงเรียน + entity resolution
      </div>
    </div>
  );
}
