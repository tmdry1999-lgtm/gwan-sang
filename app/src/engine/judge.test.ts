import { describe, expect, it } from 'vitest';
import { judge, levelOf, relationLine } from './judge';
import baseline from '../../data/baseline.json';
import type { Baseline, Gwae, Measurements, SajuResult } from '../types';

const B = baseline as unknown as Baseline;
const avg: Measurements = Object.fromEntries(Object.entries(B).filter(([k]) => k.startsWith('m')).map(([k, v]) => [k, v.mean]));
const saju = (dominant: SajuResult['dominant'], missing: SajuResult['missing'] = []): SajuResult => ({
  pillars: ['경오', '신사', '경진'],
  counts: { 목: 0, 화: 2, 토: 1, 금: 3, 수: 0 },
  dominant,
  missing,
  lunar: { year: 1990, month: 4, day: 21 },
});
const gwae: Gwae = { upper: '곤', lower: '건', movingLine: 3, name: '지천태', hanja: '地天泰', meaning: '하늘과 땅이 통해 일이 풀림', message: '모든 일이 술술 풀리는 편안한 때예요.', timeSource: '체험 시각' };

describe('levelOf', () => {
  it('high: z≥1 good, z≤-1 off', () => {
    expect(levelOf('high', 1.2)).toBe('good');
    expect(levelOf('high', 0.3)).toBe('normal');
    expect(levelOf('high', -1.1)).toBe('off');
  });
  it('mid: |z|≤1 good, |z|≥2 off', () => {
    expect(levelOf('mid', -0.8)).toBe('good');
    expect(levelOf('mid', 1.5)).toBe('normal');
    expect(levelOf('mid', 2.1)).toBe('off');
  });
});

describe('judge', () => {
  it('카테고리 6개, 별점은 3–5 사이 0.5 단위', () => {
    const extreme = { ...avg, m14: B.m14.mean - 3 * B.m14.sd, m02: B.m02.mean + 3 * B.m02.sd };
    const j = judge(extreme, B, saju('금'), gwae);
    expect(j.categories.map((c) => c.key)).toEqual(['study', 'wealth', 'love', 'people', 'health', 'challenge']);
    for (const c of j.categories) {
      expect(c.stars).toBeGreaterThanOrEqual(3);
      expect(c.stars).toBeLessThanOrEqual(5);
      expect(c.stars * 2).toBe(Math.round(c.stars * 2));
    }
  });

  it('조심할 점은 뚜렷이 벗어나고 근거 문구가 있을 때만', () => {
    const offNose = { ...avg, m14: B.m14.mean - 2 * B.m14.sd };
    const wealth = judge(offNose, B, saju('목'), gwae).categories.find((c) => c.key === 'wealth')!;
    expect(wealth.caution).toContain('계획');
    const normal = judge(avg, B, saju('목'), gwae).categories.find((c) => c.key === 'wealth')!;
    expect(normal.caution).toBeNull();
  });

  it('사주 대표 기운이 카테고리 오행이면 연결 문장 + 별 0.5', () => {
    const withLink = judge(avg, B, saju('토'), gwae).categories.find((c) => c.key === 'wealth')!;
    const without = judge(avg, B, saju('수'), { ...gwae, upper: '리', lower: '리' }).categories.find((c) => c.key === 'wealth')!;
    expect(withLink.link).toContain('토');
    expect(withLink.stars).toBe(without.stars + 0.5);
  });

  it('측정이 빠진 항목은 보통으로 본다', () => {
    const { m14, ...noNose } = avg;
    const wealth = judge(noNose, B, saju('목'), gwae).categories.find((c) => c.key === 'wealth')!;
    expect(wealth.features.find((f) => f.id === 'm14')!.level).toBe('normal');
  });

  it('종합: 오행형 헤드라인과 괘 문장', () => {
    const j = judge(avg, B, saju('금'), gwae);
    expect(j.overall.headline).toMatch(/형\(.形\)이에요\.$/);
    expect(j.overall.gwaeLine).toContain('지천태');
    expect(j.overall.gwaeLine).toContain('지금 이 순간');
  });
});

describe('relationLine (wiki/overview.md)', () => {
  it('같음 / 상생 / 상극 모두 긍정 문장', () => {
    expect(relationLine('토', '토')).toContain('같은 방향');
    expect(relationLine('목', '수')).toContain('받쳐');
    expect(relationLine('목', '화')).toContain('키워');
    expect(relationLine('목', '금')).toContain('두 가지 장점');
  });
  it('조사는 받침에 맞춘다', () => {
    expect(relationLine('목', '수')).toContain('수(水)가');
    expect(relationLine('수', '금')).toContain('금(金)이');
    expect(relationLine('목', '화')).toContain('화(火)를');
    expect(relationLine('화', '화')).toContain('화(火)라서');
  });
});
