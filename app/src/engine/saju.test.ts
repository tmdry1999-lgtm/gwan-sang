import { describe, expect, it } from 'vitest';
import { computeSaju, tallyPillars } from './saju';

describe('오행 집계', () => {
  it('글자마다 1점, 0개인 오행은 missing', () => {
    const r = tallyPillars(['경오', '신사', '경진', '계미']);
    expect(r.counts).toEqual({ 목: 0, 화: 2, 토: 2, 금: 3, 수: 1 });
    expect(r.dominant).toBe('금');
    expect(r.missing).toEqual(['목']);
  });

  it('동점이면 일간 오행 우선', () => {
    // 화3 금3, 일간 = 경(금)
    const r = tallyPillars(['병오', '경신', '경자', '병인']);
    expect(r.dominant).toBe('금');
  });
});

describe('생년월일 → 사주', () => {
  it('시간이 있으면 4주', () => {
    const r = computeSaju({ calendar: 'solar', year: 1990, month: 5, day: 15, isLeapMonth: false, hour: 14 });
    expect(r.pillars).toHaveLength(4);
    expect(r.pillars.slice(0, 3)).toEqual(['경오', '신사', '경진']);
  });

  it('시간이 없으면 3주', () => {
    const r = computeSaju({ calendar: 'solar', year: 1990, month: 5, day: 15, isLeapMonth: false, hour: null });
    expect(r.pillars).toEqual(['경오', '신사', '경진']);
    expect(r.missing).toEqual(['목', '수']);
    expect(r.lunar).toEqual({ year: 1990, month: 4, day: 21 });
  });

  it('음력 입력은 양력으로 바꿔 계산', () => {
    const r = computeSaju({ calendar: 'lunar', year: 2024, month: 1, day: 1, isLeapMonth: false, hour: null });
    expect(r.lunar).toEqual({ year: 2024, month: 1, day: 1 });
    expect(r.pillars).toHaveLength(3);
  });
});
