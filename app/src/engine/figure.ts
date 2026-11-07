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
export function pickFigure(type: Ohaeng, seed: number): Figure {
  const list = BY_TYPE[type];
  return list[Math.abs(Math.trunc(seed)) % list.length];
}

export interface FigurePick { role: '주형' | '보조형'; type: Ohaeng; figure: Figure }

/** 주형 인물 1명 + 보조형 인물 1명. 주형과 보조형이 같으면 주형만. */
export function pickFigures(face: { main: Ohaeng; sub: Ohaeng }, seed: number): FigurePick[] {
  const picks: FigurePick[] = [{ role: '주형', type: face.main, figure: pickFigure(face.main, seed) }];
  if (face.sub !== face.main) picks.push({ role: '보조형', type: face.sub, figure: pickFigure(face.sub, seed) });
  return picks;
}

/** QR에 담은 id 목록 → 카드. 앞이 주형, 뒤가 보조형. 모르는 id는 건너뛴다. */
export function picksFromIds(ids: string[]): FigurePick[] {
  return ids.flatMap((id, i) => {
    const figure = figureById(id);
    const type = figure && OHAENG.find((o) => BY_TYPE[o].includes(figure));
    return figure && type ? [{ role: i === 0 ? '주형' : '보조형', type, figure } as FigurePick] : [];
  });
}

export function figureById(id: string): Figure | null {
  for (const o of OHAENG) {
    const f = BY_TYPE[o].find((x) => x.id === id);
    if (f) return f;
  }
  return null;
}

export const basisLabel = (f: Figure) => (f.basis === 'gwansang' ? '관상가가 꼽은 같은 형' : '같은 기운의 인물');
