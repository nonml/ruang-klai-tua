import { adminDb } from '../lib/firebaseAdmin';

async function main() {
  const now = new Date().toISOString();
  const samples = [
    {
      created_at: now,
      school_name: 'ตัวอย่างโรงเรียน 1',
      category: 'ห้องน้ำ/สุขาภิบาล',
      severity: 'MEDIUM',
      note: 'ตัวอย่าง: ห้องน้ำชำรุด (หลีกเลี่ยงข้อมูลส่วนบุคคล)',
      lat: 13.7563,
      lng: 100.5018,
      observed_at: now,
      status: 'PENDING',
      risk_score: 0.05,
      risk_reasons: [],
      confirm_count: 0,
      flag_count: 0,
      owner_uid: 'seed',
    },
  ];

  for (const s of samples) {
    await adminDb.collection('reports').add(s as any);
  }
  console.log('seeded', samples.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
