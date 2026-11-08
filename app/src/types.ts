export type Ohaeng = '목' | '화' | '토' | '금' | '수';
export const OHAENG: Ohaeng[] = ['목', '화', '토', '금', '수'];

export type Trigram = '건' | '태' | '리' | '진' | '손' | '감' | '간' | '곤';
/** 선천팔괘수 순서: 1 건 … 8 곤 */
export const TRIGRAMS: Trigram[] = ['건', '태', '리', '진', '손', '감', '간', '곤'];

export type MeasureId =
  | 'm01' | 'm02' | 'm03' | 'm04' | 'm05' | 'm06' | 'm07' | 'm08' | 'm09'
  | 'm10' | 'm11' | 'm12' | 'm13' | 'm14' | 'm15' | 'm16' | 'm17';

export type Measurements = Partial<Record<MeasureId, number>>;
export type Baseline = Record<MeasureId, { mean: number; sd: number }>;

export interface Point { x: number; y: number; z?: number }

export interface BirthInput {
  calendar: 'solar' | 'lunar';
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  /** 0–23, 모르면 null */
  hour: number | null;
}

export interface FaceType { main: Ohaeng; sub: Ohaeng; scores: Record<Ohaeng, number> }

export interface SajuResult {
  pillars: string[];
  counts: Record<Ohaeng, number>;
  dominant: Ohaeng;
  missing: Ohaeng[];
  lunar: { year: number; month: number; day: number };
}

export interface Gwae {
  upper: Trigram;
  lower: Trigram;
  movingLine: number;
  name: string;
  hanja: string;
  meaning: string;
  message: string;
  timeSource: '태어난 시간' | '체험 시각';
}

export type Level = 'good' | 'normal' | 'off';

export interface FeatureJudgement {
  id: MeasureId;
  part: string;
  level: Level;
  z: number;
  observe: string;
  basis: string;
  meaning: string;
}

export type CategoryKey = 'study' | 'wealth' | 'love' | 'people' | 'health' | 'challenge';

export interface CategoryJudgement {
  key: CategoryKey;
  label: string;
  icon: string;
  stars: number;
  features: FeatureJudgement[];
  link: string | null;
  caution: string | null;
  /** 문장 틀 고르기용 (사람마다 달라짐) */
  variant: number;
}

export interface Judgement {
  face: FaceType;
  saju: SajuResult;
  gwae: Gwae;
  overall: { headline: string; faceLine: string; sajuLine: string; gwaeLine: string; luckyLine: string };
  categories: CategoryJudgement[];
  /** 측정값·사주·괘로 만든 사람별 숫자. 같은 사람이면 같은 값 */
  seed: number;
}

export interface ReadingText {
  headline: string;
  summary: string;
  categories: { key: CategoryKey; text: string; tip: string | null }[];
  qrSummary: string;
  source: 'llm' | 'fallback';
}
