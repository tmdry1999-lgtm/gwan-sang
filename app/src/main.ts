// 부스 앱: 대기 → 생일 → 얼굴 → 결과. 모든 데이터는 메모리에만 두고 "처음으로"에서 지운다.
import QRCode from 'qrcode';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { cameraErrorMessage, startCamera } from './camera/camera';
import { createLandmarker, detect, type FaceFrame } from './camera/landmarker';
import { hourOptions, parseBirth } from './booth/birth-form';
import { addCalibrationSample, loadBaseline } from './booth/baseline-store';
import { setupOperator, selectedModel, isCalibrating } from './booth/operator';
import { castGwae } from './engine/maehwa';
import { computeSaju } from './engine/saju';
import { judge } from './engine/judge';
import { pickFigure } from './engine/figure';
import { figureCard } from './ui/figure-card';
import { isFrontal, measureFrame, medianOf } from './measure/measure';
import { writeReading } from './llm/ollama';
import { buildFallback } from './llm/fallback';
import { buildResultUrl, toPayload } from './share/payload';
import { captureFrame, drawSnapshot } from './ui/snapshot';
import { IDLE_MS, MEASURE_FRAMES, MEASURE_MS, RESULT_BASE_URL, STEADY_MS } from './config';
import type { BirthInput, Judgement, Measurements, ReadingText, SajuResult } from './types';

type Screen = 'attract' | 'birth' | 'camera' | 'result';
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

const video = $<HTMLVideoElement>('#video');
const liveOverlay = $<HTMLCanvasElement>('#live-overlay');
const guide = $<HTMLDivElement>('.guide');
const camTitle = $<HTMLHeadingElement>('#cam-title');
const camHint = $<HTMLParagraphElement>('#cam-hint');
const camProgress = $<HTMLSpanElement>('#cam-progress');
const camError = $<HTMLParagraphElement>('#cam-error');
const form = $<HTMLFormElement>('#birth-form');

let landmarker: FaceLandmarker | null = null;
let stream: MediaStream | null = null;
let session: { birth: BirthInput; saju: SajuResult } | null = null;
/** 화면이 바뀌면 올라가서 이전 루프·응답을 무효로 만든다 */
let runId = 0;

// ── 화면 전환 ─────────────────────────────────────────
let current: Screen = 'attract';
function show(screen: Screen) {
  current = screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach((el) => (el.hidden = el.dataset.screen !== screen));
  armIdle();
}

function reset() {
  runId++;
  session = null;
  form.reset();
  form.querySelector<HTMLElement>('[data-leap]')!.hidden = true;
  form.querySelector('.form-error')!.textContent = '';
  for (const id of ['#snapshot', '#qr', '#live-overlay']) {
    const c = $<HTMLCanvasElement>(id);
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  }
  $('#cards').replaceChildren();
  $('#chips').replaceChildren();
  show('attract');
}

// ── 자동 리셋 ─────────────────────────────────────────
let idleTimer = 0;
function armIdle() {
  clearTimeout(idleTimer);
  if (current === 'attract') return;
  idleTimer = window.setTimeout(reset, current === 'result' ? IDLE_MS.result : IDLE_MS.other);
}
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, armIdle, { passive: true });

// ── 1. 생일 ───────────────────────────────────────────
const hourSelect = $<HTMLSelectElement>('#hour-select');
for (const o of hourOptions()) hourSelect.add(new Option(o.label, o.value));

form.addEventListener('change', () => {
  const lunar = (form.elements.namedItem('calendar') as RadioNodeList).value === 'lunar';
  form.querySelector<HTMLElement>('[data-leap]')!.hidden = !lunar;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
  const parsed = parseBirth({
    calendar: (form.elements.namedItem('calendar') as RadioNodeList).value,
    year: v('year'), month: v('month'), day: v('day'), hour: v('hour'),
    leap: (form.elements.namedItem('leap') as HTMLInputElement).checked,
  });
  const err = form.querySelector('.form-error')!;
  if (!parsed.ok) return void (err.textContent = parsed.error);
  try {
    session = { birth: parsed.birth, saju: computeSaju(parsed.birth) };
  } catch {
    return void (err.textContent = '그 날짜를 달력에서 찾지 못했어요. 음력·윤달을 다시 확인해 주세요.');
  }
  err.textContent = '';
  void enterCamera();
});

