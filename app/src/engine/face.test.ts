import { describe, expect, it } from 'vitest';
import { classifyFace, zScore } from './face';
import baseline from '../../data/baseline.json';
import type { Baseline, Measurements } from '../types';

const B = baseline as unknown as Baseline;
/** 기준선 평균에서 표준편차 몇 배만큼 옮긴 측정값 */
function at(z: Partial<Record<'m01' | 'm02' | 'm03' | 'm17', number>>): Measurements {
  const m: Measurements = {};
  for (const id of ['m01', 'm02', 'm03', 'm17'] as const) m[id] = B[id].mean + (z[id] ?? 0) * B[id].sd;
  return m;
}

describe('zScore', () => {
  it('(값-평균)/표준편차', () => {
    expect(zScore(B, 'm01', B.m01.mean + 2 * B.m01.sd)).toBeCloseTo(2);
  });
});

describe('오행형 얼굴 (wiki/gwansang/ohaeng-face.md)', () => {
  it('이마 넓고 턱 좁고 길면 목형', () => {
    expect(classifyFace(at({ m02: 1.5, m03: -1.5, m01: 1 }), B).main).toBe('목');
  });
  it('턱이 이마보다 넓으면 화형', () => {
    expect(classifyFace(at({ m02: -1.5, m03: 1.5 }), B).main).toBe('화');
  });
  it('이마·턱 모두 좁고 광대가 두드러지면 토형', () => {
    expect(classifyFace(at({ m02: -1.5, m03: -1.5 }), B).main).toBe('토');
  });
  it('이마·턱 모두 넓고 짧으면 금형', () => {
    expect(classifyFace(at({ m02: 1.5, m03: 1.5, m01: -1 }), B).main).toBe('금');
  });
  it('짧고 턱선이 둥글면 수형', () => {
    expect(classifyFace(at({ m01: -1.5, m17: 1.5 }), B).main).toBe('수');
  });
  it('주형과 보조형은 서로 다르다', () => {
    const f = classifyFace(at({}), B);
    expect(f.main).not.toBe(f.sub);
  });
});
