// 휴대폰 결과 페이지: URL # 뒤 데이터만 읽어 그린다. 서버 요청 없음.
import { decodePayload } from './share/payload';
import { picksFromIds } from './engine/figure';
import { figureCard } from './ui/figure-card';

const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
const p = decodePayload(location.hash.slice(1));

if (!p) {
  $('#headline').textContent = '결과를 찾지 못했어요';
  $('#summary').textContent = '부스 화면의 QR 코드를 다시 찍어 주세요.';
} else {
  document.title = `${p.h} · 나의 관상 결과`;
  $('#headline').textContent = p.h;
  $('#summary').textContent = p.s;

  const chip = (k: string, v: string) => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.append(`${k} `, Object.assign(document.createElement('b'), { textContent: v }));
    return el;
  };
  $('#chips').replaceChildren(chip('얼굴', `${p.f[0]}형 · 보조 ${p.f[1]}형`), chip('괘', `${p.g[0]} ${p.g[1]}`));

  const gwaeCard = document.createElement('li');
  gwaeCard.className = 'card';
  gwaeCard.append(
    Object.assign(document.createElement('h3'), { textContent: `☯ 지금 뽑힌 괘 · ${p.g[0]}` }),
    Object.assign(document.createElement('p'), { textContent: p.g[2] }),
  );

  const cards = p.c.map(([icon, label, stars, text, tip]) => {
    const li = document.createElement('li');
    li.className = 'card';
    const h = document.createElement('h3');
    const s = document.createElement('span');
    s.className = 'stars';
    s.style.setProperty('--v', String(stars));
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', `별 5개 중 ${stars}개`);
    h.append(`${icon} ${label}`, s);
    li.append(h);
    if (text) li.append(Object.assign(document.createElement('p'), { textContent: text }));
    if (tip) li.append(Object.assign(document.createElement('p'), { className: 'tip', textContent: `💡 ${tip}` }));
    return li;
  });
  const figs = picksFromIds(p.p ? p.p.split(',') : []).map(figureCard);
  $('#cards').replaceChildren(...cards, ...figs, gwaeCard);
}
