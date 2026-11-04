// MediaPipe Face Landmarker (프로젝트 안 wasm·모델만 씀, 외부 전송 없음)
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Point } from '../types';

export interface FaceFrame {
  landmarks: Point[];
  smiling: boolean;
}

export async function createLandmarker(): Promise<FaceLandmarker> {
  const base = new URL('mediapipe/', document.baseURI).href;
  const fileset = await FilesetResolver.forVisionTasks(base + 'wasm');
  const make = (delegate: 'GPU' | 'CPU') =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: base + 'face_landmarker.task', delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
  try {
    return await make('GPU');
  } catch {
    return await make('CPU'); // 내장 GPU에서 WebGL이 안 될 때
  }
}

export function detect(lm: FaceLandmarker, video: HTMLVideoElement, now: number): FaceFrame | null {
  const r = lm.detectForVideo(video, now);
  const landmarks = r.faceLandmarks[0];
  if (!landmarks) return null;
  const shapes = r.faceBlendshapes[0]?.categories ?? [];
  const smile = shapes.filter((c) => c.categoryName.startsWith('mouthSmile')).reduce((s, c) => Math.max(s, c.score), 0);
  return { landmarks, smiling: smile > 0.5 };
}
