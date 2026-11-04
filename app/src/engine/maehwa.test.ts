import { describe, expect, it } from 'vitest';
import { castGwae, hourBranch, yearBranch } from './maehwa';

describe('지지 번호', () => {
  it('연도 → 지지 (자=1)', () => {
    expect(yearBranch(1984)).toBe(1); // 갑자
    expect(yearBranch(1990)).toBe(7); // 경오
    expect(yearBranch(2011)).toBe(4); // 신묘
  });

  it('시각 → 시지 (자시 23–01시 = 1)', () => {
    expect(hourBranch(23)).toBe(1);
    expect(hourBranch(0)).toBe(1);
    expect(hourBranch(1)).toBe(2);
    expect(hourBranch(12)).toBe(7);
    expect(hourBranch(22)).toBe(12);
  });
});

describe('연월일시 기괘법', () => {
  it('상괘 = (년+월+일)%8, 하괘 = (+시)%8, 동효 = 총합%6', () => {
    const g = castGwae({ lunarYear: 1984, lunarMonth: 1, lunarDay: 1, hour: 0, timeSource: '태어난 시간' });
    expect(g.upper).toBe('리');
    expect(g.lower).toBe('진');
    expect(g.movingLine).toBe(4);
    expect(g.name).toBe('화뢰서합');
  });

  it('나머지 0이면 곤(8)', () => {
    const g = castGwae({ lunarYear: 1984, lunarMonth: 3, lunarDay: 4, hour: 0, timeSource: '태어난 시간' });
    expect(g.upper).toBe('곤');
    expect(g.lower).toBe('건');
    expect(g.name).toBe('지천태');
    expect(g.movingLine).toBe(3);
  });

  it('동효 나머지 0이면 6', () => {
    const g = castGwae({ lunarYear: 1984, lunarMonth: 3, lunarDay: 4, hour: 6, timeSource: '체험 시각' });
    expect(g.lower).toBe('진');
    expect(g.movingLine).toBe(6);
    expect(g.timeSource).toBe('체험 시각');
  });

  it('64괘 모두 이름과 메시지가 있다', async () => {
    const { default: table } = await import('../../data/hexagrams.json');
    expect(Object.keys(table)).toHaveLength(64);
    for (const v of Object.values(table) as { name: string; message: string }[]) {
      expect(v.name.length).toBeGreaterThan(1);
      expect(v.message.length).toBeGreaterThan(5);
    }
  });
});
