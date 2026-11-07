import { describe, expect, it } from 'vitest';
import { hasBatchim, josa } from './josa';
import { sanggeuk, sangsaeng } from './relation';
import { pastLife } from './pastlife';
import { OHAENG, TRIGRAMS } from '../types';
import { isSafe } from '../llm/safety';

describe('조사', () => {
  it('받침 있으면 앞, 없으면 뒤', () => {
    expect(josa('목(木)', '이에요', '예요')).toBe('목(木)이에요');
    expect(josa('수(水)', '이에요', '예요')).toBe('수(水)예요');
    expect(hasBatchim('장군')).toBe(true);
    expect(hasBatchim('선비')).toBe(false);
  });
});

describe('상생·상극 사주', () => {
  it('목: 상생은 수·화, 상극은 금·토', () => {
    expect(sangsaeng('목').types).toEqual(['수', '화']);
    expect(sanggeuk('목').types).toEqual(['금', '토']);
    expect(sangsaeng('목').text).toContain('물이 나무를 키우듯 나를 받쳐 줘요(수생목)');
    expect(sanggeuk('목').text).toContain('(금극목)');
  });

  it('다섯 기운 모두 이유 문장이 비지 않고, 자기 자신과는 짝짓지 않는다', () => {
    for (const o of OHAENG) {
      for (const card of [sangsaeng(o), sanggeuk(o)]) {
        expect(card.types).not.toContain(o);
        expect(card.text).not.toContain('undefined');
        expect(isSafe(card.text + card.tip)).toBe(true);
      }
    }
  });

  it('상극은 좋은 말로 시작한다', () => {
    for (const o of OHAENG) expect(sanggeuk(o).text.startsWith('서로 다른 기운이라')).toBe(true);
  });
});

describe('재미로 보는 전생', () => {
  it('예시: 화형 · 리괘 · 목 기운', () => {
    const p = pastLife('화', '목', '리', 1);
    expect(p.headline).toBe('전생의 당신은 등불 밝힌 밤 장터의 이야기꾼이었어요.');
    expect(p.text).toContain('괘의 위쪽이 리(☲, 불)라서');
    expect(p.gift).toBe('그 기운이 지금 당신에게 사람을 모으는 말솜씨로 남아 있어요.');
  });

  it('모든 조합에서 빈칸 없이 만들어진다', () => {
    for (const f of OHAENG) for (const s of OHAENG) for (const t of TRIGRAMS) for (let seed = 1; seed <= 6; seed++) {
      const p = pastLife(f, s, t, seed);
      const all = p.headline + p.text + p.gift;
      expect(all).not.toContain('undefined');
      expect(isSafe(all)).toBe(true);
    }
  });

  it('받침 따라 조사가 바뀐다', () => {
    expect(pastLife('금', '수', '건', 3).headline).toBe('전생의 당신은 높은 성루의 장군이었어요.');
    expect(pastLife('목', '수', '건', 3).headline).toBe('전생의 당신은 높은 성루의 선비였어요.');
    expect(pastLife('목', '금', '건', 1).text).toContain('건(☰, 하늘)이라서');
  });
});
