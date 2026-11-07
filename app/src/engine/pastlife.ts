// 재미로 보는 전생 → wiki/readings/plan-b-past-life.md
// 관상서에는 전생을 읽는 법이 없다. 얼굴 주형·괘의 위쪽·사주 대표 기운의 기질을 이야기로 바꿀 뿐이다.
import data from '../../data/pastlife.json';
import { hasBatchim, josa } from './josa';
import type { Ohaeng, Trigram } from '../types';

type ByOhaeng<T> = Record<Ohaeng, T>;
const JOBS = data.jobs as ByOhaeng<string[]>;
const FACE_WHY = data.faceWhy as ByOhaeng<string>;
const PERSONA = data.persona as ByOhaeng<string>;
const GIFT = data.gift as ByOhaeng<string>;
const SCENES = data.scenes as Record<Trigram, { symbol: string; image: string; scene: string }>;

export interface PastLife { headline: string; text: string; gift: string }

export function pastLife(face: Ohaeng, saju: Ohaeng, upper: Trigram, seed: number): PastLife {
  const jobs = JOBS[face];
  const job = jobs[Math.abs(Math.trunc(seed)) % jobs.length];
  const s = SCENES[upper];
  return {
    headline: `전생의 당신은 ${s.scene}의 ${josa(job, '이었어요', '였어요')}.`,
    text:
      `얼굴이 ${face}형이라 ${FACE_WHY[face]}, 괘의 위쪽이 ${upper}(${s.symbol}, ${s.image})${hasBatchim(upper) ? '이라서' : '라서'} ${s.scene} 장면이 떠올라요. ` +
      `사주의 대표 기운이 ${josa(saju, '이라', '라')} ${PERSONA[saju]} 사람이었을 거예요.`,
    gift: `그 기운이 지금 당신에게 ${josa(GIFT[face], '으로', '로')} 남아 있어요.`,
  };
}
