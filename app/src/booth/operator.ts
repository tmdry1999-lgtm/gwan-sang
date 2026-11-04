// 운영자 패널 (Ctrl+Shift+O): Ollama 상태, 모델 선택, 기준선 잡기, 전체 화면
import { DEFAULT_MODEL, listModels } from '../llm/ollama';
import { MIN_SAMPLES, applyCalibration, calibrationSamples, resetCalibration } from './baseline-store';

const KEY_MODEL = 'gwansang.model';
let calibrating = false;

export const isCalibrating = () => calibrating;
export function selectedModel(): string {
  try {
    return localStorage.getItem(KEY_MODEL) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setupOperator() {
  const dlg = document.querySelector<HTMLDialogElement>('#operator')!;
  const $ = (id: string) => dlg.querySelector<HTMLElement>(id)!;
  const modelSel = $('#op-model') as HTMLSelectElement;
  const note = $('#op-note');

  async function refresh() {
    $('#op-samples').textContent = `${calibrationSamples().length}명 (적용하려면 ${MIN_SAMPLES}명 이상)`;
    $('#op-ollama').textContent = '확인 중…';
    const models = await listModels();
    if (!models) {
      $('#op-ollama').textContent = '연결 안 됨 — 기본 문장으로 풀이해요. (ollama serve, OLLAMA_ORIGINS 확인)';
      modelSel.replaceChildren(new Option(selectedModel()));
      return;
    }
    $('#op-ollama').textContent = `연결됨 · 모델 ${models.length}개`;
    const cur = selectedModel();
    modelSel.replaceChildren(...models.map((m) => new Option(m, m, false, m === cur)));
    if (!models.includes(cur)) note.textContent = `선택된 모델 ${cur}이 설치되어 있지 않아요: ollama pull ${cur}`;
  }

  addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      note.textContent = '';
      dlg.showModal();
      void refresh();
    }
  });
  modelSel.addEventListener('change', () => {
    try { localStorage.setItem(KEY_MODEL, modelSel.value); } catch { /* 저장 불가 */ }
  });
  ($('#op-calib') as HTMLInputElement).addEventListener('change', (e) => {
    calibrating = (e.target as HTMLInputElement).checked;
  });
  $('#op-apply').addEventListener('click', () => {
    note.textContent = applyCalibration() ? '기준선을 적용했어요.' : `표본이 ${MIN_SAMPLES}명 이상 필요해요.`;
    void refresh();
  });
  $('#op-reset').addEventListener('click', () => {
    resetCalibration();
    note.textContent = '기본 기준선으로 되돌렸어요.';
    void refresh();
  });
  $('#op-fullscreen').addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  });
  $('#op-close').addEventListener('click', () => dlg.close());
}
