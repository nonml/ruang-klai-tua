import { describe, it, expect } from 'vitest';
import { assessRisk } from './risk';

describe('assessRisk', () => {
  it('flags defamation keywords', async () => {
    const r = await assessRisk({ note: 'เขาโกงแน่', ocrText: '' });
    expect(r.score).toBeGreaterThan(0.5);
  });
  it('low risk for empty', async () => {
    const r = await assessRisk({ note: '', ocrText: '' });
    expect(r.score).toBeLessThan(0.2);
  });
});
