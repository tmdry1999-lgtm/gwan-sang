// LLM 없이 판정 문구 조각만으로 풀이를 조립한다 (Ollama 실패·지연 대비)
import type { CategoryJudgement, Judgement, ReadingText } from '../types';

export function fallbackCategoryText(c: CategoryJudgement): { text: string; tip: string | null } {
  // 가장 두드러진 부위를 앞세운다
  const f = [...c.features].sort((a, b) => Math.abs(b.z) - Math.abs(a.z))[0];
  const text = `${f.observe}. ${f.basis}. 그래서 ${f.meaning}.${c.link ? ' ' + c.link : ''}`;
  return { text, tip: c.caution };
}

export function qrSummaryOf(headline: string, summary: string): string {
  const s = `${headline} ${summary}`;
  return s.length <= 300 ? s : s.slice(0, 299) + '…';
}

export function buildFallback(j: Judgement): ReadingText {
  const { headline, faceLine, sajuLine, gwaeLine } = j.overall;
  const summary = `${faceLine} ${sajuLine} ${gwaeLine}`;
  return {
    headline,
    summary,
    categories: j.categories.map((c) => ({ key: c.key, ...fallbackCategoryText(c) })),
    qrSummary: qrSummaryOf(headline, `${faceLine} ${sajuLine}`),
    source: 'fallback',
  };
}
