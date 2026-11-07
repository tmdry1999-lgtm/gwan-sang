import { describe, expect, it, vi } from 'vitest';
import { writeReading } from './ollama';
import { judge } from '../engine/judge';
import baseline from '../../data/baseline.json';
import type { Baseline, Gwae, Measurements, SajuResult } from '../types';

const B = baseline as unknown as Baseline;
const avg: Measurements = Object.fromEntries(Object.entries(B).filter(([k]) => k.startsWith('m')).map(([k, v]) => [k, v.mean]));
const saju: SajuResult = { pillars: ['경오', '신사', '경진'], counts: { 목: 0, 화: 2, 토: 1, 금: 3, 수: 0 }, dominant: '금', missing: ['목'], lunar: { year: 1990, month: 4, day: 21 } };
const gwae: Gwae = { upper: '곤', lower: '건', movingLine: 3, name: '지천태', hanja: '地天泰', meaning: '통함', message: '술술 풀려요.', timeSource: '태어난 시간' };
const j = judge(avg, B, saju, gwae);

const BASE = 'http://ollama.test';

function reply(content: object) {
  return new Response(JSON.stringify({ message: { content: JSON.stringify(content) } }), { status: 200 });
}

describe('writeReading', () => {
  it('LLM 응답을 쓰고, 부분마다 onPart를 부른다', async () => {
    const fetchFn = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      return body.messages[1].content.includes('"part":"overall"')
        ? reply({ headline: '당신은 듬직해요.', summary: '좋은 기운이에요.' })
        : reply({ text: '콧방울이 도톰해요. 관상서에서 재백궁이에요. 그래서 잘 모아요.', tip: null });
    });
    const parts: string[] = [];
    const r = await writeReading(j, { baseUrl: BASE, fetchFn, onPart: (k) => parts.push(k) });
    expect(r.source).toBe('llm');
    expect(r.headline).toBe('당신은 듬직해요.');
    expect(parts).toEqual(['overall', 'study', 'wealth', 'love', 'people', 'health', 'challenge']);
    expect(fetchFn).toHaveBeenCalledTimes(7);
  });

  it('금지어가 나온 부분만 대체 문장으로 바꾼다', async () => {
    const fetchFn = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      return body.messages[1].content.includes('"part":"overall"')
        ? reply({ headline: '수명이 길어요', summary: '...' })
        : reply({ text: '좋아요. 관상서에서 그래서', tip: null });
    });
    const r = await writeReading(j, { baseUrl: BASE, fetchFn });
    expect(r.headline).toBe(j.overall.headline);
    expect(r.categories[0].text).toBe('좋아요. 관상서에서 그래서');
  });

  it('연결이 안 되면 전부 대체 문장, source=fallback', async () => {
    const fetchFn = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const r = await writeReading(j, { baseUrl: BASE, fetchFn });
    expect(r.source).toBe('fallback');
    expect(fetchFn).toHaveBeenCalledTimes(1); // 첫 실패 뒤로는 부르지 않는다
  });

  it('서버 주소가 없으면(웹 배포판) 부르지 않고 바로 대체 문장', async () => {
    const fetchFn = vi.fn();
    const r = await writeReading(j, { baseUrl: null, fetchFn });
    expect(r.source).toBe('fallback');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('시간 초과면 대체 문장', async () => {
    const fetchFn = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')));
    }));
    const r = await writeReading(j, { baseUrl: BASE, fetchFn, timeoutMs: 20 });
    expect(r.source).toBe('fallback');
  });
});
