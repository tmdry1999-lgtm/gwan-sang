// 판정 엔진: 측정값 + 사주 + 괘 → 카테고리 판정 → wiki/readings/plan-a-fortune.md
import rules from '../../data/rules.json';
import { classifyFace, zScore } from './face';
import type {
  Baseline, CategoryJudgement, CategoryKey, FeatureJudgement, Gwae, Judgement, Level, MeasureId, Measurements, Ohaeng, SajuResult, Trigram,
} from '../types';

type GoodWhen = 'high' | 'low' | 'mid';
interface FeatureRule {
  id: MeasureId;
  part: string;
  goodWhen: GoodWhen;
  observe: Record<Level, string>;
  basis: string;
  meaning: Record<Level, string>;
  caution?: string | null;
}
interface CategoryRule {
  key: CategoryKey;
  label: string;
  icon: string;
  ohaeng: Ohaeng[];
  trigrams: Trigram[];
  features: FeatureRule[];
}
type OhaengInfo = { hanja: string; shape: string; adj: string; trait: string; advice: string };

const OHAENG_INFO = rules.ohaeng as Record<Ohaeng, OhaengInfo>;
const CATEGORIES = rules.categories as CategoryRule[];
const OVERALL = rules.overallFeature as FeatureRule;

const SAENG: Record<Ohaeng, Ohaeng> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const LEVEL_SCORE: Record<Level, number> = { good: 5, normal: 4, off: 3 };

export function levelOf(goodWhen: GoodWhen, z: number): Level {
  if (goodWhen === 'mid') return Math.abs(z) <= 1 ? 'good' : Math.abs(z) >= 2 ? 'off' : 'normal';
  const signed = goodWhen === 'high' ? z : -z;
  return signed >= 1 ? 'good' : signed <= -1 ? 'off' : 'normal';
}

function judgeFeature(rule: FeatureRule, m: Measurements, baseline: Baseline): FeatureJudgement {
  const z = zScore(baseline, rule.id, m[rule.id]);
  const level = levelOf(rule.goodWhen, z);
  return { id: rule.id, part: rule.part, level, z, observe: rule.observe[level], basis: rule.basis, meaning: rule.meaning[level] };
}

const name = (o: Ohaeng) => `${o}(${OHAENG_INFO[o].hanja})`;

/** 오행 이름 뒤 조사: 받침 있으면 앞, 없으면 뒤 (목·금 = 받침) */
const josa = (o: Ohaeng, withBatchim: string, without: string) =>
  `${name(o)}${(o.charCodeAt(0) - 0xac00) % 28 ? withBatchim : without}`;

/** 얼굴 오행형과 사주 대표 기운의 관계를 긍정 문장으로 */
export function relationLine(face: Ohaeng, saju: Ohaeng): string {
  if (face === saju) return `얼굴의 기질과 사주의 대표 기운이 모두 ${josa(face, '이라서', '라서')}, 같은 방향으로 힘이 모여요.`;
  if (SAENG[saju] === face) return `사주의 대표 기운 ${josa(saju, '이', '가')} 얼굴의 ${name(face)} 기질을 받쳐 줘요.`;
  if (SAENG[face] === saju) return `얼굴의 ${name(face)} 기질이 사주의 대표 기운 ${josa(saju, '을', '를')} 키워 줘요.`;
  return `얼굴은 ${name(face)}, 사주는 ${name(saju)} 기운이라 서로 다른 두 가지 장점을 함께 가졌어요.`;
}

export function judge(m: Measurements, baseline: Baseline, saju: SajuResult, gwae: Gwae): Judgement {
  const face = classifyFace(m, baseline);
  const faceInfo = OHAENG_INFO[face.main];

  const categories: CategoryJudgement[] = CATEGORIES.map((c) => {
    const features = c.features.map((f) => judgeFeature(f, m, baseline));
    const links: string[] = [];
    if (c.ohaeng.includes(saju.dominant)) links.push(`사주의 대표 기운 ${josa(saju.dominant, '이', '가')} ${c.label}을 받쳐 줘요.`);
    else if (c.ohaeng.includes(face.main)) links.push(`얼굴의 ${name(face.main)} 기질이 ${c.label}과 잘 맞아요.`);
    const gwaeHit = [gwae.upper, gwae.lower].find((t) => c.trigrams.includes(t));
    if (gwaeHit) links.push(`괘에 ${gwaeHit} 기운이 들어 있어 흐름을 더해 줘요.`);

    const avg = features.reduce((s, f) => s + LEVEL_SCORE[f.level], 0) / features.length;
    const stars = Math.min(5, Math.max(3, Math.round(avg * 2) / 2 + (links.length ? 0.5 : 0)));
    const offWithCaution = c.features.find((rule, i) => features[i].level === 'off' && rule.caution);
    return {
      key: c.key, label: c.label, icon: c.icon, stars, features,
      link: links.length ? links.join(' ') : null,
      caution: offWithCaution?.caution ?? null,
    };
  });

  const mg = judgeFeature(OVERALL, m, baseline);
  const missingLine = saju.missing.length
    ? ` ${saju.missing.map(name).join('·')} 기운을 채우면 더 좋아요. ${OHAENG_INFO[saju.missing[0]].advice}.`
    : '';
  const timeNote = gwae.timeSource === '체험 시각' ? ' (태어난 시간 대신 지금 이 순간의 시간으로 뽑았어요.)' : '';

  return {
    face, saju, gwae, categories,
    overall: {
      headline: `당신은 ${faceInfo.adj} ${face.main}형(${faceInfo.hanja}形)이에요.`,
      faceLine: `${faceInfo.shape} 얼굴은 관상서에서 ${face.main}형으로 보고, ${faceInfo.trait}을 뜻해요. ${mg.observe}. ${mg.basis}. ${mg.meaning}.`,
      sajuLine: relationLine(face.main, saju.dominant) + missingLine,
      gwaeLine: `지금 뽑힌 괘는 ${gwae.name}(${gwae.hanja}) — ${gwae.meaning}. ${gwae.message}${timeNote}`,
    },
  };
}
