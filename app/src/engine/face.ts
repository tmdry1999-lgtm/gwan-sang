// 오행형 얼굴 판정 → wiki/gwansang/ohaeng-face.md
import { OHAENG, type Baseline, type FaceType, type MeasureId, type Measurements, type Ohaeng } from '../types';

export function zScore(baseline: Baseline, id: MeasureId, value: number | undefined): number {
  if (value === undefined) return 0;
  const { mean, sd } = baseline[id];
  return (value - mean) / sd;
}

/** F=이마폭, J=턱폭, L=얼굴 길이, A=턱선 각도(클수록 둥긂) 의 z값으로 다섯 형의 점수를 매긴다 */
export function classifyFace(m: Measurements, baseline: Baseline): FaceType {
  const F = zScore(baseline, 'm02', m.m02);
  const J = zScore(baseline, 'm03', m.m03);
  const L = zScore(baseline, 'm01', m.m01);
  const A = zScore(baseline, 'm17', m.m17);
  const scores: Record<Ohaeng, number> = {
    목: F - J + 0.5 * L, // 역삼각형, 길쭉함
    화: J - F, // 위가 좁고 아래가 넓음
    토: -(F + J) / 2, // 광대가 이마·턱보다 두드러짐
    금: (F + J) / 2 - 0.5 * L, // 이마·턱 모두 각지고 넓음
    수: -L + 0.5 * A - 0.5 * Math.abs(F - J), // 둥글고 짧음
  };
  const ranked = [...OHAENG].sort((a, b) => scores[b] - scores[a]);
  return { main: ranked[0], sub: ranked[1], scores };
}
