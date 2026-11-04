import { describe, expect, it } from 'vitest';
import { isSafe } from './safety';
import { buildFallback } from './fallback';
import { judge } from '../engine/judge';
import baseline from '../../data/baseline.json';
import type { Baseline, Gwae, Measurements, SajuResult } from '../types';

const B = baseline as unknown as Baseline;
const avg: Measurements = Object.fromEntries(Object.entries(B).filter(([k]) => k.startsWith('m')).map(([k, v]) => [k, v.mean]));
const saju: SajuResult = { pillars: ['경오', '신사', '경진'], counts: { 목: 0, 화: 2, 토: 1, 금: 3, 수: 0 }, dominant: '금', missing: ['목', '수'], lunar: { year: 1990, month: 4, day: 21 } };
const gwae: Gwae = { upper: '곤', lower: '건', movingLine: 3, name: '지천태', hanja: '地天泰', meaning: '하늘과 땅이 통해 일이 풀림', message: '모든 일이 술술 풀리는 편안한 때예요.', timeSource: '태어난 시간' };

describe('isSafe (wiki/tone-guide.md 절대 쓰지 않는 것)', () => {
  it.each(['수명이 짧아요', '질병을 조심', '이혼할 수', '못생긴 코', '반드시 성공해요', '오락용 콘텐츠'])('금지: %s', (t) => {
    expect(isSafe(t)).toBe(false);
  });
  it('일반 긍정 문장은 통과', () => {
    expect(isSafe('콧방울이 도톰해요. 병오년의 밝은 기운이 있어요.')).toBe(true);
  });
});

describe('buildFallback', () => {
  const j = judge(avg, B, saju, gwae);
  const r = buildFallback(j);

  it('카테고리마다 "봤나 → 근거 → 그래서" 문장', () => {
    expect(r.categories).toHaveLength(6);
    for (const c of r.categories) {
      expect(c.text).toContain('관상서에서');
      expect(c.text).toContain('그래서');
    }
  });

  it('모든 문장이 금지어 검사를 통과하고 source=fallback', () => {
    expect(r.source).toBe('fallback');
    for (const t of [r.headline, r.summary, ...r.categories.map((c) => c.text + (c.tip ?? ''))]) expect(isSafe(t)).toBe(true);
  });

  it('QR 요약은 300자 이내', () => {
    expect(r.qrSummary.length).toBeLessThanOrEqual(300);
  });
});
