// 매화역수 연월일시 기괘법 → wiki/maehwa/gigwae.md
import hexagrams from '../../data/hexagrams.json';
import { TRIGRAMS, type Gwae, type Trigram } from '../types';

type HexEntry = { name: string; hanja: string; meaning: string; message: string };
const TABLE = hexagrams as Record<string, HexEntry>;

/** 연도 → 지지 번호 (자=1 … 해=12) */
export function yearBranch(year: number): number {
  return (((year - 4) % 12) + 12) % 12 + 1;
}

/** 시각(0–23) → 시지 번호 (자시 23–01시 = 1 … 해시 21–23시 = 12) */
export function hourBranch(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2) + 1;
}

function trigramOf(n: number): Trigram {
  const r = n % 8;
  return TRIGRAMS[(r === 0 ? 8 : r) - 1];
}

export interface CastInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  /** 태어난 시각, 모르면 체험 시각 */
  hour: number;
  timeSource: Gwae['timeSource'];
}

export function castGwae(input: CastInput): Gwae {
  const base = yearBranch(input.lunarYear) + input.lunarMonth + input.lunarDay;
  const total = base + hourBranch(input.hour);
  const upper = trigramOf(base);
  const lower = trigramOf(total);
  const moving = total % 6;
  const hex = TABLE[`${upper}-${lower}`];
  return {
    upper,
    lower,
    movingLine: moving === 0 ? 6 : moving,
    name: hex.name,
    hanja: hex.hanja,
    meaning: hex.meaning,
    message: hex.message,
    timeSource: input.timeSource,
  };
}
