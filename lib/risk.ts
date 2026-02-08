export type RiskInput = {
  note: string;
  ocrText: string;
};

export type RiskResult = {
  score: number; // 0..1
  reasons: string[];
};

const PII_REGEXES: Array<[RegExp, string, number]> = [
  [/\b\d{13}\b/g, 'พบเลขบัตรประชาชน (13 หลัก)', 0.9],
  [/\b0\d{8,9}\b/g, 'พบเบอร์โทรศัพท์', 0.8],
  [/(โกง|กินเงิน|ยักยอก|ทุจริต|รับสินบน)/g, 'พบคำกล่าวหาเสี่ยงหมิ่นประมาท', 0.85],
  [/(เด็ก|นักเรียน).*(ชื่อ|นามสกุล)/g, 'มีโอกาสเกี่ยวข้องข้อมูลเด็ก', 0.85],
];

export async function assessRisk(input: RiskInput): Promise<RiskResult> {
  const text = `${input.note}\n${input.ocrText}`.trim();
  if (!text) return { score: 0.05, reasons: [] };

  let score = 0.05;
  const reasons: string[] = [];

  for (const [re, reason, s] of PII_REGEXES) {
    if (re.test(text)) {
      reasons.push(reason);
      score = Math.max(score, s);
    }
  }

  // TODO: ต่อ LLM classifier/vision เพื่อจับ PII จาก OCR/ภาพ และให้เหตุผลที่ audit ได้
  return { score, reasons };
}
