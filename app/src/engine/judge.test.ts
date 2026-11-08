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
  it('카테고리 6개, 별점은 2–5 사이 0.5 단위', () => {
    const extreme = { ...avg, m14: B.m14.mean - 3 * B.m14.sd, m02: B.m02.mean + 3 * B.m02.sd };
    const j = judge(extreme, B, saju('금'), gwae);
    expect(j.categories.map((c) => c.key)).toEqual(['study', 'wealth', 'love', 'people', 'health', 'challenge']);
    for (const c of j.categories) {
      expect(c.stars).toBeGreaterThanOrEqual(2);
      expect(c.stars).toBeLessThanOrEqual(5);
      expect(c.stars * 2).toBe(Math.round(c.stars * 2));
    }
  });

  it('부위가 뚜렷이 벗어나면 관상서 근거의 조심할 점', () => {
    const offNose = { ...avg, m14: B.m14.mean - 2 * B.m14.sd };
    const wealth = judge(offNose, B, saju('목'), gwae).categories.find((c) => c.key === 'wealth')!;
    expect(wealth.caution).toContain('계획');
  });

  it('누구나 별점 낮은 운세 둘에 조심할 점이 붙는다', () => {
    const offNose = { ...avg, m14: B.m14.mean - 2 * B.m14.sd, m08: B.m08.mean - 2 * B.m08.sd };
    const j = judge(offNose, B, saju('수'), gwae);
    const withCaution = j.categories.filter((c) => c.caution);
    expect(withCaution.length).toBeGreaterThanOrEqual(2);
    expect(withCaution.map((c) => c.key)).toEqual(expect.arrayContaining(['wealth', 'people']));
  });

  it('사람이 다르면 결과도 달라진다 (시드)', () => {
    const a = judge(avg, B, saju('금'), gwae);
    const b = judge({ ...avg, m02: B.m02.mean + 0.4 * B.m02.sd }, B, saju('금'), gwae);
    expect(a.seed).not.toBe(b.seed);
    expect(judge(avg, B, saju('금'), gwae).seed).toBe(a.seed); // 같은 사람은 같은 결과
    const headlines = new Set(Array.from({ length: 30 }, (_, i) => judge({ ...avg, m09: B.m09.mean + i * 0.01 }, B, saju('금'), gwae).overall.headline));
    expect(headlines.size).toBeGreaterThan(1);
  });

  it('행운의 색은 채우면 좋은 기운, 숫자는 1–9', () => {
    const j = judge(avg, B, saju('금', ['수']), gwae);
    expect(j.overall.luckyLine).toMatch(/행운의 색은 파랑, 행운의 숫자는 [1-9](이에요|예요)\./);
  });

  it('사주 대표 기운이 카테고리 오행이면 연결 문장 + 별 0.5', () => {
    const withLink = judge(avg, B, saju('토'), gwae).categories.find((c) => c.key === 'wealth')!;
    const without = judge(avg, B, saju('수'), { ...gwae, upper: '리', lower: '리' }).categories.find((c) => c.key === 'wealth')!;
    expect(withLink.link).toContain('토');
    expect(withLink.stars).toBeGreaterThan(without.stars);
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