// ── 2. 얼굴 ───────────────────────────────────────────
async function enterCamera() {
  show('camera');
  const myRun = ++runId;
  camError.textContent = '';
  camTitle.textContent = '원 안에 얼굴을 맞춰 주세요';
  camHint.textContent = landmarker ? '편하게 정면을 바라봐 주세요.' : 'AI 얼굴 인식을 준비하고 있어요…';
  camProgress.style.width = '0%';
  try {
    stream ??= await startCamera(video);
  } catch (e) {
    camError.textContent = cameraErrorMessage(e);
    return;
  }
  try {
    landmarker ??= await createLandmarker();
  } catch {
    camError.textContent = 'AI 얼굴 인식을 불러오지 못했어요. 새로고침해 주세요.';
    return;
  }
  if (myRun !== runId) return;
  camHint.textContent = '편하게 정면을 바라봐 주세요.';
  trackFace(myRun);
}

function trackFace(myRun: number) {
  let steadySince = -1;
  let lastSample = -Infinity;
  const frames: Measurements[] = [];
  let smiles = 0;
  let last: FaceFrame | null = null;
  let lastTs = -1;

  const tick = () => {
    if (myRun !== runId || !landmarker) return;
    const now = performance.now();
    if (video.readyState >= 2 && now !== lastTs) {
      lastTs = now;
      const f = detect(landmarker, video, now);
      const lm = f?.landmarks;
      const width = lm ? Math.abs(lm[454].x - lm[234].x) : 0;
      const ok = !!lm && isFrontal(lm) && width > 0.18 && width < 0.6;
      guide.classList.toggle('is-ok', ok);
      drawLive(lm ?? null, frames.length > 0);

      if (!ok) steadySince = -1;
      if (!lm) {
        camHint.textContent = '얼굴이 보이지 않아요. 화면 가운데로 와 주세요.';
      } else if (!ok) {
        camHint.textContent = width <= 0.18 ? '조금만 더 가까이 와 주세요.' : width >= 0.6 ? '조금만 뒤로 물러나 주세요.' : '고개를 정면으로 돌려 주세요.';
      } else if (frames.length === 0 && (steadySince < 0 || now - steadySince < STEADY_MS)) {
        if (steadySince < 0) steadySince = now;
        camHint.textContent = '좋아요! 그대로 있어 주세요.';
      } else if (now - lastSample >= MEASURE_MS / MEASURE_FRAMES) {
        lastSample = now;
        camTitle.textContent = '얼굴을 읽고 있어요';
        camHint.textContent = '움직이지 말고 편하게 정면을 봐 주세요.';
        frames.push(measureFrame(lm, video.videoWidth, video.videoHeight));
        if (f!.smiling) smiles++;
        last = f;
        camProgress.style.width = `${(frames.length / MEASURE_FRAMES) * 100}%`;
        if (frames.length >= MEASURE_FRAMES) return finish(myRun, frames, smiles, last!);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function drawLive(lm: FaceFrame['landmarks'] | null, measuring: boolean) {
  liveOverlay.width = video.videoWidth;
  liveOverlay.height = video.videoHeight;
  const ctx = liveOverlay.getContext('2d')!;
  ctx.clearRect(0, 0, liveOverlay.width, liveOverlay.height);
  if (!lm || !measuring) return;
  ctx.fillStyle = '#e3c797cc';
  for (let i = 0; i < lm.length; i += 4) ctx.fillRect(lm[i].x * liveOverlay.width, lm[i].y * liveOverlay.height, 2, 2);
}

// ── 3. 결과 ───────────────────────────────────────────
function finish(myRun: number, frames: Measurements[], smiles: number, last: FaceFrame) {
  if (!session) return reset();
  const m = medianOf(frames);
  if (smiles > frames.length / 2) delete m.m16; // 웃는 중이면 입꼬리는 재지 않는다

  const frame = document.createElement('canvas');
  captureFrame(video, frame);
  if (isCalibrating()) addCalibrationSample(m);

  const now = new Date();
  const gwae = castGwae({
    lunarYear: session.saju.lunar.year,
    lunarMonth: session.saju.lunar.month,
    lunarDay: session.saju.lunar.day,
    hour: session.birth.hour ?? now.getHours(),
    timeSource: session.birth.hour === null ? '체험 시각' : '태어난 시간',
  });
  const j = judge(m, loadBaseline(), session.saju, gwae);

  show('result');
  const ids = [...new Set(j.categories.flatMap((c) => c.features.map((f) => f.id)).concat('m07'))];
  drawSnapshot(frame, $<HTMLCanvasElement>('#snapshot'), last.landmarks, ids);
  renderStatic(j);
  void renderReading(myRun, j);
}

function renderStatic(j: Judgement) {
  $('#face-type').textContent = `${j.face.main}형 · 보조 ${j.face.sub}형`;
  $('#headline').textContent = '얼굴을 읽고 있어요…';
  $('#summary').textContent = '';
  $('#source').textContent = '';
  const chips = [
    ['사주', `${j.saju.pillars.join(' ')} · 대표 기운 ${j.saju.dominant}`],
    ['괘', `${j.gwae.name} ${j.gwae.hanja}`],
  ].map(([k, v]) => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.append(`${k} `, Object.assign(document.createElement('b'), { textContent: v }));
    return el;
  });
  $('#chips').replaceChildren(...chips);

  const cards = j.categories.map((c, i) => {
    const li = document.createElement('li');
    li.className = 'card is-loading';
    li.style.animationDelay = `${i * 80}ms`;
    li.dataset.key = c.key;
    const h = document.createElement('h3');
    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.style.setProperty('--v', String(c.stars));
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', `별 5개 중 ${c.stars}개`);
    h.append(`${c.icon} ${c.label}`, stars);
    li.append(h, Object.assign(document.createElement('p'), { textContent: '읽는 중…' }));
    return li;
  });
  const fig = figureCard(pickFigure(j.face.main, j.gwae.movingLine));
  fig.style.animationDelay = `${cards.length * 80}ms`;
  $('#cards').replaceChildren(...cards, fig);
}

function fillReading(r: ReadingText, doneKeys: Set<string>) {
  $('#headline').textContent = r.headline;
  $('#summary').textContent = r.summary;
  for (const c of r.categories) {
    if (!doneKeys.has(c.key)) continue;
    const li = document.querySelector<HTMLLIElement>(`#cards li[data-key="${c.key}"]`)!;
    li.classList.remove('is-loading');
    li.querySelector('p')!.textContent = c.text;
    li.querySelector('.tip')?.remove();
    if (c.tip) li.append(Object.assign(document.createElement('p'), { className: 'tip', textContent: `💡 ${c.tip}` }));
  }
}

// 휴대폰이 화면에서 읽을 수 있게: 주소 800자 이하(QR 버전 20 이하) + 크게 + 여백 2칸
const QR_MAX_LEN = 800;
async function drawQr(r: ReadingText, j: Judgement, figureId: string) {
  const url = buildResultUrl(RESULT_BASE_URL, toPayload(r, j, figureId), QR_MAX_LEN);
  await QRCode.toCanvas($<HTMLCanvasElement>('#qr'), url, { errorCorrectionLevel: 'L', margin: 2, width: 480 });
}

async function renderReading(myRun: number, j: Judgement) {
  const figureId = pickFigure(j.face.main, j.gwae.movingLine).id;
  // AI 문장을 기다리지 않고 기본 문장으로 QR부터 띄운다. AI 문장이 오면 다시 그린다.
  await drawQr(buildFallback(j), j, figureId);
  const done = new Set<string>();
  const reading = await writeReading(j, {
    model: selectedModel(),
    onPart: (key, partial) => {
      if (myRun !== runId) return;
      done.add(key);
      fillReading(partial, done);
    },
  });
  if (myRun !== runId) return;
  fillReading(reading, new Set(reading.categories.map((c) => c.key)));
  $('#source').textContent = reading.source === 'llm' ? '풀이 문장: AI' : '풀이 문장: 기본 문장';
  if (reading.source === 'llm') await drawQr(reading, j, figureId);
}

// ── 공통 버튼 ─────────────────────────────────────────
document.addEventListener('click', (e) => {
  const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
  if (action === 'start') show('birth');
  if (action === 'home') reset();
});

setupOperator();
show('attract');
