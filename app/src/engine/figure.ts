// 같은 기운의 역사 인물 → wiki/readings/figures.md
// 얼굴 사진을 비교하지 않는다. 주형(오행)에 묶인 인물 가운데 하나를 고를 뿐이다.
import figures from '../../data/figures.json';
import { OHAENG, type Ohaeng } from '../types';

export interface Figure {
  id: string;
  name: string;
  years: string;
  /** gwansang: 관상가가 그 형으로 꼽은 인물 · temper: 오행 기질로 이은 인물 */
  basis: 'gwansang' | 'temper';
  why: string;
  deed: string;
  gift: string;
}

const BY_TYPE = figures as unknown as Record<Ohaeng, Figure[]>;

/** seed가 같으면 같은 인물 (괘의 동효를 넣어 체험마다 조금씩 달라지게) */
export function pickFigure(main: Ohaeng, seed: number): Figure {
  const list = BY_TYPE[main];
  return list[Math.abs(Math.trunc(seed)) % list.length];
}

export function figureById(id: string): Figure | null {
  for (const o of OHAENG) {
    const f = BY_TYPE[o].find((x) => x.id === id);
    if (f) return f;
  }
  return null;
}

export const basisLabel = (f: Figure) => (f.basis === 'gwansang' ? '관상가가 꼽은 같은 형' : '같은 기운의 인물');
