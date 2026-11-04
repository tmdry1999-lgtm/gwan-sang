// 측정 기준선: 기본값(app/data/baseline.json) + 운영자가 스태프로 잡은 값(이 브라우저에만 저장)
import defaults from '../../data/baseline.json';
import type { Baseline, MeasureId, Measurements } from '../types';

const KEY_BASELINE = 'gwansang.baseline';
const KEY_SAMPLES = 'gwansang.calibSamples';
export const MIN_SAMPLES = 10;

const read = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch { /* 저장 불가 환경: 기본값으로 계속 */ }
};

const DEFAULTS = Object.fromEntries(Object.entries(defaults).filter(([k]) => k.startsWith('m'))) as Baseline;

export function loadBaseline(): Baseline {
  return { ...DEFAULTS, ...read<Partial<Baseline>>(KEY_BASELINE, {}) };
}

export function calibrationSamples(): Measurements[] {
  return read<Measurements[]>(KEY_SAMPLES, []);
}

export function addCalibrationSample(m: Measurements): number {
  const all = [...calibrationSamples(), m];
  write(KEY_SAMPLES, all);
  return all.length;
}

/** 모은 표본으로 평균·표준편차를 계산해 적용. 표본이 모자라면 false */
export function applyCalibration(): boolean {
  const samples = calibrationSamples();
  if (samples.length < MIN_SAMPLES) return false;
  const out: Partial<Baseline> = {};
  for (const id of Object.keys(DEFAULTS) as MeasureId[]) {
    const vals = samples.map((s) => s[id]).filter((v): v is number => v !== undefined);
    if (vals.length < MIN_SAMPLES) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length - 1));
    out[id] = { mean, sd: sd || DEFAULTS[id].sd };
  }
  write(KEY_BASELINE, out);
  return true;
}

export function resetCalibration() {
  write(KEY_BASELINE, null);
  write(KEY_SAMPLES, null);
}
