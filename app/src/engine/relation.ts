// 사주 대표 기운으로 보는 상생(잘 맞는)·상극(부딪히며 크는) 사주 → wiki/saju/sangsaeng-sanggeuk.md
// 상극도 나쁜 말로 쓰지 않는다: "서로 배우는 사이" + 해볼 수 있는 행동 → wiki/overview.md 엮는 규칙 2
import relations from '../../data/relations.json';
import { josa } from './josa';
import type { Ohaeng } from '../types';

const CYCLE: Ohaeng[] = ['목', '화', '토', '금', '수'];
const at = (o: Ohaeng, step: number) => CYCLE[(CYCLE.indexOf(o) + step + 5) % 5];
const H = relations.hanja as Record<Ohaeng, string>;
const GEN = relations.gen as Record<string, string>;
const KEUK = relations.keuk as Record<string, string>;
const label = (o: Ohaeng) => `${o}(${H[o]})`;

export interface RelationCard { title: string; types: [Ohaeng, Ohaeng]; text: string; tip: string }

/** 상생: 나를 살려 주는 기운(생아)과 내가 살려 주는 기운(아생) */
export function sangsaeng(d: Ohaeng): RelationCard {
  const mother = at(d, -1);
  const child = at(d, 1);
  return {
    title: '상생 · 잘 맞는 사주',
    types: [mother, child],
    text:
      `내 사주의 대표 기운은 ${josa(label(d), '이에요', '예요')}. ` +
      `대표 기운이 ${label(mother)}인 사람은 ${GEN[mother + d]} 나를 받쳐 줘요(${mother}생${d}). ` +
      `대표 기운이 ${label(child)}인 사람에게는 ${GEN[d + child]} 내가 힘이 되어 줘요(${d}생${child}).`,
    tip: '이런 친구와는 서로 밀어주며 함께 자라요.',
  };
}

/** 상극: 나를 다듬어 주는 기운(극아)과 내가 잡아 주는 기운(아극) */
export function sanggeuk(d: Ohaeng): RelationCard {
  // 상생 고리(목→화→토→금→수)에서 두 칸 뒤가 내가 누르는 쪽, 두 칸 앞이 나를 누르는 쪽
  const over = at(d, -2);
  const under = at(d, 2);
  return {
    title: '상극 · 부딪히며 크는 사주',
    types: [over, under],
    text:
      '서로 다른 기운이라 처음엔 부딪힐 수 있지만, 그만큼 배울 게 많은 사이예요. ' +
      `대표 기운이 ${label(over)}인 사람은 ${KEUK[over + d]} 나를 더 단단하게 다듬어 줘요(${over}극${d}). ` +
      `대표 기운이 ${label(under)}인 사람과는 ${KEUK[d + under]} 내가 중심을 잡아 주게 돼요(${d}극${under}).`,
    tip: '생각이 다를 때 먼저 이유를 물어보면 서로에게 더 좋은 짝이 돼요.',
  };
}
