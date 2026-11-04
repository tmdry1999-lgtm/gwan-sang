import { describe, expect, it } from 'vitest';
import { parseBirth } from './birth-form';

const base = { calendar: 'solar', year: '2010', month: '5', day: '15', leap: false, hour: '' };

describe('parseBirth', () => {
  it('정상 입력, 시간 모름 = null', () => {
    expect(parseBirth(base)).toEqual({ ok: true, birth: { calendar: 'solar', year: 2010, month: 5, day: 15, isLeapMonth: false, hour: null } });
  });
  it('시간 선택', () => {
    const r = parseBirth({ ...base, hour: '14' });
    expect(r.ok && r.birth.hour).toBe(14);
  });
  it('지원 범위 밖 연도', () => {
    expect(parseBirth({ ...base, year: '1899' })).toEqual({ ok: false, error: '1900년부터 2050년 사이로 넣어 주세요.' });
  });
  it('없는 양력 날짜', () => {
    expect(parseBirth({ ...base, month: '2', day: '30' })).toEqual({ ok: false, error: '없는 날짜예요. 다시 확인해 주세요.' });
  });
  it('음력 30일은 허용', () => {
    expect(parseBirth({ ...base, calendar: 'lunar', month: '2', day: '30' }).ok).toBe(true);
  });
  it('빈 칸', () => {
    expect(parseBirth({ ...base, day: '' })).toEqual({ ok: false, error: '년, 월, 일을 모두 넣어 주세요.' });
  });
  it('양력에서는 윤달 무시', () => {
    const r = parseBirth({ ...base, leap: true });
    expect(r.ok && r.birth.isLeapMonth).toBe(false);
  });
});
