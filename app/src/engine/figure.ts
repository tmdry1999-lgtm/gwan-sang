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
  /** 퍼블릭 도메인·자유 라이선스 이미지만. 없으면 이름 도장으로 그린다 */
  image?: FigureImage;
}

/** pos: 카드 틀에 맞춰 자를 때 보일 위치 (CSS object-position, 기본 위쪽 가운데) */
export interface FigureImage { src: string; caption: string; credit: string; pos?: string }

/** 카드 아래 "같은 기운의 인물" 한 줄 소개 */
export interface FigureBrief { name: string; years: string; deed: string }

const BY_TYPE = figures as unknown as Record<Ohaeng, Figure[]>;
const OTHERS = (figures as unknown as { others: Record<Ohaeng, FigureBrief[]> }).others;

/** 같은 형의 다른 인물: 카드에 안 나온 대표 인물 + 더 보기 인물 (최대 4명) */
export function othersOf(type: Ohaeng, shownId: string): FigureBrief[] {
  const rest = BY_TYPE[type].filter((f) => f.id !== shownId).map(({ name, years, deed }) => ({ name, years, deed }));
  return [...rest, ...OTHERS[type]].slice(0, 4);
}

/** seed가 같으면 같은 인물 (사람별 시드로 체험마다 달라지게) */
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
