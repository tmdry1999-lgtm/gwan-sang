// 사주 오행 균형 → wiki/saju/ohaeng-balance.md
import { calculateSaju, lunarToSolar, solarToLunar } from '@fullstackfamily/manseryeok';
import { OHAENG, type BirthInput, type Ohaeng, type SajuResult } from '../types';

const STEM: Record<string, Ohaeng> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
};
const BRANCH: Record<string, Ohaeng> = {
  인: '목', 묘: '목', 사: '화', 오: '화', 진: '토', 술: '토', 축: '토', 미: '토', 신: '금', 유: '금', 해: '수', 자: '수',
};

/** pillars: 한글 2글자 간지 배열 (년, 월, 일[, 시]) */
export function tallyPillars(pillars: string[]): Pick<SajuResult, 'counts' | 'dominant' | 'missing'> {
  const counts = Object.fromEntries(OHAENG.map((o) => [o, 0])) as Record<Ohaeng, number>;
  for (const p of pillars) {
    counts[STEM[p[0]]] += 1;
    counts[BRANCH[p[1]]] += 1;
  }
  const max = Math.max(...OHAENG.map((o) => counts[o]));
  const tied = OHAENG.filter((o) => counts[o] === max);
  const dayStem = STEM[pillars[2][0]];
  const dominant = tied.includes(dayStem) ? dayStem : tied[0];
  return { counts, dominant, missing: OHAENG.filter((o) => counts[o] === 0) };
}

export function computeSaju(birth: BirthInput): SajuResult {
  let { year, month, day } = birth;
  if (birth.calendar === 'lunar') {
    const s = lunarToSolar(year, month, day, birth.isLeapMonth).solar;
    ({ year, month, day } = s);
  }
  const conv = solarToLunar(year, month, day);
  const pillars =
    birth.hour === null
      ? [conv.gapja.yearPillar, conv.gapja.monthPillar, conv.gapja.dayPillar]
      : (() => {
          const s = calculateSaju(year, month, day, birth.hour, 0);
          return [s.yearPillar, s.monthPillar, s.dayPillar, s.hourPillar as string];
        })();
  return {
    pillars,
    ...tallyPillars(pillars),
    lunar: { year: conv.lunar.year, month: conv.lunar.month, day: conv.lunar.day },
  };
}
