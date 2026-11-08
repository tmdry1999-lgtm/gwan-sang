// 부스 결과와 휴대폰 결과 페이지가 같이 쓰는 "같은 기운의 역사 인물" 카드
import { basisLabel, othersOf, type FigureImage, type FigurePick } from '../engine/figure';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}) =>
  Object.assign(document.createElement(tag), props);

/** 초상: 이미지가 있으면 그림 + 출처, 없거나 못 불러오면 이름 첫 글자 도장 */
function portrait(name: string, image?: FigureImage): HTMLElement {
  const seal = () => el('div', { className: 'figure-seal', textContent: name.replace(/^(퇴계|율곡|단원|다산|충무공|혜원|도산|백범|고산자)\s/, '').slice(0, 2) });
  if (!image) {
    const box = seal();
    box.setAttribute('aria-hidden', 'true');
    return box;
  }
  const fig = el('figure', { className: 'figure-portrait' });
  const img = el('img', { src: image.src, alt: image.caption, loading: 'lazy', decoding: 'async' });
  if (image.pos) img.style.objectPosition = image.pos;
  img.addEventListener('error', () => fig.replaceWith(seal()));
  fig.append(img, el('figcaption', { textContent: `${image.caption} · ${image.credit}` }));
  return fig;
}

export function figureCard({ role, type, figure: f }: FigurePick): HTMLLIElement {
  const li = el('li', { className: 'card figure' });
  const h = el('h3');
  h.append(`🏛️ ${f.name}`, el('span', { className: 'figure-years', textContent: f.years }));
  const body = el('div', { className: 'figure-body' });
  body.append(
    el('p', { className: 'figure-basis', textContent: `${role} ${type}형 · ${basisLabel(f)}` }),
    h,
    el('p', { textContent: `${f.why} ${f.deed}` }),
  );
  const top = el('div', { className: 'figure-top' });
  top.append(portrait(f.name, f.image), body);
  li.append(top, el('p', { className: 'tip', textContent: `✨ ${f.gift}` }));

  if (role === '주형') {
    const others = othersOf(type, f.id);
    if (others.length) {
      const box = el('div', { className: 'figure-others' });
      box.append(el('p', { className: 'figure-basis', textContent: `${type}의 기운을 지닌 다른 인물` }));
      const ul = el('ul');
      for (const o of others) {
        const item = el('li');
        item.append(el('b', { textContent: o.name }), ` ${o.years} · ${o.deed}`);
        ul.append(item);
      }
      box.append(ul);
      li.append(box);
    }
  }
  return li;
}
