import { describe, expect, it } from 'vitest';
import { figureById, pickFigure } from './figure';
import { OHAENG } from '../types';

describe('같은 기운의 역사 인물', () => {
  it('오행형마다 인물이 있고 id가 겹치지 않는다', () => {
    const ids = OHAENG.map((o) => pickFigure(o, 0).id);
    expect(ids).toHaveLength(5);
    for (const o of OHAENG) for (let s = 0; s < 6; s++) expect(figureById(pickFigure(o, s).id)?.name).toBe(pickFigure(o, s).name);
  });

  it('같은 seed면 같은 인물', () => {
    expect(pickFigure('토', 3).id).toBe(pickFigure('토', 3).id);
    expect(pickFigure('토', 1).id).not.toBe(pickFigure('토', 2).id);
  });

  it('기질로 이은 인물은 얼굴이 닮았다고 말하지 않는다', () => {
    for (const o of OHAENG) {
      for (let s = 0; s < 6; s++) {
        const f = pickFigure(o, s);
        if (f.basis === 'temper') expect(f.why).toContain('얼굴이 닮았다는 뜻은 아니에요');
      }
    }
  });

  it('없는 id는 null', () => {
    expect(figureById('nobody')).toBeNull();
  });
});
