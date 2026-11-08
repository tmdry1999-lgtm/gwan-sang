// LLM 없이 판정 문구 조각만으로 풀이를 조립한다 (Ollama 실패·지연 대비)
import type { CategoryJudgement, Judgement, ReadingText } from '../types';

export function fallbackCategoryText(c: CategoryJudgement): { text: string; tip: string | null } {
  // 가장 두드러진 부위를 앞세운다. 문장 틀과 둘째 부위를 넣을지는 사람마다(variant) 다르다.
  const [f, f2] = [...c.features].sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const v = c.variant ?? 0;
  const main =
    v % 2 === 0
      ? `${f.observe}. ${f.basis}. 그래서 ${f.meaning}.`
      : `${f.basis}. 이 자리를 보면 ${f.observe}. 그래서 ${f.meaning}.`;
  const second = f2 && (v >> 1) % 2 === 1 ? ` 또 ${f2.observe}. ${f2.meaning}.` : '';
  return { text: `${main}${second}${c.link ? ' ' + c.link : ''}`, tip: c.caution };
}

export function qrSummaryOf(headline: string, summary: string): string {
  const s = `${headline} ${summary}`;
  return s.length <= 300 ? s : s.slice(0, 299) + '…';
}

export function buildFallback(j: Judgement): ReadingText {
  const { headline, faceLine, sajuLine, gwaeLine, luckyLine } = j.overall;
  const summary = `${faceLine} ${sajuLine} ${gwaeLine} ${luckyLine}`;
  return {
    headline,
    summary,
    categories: j.categories.map((c) => ({ key: c.key, ...fallbackCategoryText(c) })),
    qrSummary: qrSummaryOf(headline, `${faceLine} ${sajuLine}`),
    source: 'fallback',
  };
}
