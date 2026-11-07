// 부스 결과와 휴대폰 결과 페이지가 같이 쓰는 "같은 기운의 역사 인물" 카드
import { basisLabel, type Figure } from '../engine/figure';

export function figureCard(f: Figure): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'card figure';
  const h = document.createElement('h3');
  h.append(
    `🏛️ ${f.name}`,
    Object.assign(document.createElement('span'), { className: 'figure-years', textContent: f.years }),
  );
  li.append(
    Object.assign(document.createElement('p'), { className: 'figure-basis', textContent: basisLabel(f) }),
    h,
    Object.assign(document.createElement('p'), { textContent: `${f.why} ${f.deed}` }),
    Object.assign(document.createElement('p'), { className: 'tip', textContent: `✨ ${f.gift}` }),
  );
  return li;
}
