// 결과 화면: 찍은 얼굴 위에 측정한 부위를 표시 (좌우 반전, 메모리에만 존재)
import spec from '../../data/landmarks.json';
import type { MeasureId, Point } from '../types';

type AnyItem = { a?: number; b?: number; pairs?: number[][]; corners?: number[]; vertex?: number; top?: number; bottom?: number };
const ITEMS = spec.items as Record<MeasureId, AnyItem>;

export function pointsOf(id: MeasureId): number[] {
  const it = ITEMS[id];
  return [it.a, it.b, it.vertex, it.top, it.bottom, ...(it.pairs?.flat() ?? []), ...(it.corners ?? [])].filter(
    (v): v is number => v !== undefined,
  );
}

/** 영상의 현재 프레임을 거울처럼 뒤집어 캔버스에 그린다 */
export function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  ctx.restore();
}

/** 얼굴 영역만 잘라 결과 캔버스에 그리고, 부위 점을 금색으로 찍는다 */
export function drawSnapshot(frame: HTMLCanvasElement, out: HTMLCanvasElement, landmarks: Point[], ids: MeasureId[]) {
  const W = frame.width, H = frame.height;
  const xs = landmarks.map((p) => (1 - p.x) * W), ys = landmarks.map((p) => p.y * H);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = (maxX - minX) * 0.25;
  const sx = Math.max(0, minX - pad), sy = Math.max(0, minY - pad * 1.4);
  const sw = Math.min(W - sx, maxX - minX + pad * 2), sh = Math.min(H - sy, maxY - minY + pad * 2.2);

  out.width = 600;
  out.height = Math.round((600 * sh) / sw);
  const k = out.width / sw;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, out.width, out.height);
  ctx.fillStyle = '#0d1a1d55';
  ctx.fillRect(0, 0, out.width, out.height);

  const at = (i: number) => [((1 - landmarks[i].x) * W - sx) * k, (landmarks[i].y * H - sy) * k] as const;
  // 얼굴 그물: 아주 옅게
  ctx.fillStyle = '#f0e6cf33';
  for (let i = 0; i < landmarks.length; i += 3) {
    const [x, y] = at(i);
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  // 측정 부위: 금색 점과 선
  ctx.strokeStyle = '#e3c797aa';
  ctx.fillStyle = '#f1d39c';
  ctx.lineWidth = 1.5;
  for (const id of ids) {
    const pts = pointsOf(id).map(at);
    ctx.beginPath();
    pts.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
