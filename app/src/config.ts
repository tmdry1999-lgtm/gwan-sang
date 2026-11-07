/**
 * QR이 가리킬 결과 페이지 주소.
 * 휴대폰에서 열려면 인터넷에 올린 주소여야 한다 (예: GitHub Pages).
 * 빌드할 때 VITE_RESULT_BASE_URL=https://<계정>.github.io/<저장소>/result.html 로 넣는다.
 */
export const RESULT_BASE_URL: string =
  import.meta.env.VITE_RESULT_BASE_URL || new URL('result.html', document.baseURI).href;

export const IDLE_MS = { result: 60_000, other: 90_000 };
export const MEASURE_FRAMES = 30;
/** 카메라 fps와 상관없이 같은 빠르기로: 정면을 잡고 기다리는 시간, 30프레임을 고르게 나눠 담는 시간 */
export const STEADY_MS = 1000;
export const MEASURE_MS = 3000;
