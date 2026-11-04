import type { BirthInput } from '../types';

export interface BirthFields {
  calendar: string;
  year: string;
  month: string;
  day: string;
  leap: boolean;
  /** '' = 모름 */
  hour: string;
}

export type BirthParse = { ok: true; birth: BirthInput } | { ok: false; error: string };

export function parseBirth(f: BirthFields): BirthParse {
  if (!f.year.trim() || !f.month.trim() || !f.day.trim()) return { ok: false, error: '년, 월, 일을 모두 넣어 주세요.' };
  const [year, month, day] = [f.year, f.month, f.day].map((v) => Number(v.trim()));
  if (![year, month, day].every(Number.isInteger)) return { ok: false, error: '숫자로 넣어 주세요.' };
  if (year < 1900 || year > 2050) return { ok: false, error: '1900년부터 2050년 사이로 넣어 주세요.' };
  const calendar = f.calendar === 'lunar' ? 'lunar' : 'solar';
  const maxDay = calendar === 'lunar' ? 30 : new Date(year, month, 0).getDate();
  if (month < 1 || month > 12 || day < 1 || day > maxDay) return { ok: false, error: '없는 날짜예요. 다시 확인해 주세요.' };
  return {
    ok: true,
    birth: { calendar, year, month, day, isLeapMonth: calendar === 'lunar' && f.leap, hour: f.hour === '' ? null : Number(f.hour) },
  };
}

/** 시간 선택지: 몰라요 + 0–23시 (지지 이름을 함께 보여 줌) */
export function hourOptions(): { value: string; label: string }[] {
  const BR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const opts = [{ value: '', label: '몰라요' }];
  for (let h = 0; h < 24; h++) {
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    opts.push({ value: String(h), label: `${ampm} ${h12}시대 (${BR[Math.floor(((h + 1) % 24) / 2)]}시)` });
  }
  return opts;
}
