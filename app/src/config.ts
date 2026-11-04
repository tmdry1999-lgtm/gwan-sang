/**
 * QR이 가리킬 결과 페이지 주소.
 * 휴대폰에서 열려면 인터넷에 올린 주소여야 한다 (예: GitHub Pages).
 * 빌드할 때 VITE_RESULT_BASE_URL=https://<계정>.github.io/<저장소>/result.html 로 넣는다.
 */
export const RESULT_BASE_URL: string =
  import.meta.env.VITE_RESULT_BASE_URL || new URL('result.html', document.baseURI).href;

export const IDLE_MS = { result: 60_000, other: 90_000 };
export const MEASURE_FRAMES = 30;
