// MediaPipe 랜드마크 → 측정값 m01–m17 → wiki/gwansang/measurement-map.md
import spec from '../../data/landmarks.json';
import type { MeasureId, Measurements, Point } from '../types';

type Item =
  | { kind: 'dist'; a: number; b: number; norm: 'faceWidth' | 'faceLength' }
  | { kind: 'pairDist'; pairs: number[][]; norm: 'faceWidth' }
  | { kind: 'eyeOpen'; top: number; bottom: number; corners: number[] }
  | { kind: 'eyeTilt'; pairs: number[][] }
  | { kind: 'mouthLift'; corners: number[]; center: number[] }
  | { kind: 'angle'; a: number; vertex: number; b: number };

const ITEMS = spec.items as Record<MeasureId, Item>;
const [W_A, W_B] = spec.faceWidth;

export function measureFrame(landmarks: Point[], width: number, height: number): Measurements {
  const p = (i: number) => ({ x: landmarks[i].x * width, y: landmarks[i].y * height });
  const dist = (a: number, b: number) => Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y);
  const faceWidth = dist(W_A, W_B);
  const lengthItem = ITEMS.m01 as { a: number; b: number };
  const faceLength = dist(lengthItem.a, lengthItem.b);
  const norm = { faceWidth, faceLength };

  const out: Measurements = {};
  for (const [id, item] of Object.entries(ITEMS) as [MeasureId, Item][]) {
    switch (item.kind) {
      case 'dist':
        out[id] = dist(item.a, item.b) / norm[item.norm];
        break;
      case 'pairDist':
        out[id] = item.pairs.reduce((s, [a, b]) => s + dist(a, b), 0) / item.pairs.length / faceWidth;
        break;
      case 'eyeOpen':
        out[id] = dist(item.top, item.bottom) / dist(item.corners[0], item.corners[1]);
        break;
      case 'eyeTilt': {
        // 바깥 눈꼬리가 안쪽보다 높으면(+)
        const deg = item.pairs.map(([outer, inner]) => {
          const o = p(outer), n = p(inner);
          return (Math.atan2(n.y - o.y, Math.abs(o.x - n.x)) * 180) / Math.PI;
        });
        out[id] = deg.reduce((s, d) => s + d, 0) / deg.length;
        break;
      }
      case 'mouthLift': {
        const cornerY = (p(item.corners[0]).y + p(item.corners[1]).y) / 2;
        const centerY = (p(item.center[0]).y + p(item.center[1]).y) / 2;
        out[id] = (centerY - cornerY) / faceWidth;
        break;
      }
      case 'angle': {
        const v = p(item.vertex), a = p(item.a), b = p(item.b);
        const a1 = Math.atan2(a.y - v.y, a.x - v.x);
        const a2 = Math.atan2(b.y - v.y, b.x - v.x);
        let deg = Math.abs(a1 - a2) * (180 / Math.PI);
        if (deg > 180) deg = 360 - deg;
        out[id] = deg;
        break;
      }
    }
  }
  return out;
}

/** 코끝(1)이 양 볼(234, 454) 사이 가운데 근처면 정면 (좌우 회전 약 10° 이내) */
export function isFrontal(landmarks: Point[], tolerance = 0.08): boolean {
  const l = landmarks[W_A].x, r = landmarks[W_B].x, n = landmarks[1].x;
  const t = (n - l) / (r - l);
  return Math.abs(t - 0.5) < tolerance;
}

export function medianOf(frames: Measurements[]): Measurements {
  const out: Measurements = {};
  const ids = new Set(frames.flatMap((f) => Object.keys(f))) as Set<MeasureId>;
  for (const id of ids) {
    const vals = frames.map((f) => f[id]).filter((v): v is number => v !== undefined).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    out[id] = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }
  return out;
}
