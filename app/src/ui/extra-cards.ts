// 부스 결과와 휴대폰 결과 페이지가 같이 쓰는 카드: 상생·상극 사주, 재미로 보는 전생
import { sanggeuk, sangsaeng, type RelationCard } from '../engine/relation';
import { pastLife } from '../engine/pastlife';
import type { Ohaeng, Trigram } from '../types';

const p = (text: string, className = '') => Object.assign(document.createElement('p'), { className, textContent: text });

function relationCard(c: RelationCard, icon: string): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'card relation';
  const h = document.createElement('h3');
  h.append(`${icon} ${c.title}`, Object.assign(document.createElement('span'), { className: 'relation-types', textContent: c.types.join(' · ') }));
  li.append(h, p(c.text), p(`💡 ${c.tip}`, 'tip'));
  return li;
}

export function relationCards(dominant: Ohaeng): HTMLLIElement[] {
  return [relationCard(sangsaeng(dominant), '🌱'), relationCard(sanggeuk(dominant), '⚡')];
}

export function pastLifeCard(face: Ohaeng, saju: Ohaeng, upper: Trigram, seed: number): HTMLLIElement {
  const r = pastLife(face, saju, upper, seed);
  const li = document.createElement('li');
  li.className = 'card pastlife';
  li.append(
    p('재미로 보세요 · 얼굴·사주·괘의 기질로 지은 이야기예요', 'figure-basis'),
    Object.assign(document.createElement('h3'), { textContent: `🎭 ${r.headline}` }),
    p(r.text),
    p(`✨ ${r.gift}`, 'tip'),
  );
  return li;
}
