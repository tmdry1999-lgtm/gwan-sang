import { describe, expect, it } from 'vitest';
import { buildResultUrl, decodePayload, toPayload, type SharePayload } from './payload';
import type { Judgement, ReadingText } from '../types';

const reading: ReadingText = {
  headline: '당신은 듬직한 토형(土形)이에요.',
  summary: '요약',
  qrSummary: '광대가 단단히 받쳐 주는 얼굴이에요. '.repeat(8),
  categories: ['study', 'wealth', 'love', 'people', 'health', 'challenge'].map((key) => ({
    key: key as ReadingText['categories'][number]['key'],
    text: '콧방울이 도톰해요. 관상서에서 코끝과 콧방울은 재백궁, 재물을 담는 자리예요. 그래서 모은 것을 잘 지키는 힘이 있어요.',
    tip: '계획을 세워 모으면 더 좋아요.',
  })),
  source: 'llm',
};
const judgement = {
  face: { main: '토', sub: '금' },
  gwae: { name: '지천태', hanja: '地天泰', message: '술술 풀려요.' },
  saju: { dominant: '금' },
  categories: reading.categories.map((c, i) => ({ key: c.key, label: `라벨${i}`, icon: '⭐', stars: 4.5 })),
} as unknown as Judgement;

describe('QR 결과 주소', () => {
  it('# 뒤에만 데이터를 담고, 되돌리면 같다', () => {
    const p = toPayload(reading, judgement);
    const url = buildResultUrl('https://example.github.io/gwansang/result.html', p);
    expect(url.startsWith('https://example.github.io/gwansang/result.html#')).toBe(true);
    expect(new URL(url).search).toBe('');
    expect(decodePayload(new URL(url).hash.slice(1))).toEqual(p);
  });

  it('너무 길면 카테고리 본문부터 줄이고, 별점·요약은 남긴다', () => {
    const p = toPayload(reading, judgement);
    const url = buildResultUrl('https://x.io/r.html', p, 600);
    expect(url.length).toBeLessThanOrEqual(600);
    const back = decodePayload(new URL(url).hash.slice(1)) as SharePayload;
    expect(back.c.map((c) => c[2])).toEqual([4.5, 4.5, 4.5, 4.5, 4.5, 4.5]);
    expect(back.h).toBe(reading.headline);
  });

  it('망가진 # 값은 null', () => {
    expect(decodePayload('%%%not-valid')).toBeNull();
    expect(decodePayload('')).toBeNull();
  });
});
