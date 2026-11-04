// MediaPipe wasm과 얼굴 모델을 app/public에 복사·다운로드한다. 부스는 오프라인이어도 돌아가야 한다.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const outDir = join(root, 'app', 'public', 'mediapipe');
mkdirSync(outDir, { recursive: true });

cpSync(join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm'), join(outDir, 'wasm'), { recursive: true });
console.log('wasm 복사 완료');

const modelPath = join(outDir, 'face_landmarker.task');
if (!existsSync(modelPath)) {
  const url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`모델 다운로드 실패: ${res.status}`);
  writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
  console.log('모델 다운로드 완료');
} else {
  console.log('모델 이미 있음');
}
