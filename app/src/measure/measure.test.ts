import { describe, expect, it } from 'vitest';
import { measureFrame, isFrontal, medianOf } from './measure';
import type { Point } from '../types';

/** 478개 점을 (0.5,0.5)에 두고 필요한 점만 덮어쓴다 */
function face(overrides: Record<number, [number, number]>): Point[] {
  const pts: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [i, [x, y]] of Object.entries(overrides)) pts[Number(i)] = { x, y };
  return pts;
}

describe('measureFrame', () => {
  const pts = face({
    234: [0.3, 0.5], 454: [0.7, 0.5], // 얼굴폭 0.4
    10: [0.5, 0.2], 152: [0.5, 0.7], // 길이 0.5
    129: [0.45, 0.55], 358: [0.55, 0.55], // 콧방울 0.1
    61: [0.42, 0.62], 291: [0.58, 0.62], 13: [0.5, 0.63], 14: [0.5, 0.65], // 입꼬리가 중심보다 0.02 위
    172: [0.35, 0.65], 397: [0.65, 0.65],
  });
  const m = measureFrame(pts, 1, 1);

  it('거리는 얼굴폭으로 나눈다', () => {
    expect(m.m01).toBeCloseTo(1.25);
    expect(m.m14).toBeCloseTo(0.25);
  });

  it('입꼬리가 올라가면 m16 양수', () => {
    expect(m.m16).toBeCloseTo(0.05);
  });

  it('턱 각도는 도 단위', () => {
    // (0.35,0.65)-(0.5,0.7)-(0.65,0.65)
    expect(m.m17).toBeGreaterThan(140);
    expect(m.m17).toBeLessThan(150);
  });

  it('화면 비율(가로 640, 세로 480)을 반영한다', () => {
    const wide = measureFrame(pts, 640, 480);
    expect(wide.m01).toBeCloseTo((0.5 * 480) / (0.4 * 640));
  });
});

describe('정면 판정', () => {
  it('코끝이 양 볼 가운데면 정면', () => {
    expect(isFrontal(face({ 234: [0.3, 0.5], 454: [0.7, 0.5], 1: [0.5, 0.5] }))).toBe(true);
  });
  it('고개를 돌리면 정면 아님', () => {
    expect(isFrontal(face({ 234: [0.3, 0.5], 454: [0.7, 0.5], 1: [0.62, 0.5] }))).toBe(false);
  });
});

describe('medianOf', () => {
  it('항목별 중앙값, 값이 없는 항목은 빠진다', () => {
    const r = medianOf([{ m01: 1 }, { m01: 3, m02: 5 }, { m01: 2 }]);
    expect(r.m01).toBe(2);
    expect(r.m02).toBe(5);
    expect(r.m03).toBeUndefined();
  });
});
