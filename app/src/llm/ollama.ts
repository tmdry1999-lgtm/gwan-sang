// 로컬 Ollama로 풀이 문장 쓰기 → wiki/prompt/llm-prompt.md
// 판정은 코드가 이미 끝냈다. LLM은 문장만 엮는다. 실패하면 그 부분만 대체 문장.
import { buildFallback, fallbackCategoryText, qrSummaryOf } from './fallback';
import { isSafe } from './safety';
import type { CategoryJudgement, Judgement, ReadingText } from '../types';

// 웹 배포판은 빌드할 때 VITE_OLLAMA_URL=https://<서버>로 자체 Ollama 서버를 가리킨다 → deploy/README.md
export const OLLAMA_URL: string = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
export const DEFAULT_MODEL: string = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b';
/** 요청 하나당. GPU 없는 서버는 느려서 빌드할 때 늘린다. */
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS) || 15000;

const SYSTEM = `너는 전통 관상서(마의상법, 유장상법)를 바탕으로 체험용 관상 풀이를 쓰는 작가다.
독자는 학생과 학부모다.
규칙:
1. 입력 JSON의 판정과 근거만 쓴다. 새 판정이나 근거를 지어내지 않는다.
2. "무엇을 봤나 → 관상서 근거 → 그래서" 순서로 2–3문장.
3. 해요체. 좋은 점을 먼저, 길게 쓴다.
4. caution이 있을 때만 tip에 "~하면 더 좋아요" 형태로 조언 1문장을 쓴다. 없으면 tip은 null.
5. 수명, 질병, 사고, 외모 평가, 성별 고정관념, 미래 단정 표현은 쓰지 않는다.
6. 한자어는 처음 나올 때 괄호로 쉬운 말을 붙인다.
7. 출력은 지정된 JSON 형식만.`;

const OVERALL_SCHEMA = {
  type: 'object',
  properties: { headline: { type: 'string' }, summary: { type: 'string' } },
  required: ['headline', 'summary'],
};
const CATEGORY_SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' }, tip: { type: ['string', 'null'] } },
  required: ['text', 'tip'],
};

export interface WriteOptions {
  baseUrl?: string;
  model?: string;
  /** 요청 하나당 */
  timeoutMs?: number;
  fetchFn?: (url: string, init: RequestInit) => Promise<Response>;
  onPart?: (key: 'overall' | CategoryJudgement['key'], partial: ReadingText) => void;
}

async function ask<T>(input: object, schema: object, o: Required<Omit<WriteOptions, 'onPart'>>): Promise<T> {
  const res = await o.fetchFn(`${o.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(o.timeoutMs),
    body: JSON.stringify({
      model: o.model,
      stream: false,
      format: schema,
      options: { temperature: 0.6 },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.message.content) as T;
}

export async function writeReading(j: Judgement, opts: WriteOptions = {}): Promise<ReadingText> {
  const o = {
    baseUrl: opts.baseUrl ?? OLLAMA_URL,
    model: opts.model ?? DEFAULT_MODEL,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    fetchFn: opts.fetchFn ?? ((u: string, i: RequestInit) => fetch(u, i)),
  };
  const out = buildFallback(j);
  let reachable = true;
  let anyLlm = false;

  const tryAsk = async <T>(input: object, schema: object): Promise<T | null> => {
    if (!reachable) return null;
    try {
      return await ask<T>(input, schema, o);
    } catch (e) {
      // 연결 자체가 안 되면 남은 요청도 건너뛴다. 시간 초과는 다음 부분을 다시 시도.
      if (e instanceof TypeError) reachable = false;
      return null;
    }
  };

  const overall = await tryAsk<{ headline: string; summary: string }>(
    { part: 'overall', face: j.face.main, faceSub: j.face.sub, ...j.overall, saju: { dominant: j.saju.dominant, missing: j.saju.missing }, gwae: { name: j.gwae.name, meaning: j.gwae.meaning, timeSource: j.gwae.timeSource } },
    OVERALL_SCHEMA,
  );
  if (overall && isSafe(overall.headline + overall.summary)) {
    out.headline = overall.headline;
    out.summary = overall.summary;
    out.qrSummary = qrSummaryOf(overall.headline, overall.summary);
    anyLlm = true;
  }
  opts.onPart?.('overall', { ...out });

  for (const [i, c] of j.categories.entries()) {
    const r = await tryAsk<{ text: string; tip: string | null }>(
      { part: c.key, label: c.label, stars: c.stars, features: c.features.map(({ part, observe, basis, meaning }) => ({ part, observe, basis, meaning })), link: c.link, caution: c.caution },
      CATEGORY_SCHEMA,
    );
    const tip = c.caution ? r?.tip ?? null : null;
    if (r && isSafe(r.text + (tip ?? ''))) {
      out.categories[i] = { key: c.key, text: r.text, tip };
      anyLlm = true;
    } else {
      out.categories[i] = { key: c.key, ...fallbackCategoryText(c) };
    }
    opts.onPart?.(c.key, { ...out, categories: [...out.categories] });
  }

  out.source = anyLlm ? 'llm' : 'fallback';
  return out;
}

/** 운영자 패널용: 연결 확인과 설치된 모델 목록 */
export async function listModels(baseUrl = OLLAMA_URL): Promise<string[] | null> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return (data.models as { name: string }[]).map((m) => m.name);
  } catch {
    return null;
  }
}
