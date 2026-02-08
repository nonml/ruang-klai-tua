import SearchBox from '@/components/SearchBox';
import ReportList from '@/components/ReportList';

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🔎 ค้นหา</h1>
      <SearchBox />
      <ReportList />
    </div>
  );
}
