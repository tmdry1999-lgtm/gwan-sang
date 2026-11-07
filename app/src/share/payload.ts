// QR 결과: 서버에 저장하지 않고 URL # 뒤에 압축해 담는다 (# 뒤는 서버로 전송되지 않음)
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Judgement, ReadingText } from '../types';

/** 짧은 키: v 버전, h 헤드라인, s 요약, f [주형, 보조형], g [괘이름, 한자, 메시지], c [아이콘, 라벨, 별점, 본문, 조언][], p 역사 인물 id(없을 수 있음) */
export interface SharePayload {
  v: 1;
  h: string;
  s: string;
  f: [string, string];
  g: [string, string, string];
  c: [string, string, number, string, string][];
  p?: string;
}

export function toPayload(r: ReadingText, j: Judgement, figureId?: string): SharePayload {
  return {
    v: 1,
    h: r.headline,
    s: r.qrSummary,
    f: [j.face.main, j.face.sub],
    g: [j.gwae.name, j.gwae.hanja, j.gwae.message],
    c: j.categories.map((c, i) => [c.icon, c.label, c.stars, r.categories[i]?.text ?? '', r.categories[i]?.tip ?? '']),
    ...(figureId ? { p: figureId } : {}),
  };
}

const encode = (p: SharePayload) => compressToEncodedURIComponent(JSON.stringify(p));

/** QR 하나에 무리 없이 들어가는 길이(기본 1800자)에 맞춰 조언 → 본문 → 요약 순으로 줄인다 */
export function buildResultUrl(base: string, p: SharePayload, maxLen = 1800): string {
  const make = (q: SharePayload) => `${base}#${encode(q)}`;
  let q: SharePayload = structuredClone(p);
  if (make(q).length <= maxLen) return make(q);
  q.c = q.c.map(([i, l, s, t]) => [i, l, s, t, '']);
  if (make(q).length <= maxLen) return make(q);
  // 본문은 첫 문장만
  q.c = q.c.map(([i, l, s, t]) => [i, l, s, t.split('. ')[0] + '.', '']);
  if (make(q).length <= maxLen) return make(q);
  q.c = q.c.map(([i, l, s]) => [i, l, s, '', '']);
  while (make(q).length > maxLen && q.s.length > 20) q.s = q.s.slice(0, Math.floor(q.s.length * 0.8)) + '…';
  return make(q);
}

export function decodePayload(hash: string): SharePayload | null {
  if (!hash) return null;
  try {
    const json = decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    const p = JSON.parse(json);
    return p?.v === 1 ? (p as SharePayload) : null;
  } catch {
    return null;
  }
}
