// 웹캠 켜기. 오류는 원인별로 안내한다.
export function cameraErrorMessage(e: unknown): string {
  const name = e instanceof Error ? e.name : '';
  if (name === 'NotAllowedError') return '카메라 권한이 막혀 있어요. 주소창 왼쪽 자물쇠에서 카메라를 허용해 주세요.';
  if (name === 'NotReadableError') return '다른 프로그램이 카메라를 쓰고 있어요. 화상회의 앱 등을 닫고 다시 시도해 주세요.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return '카메라를 찾지 못했어요. 연결을 확인해 주세요.';
  if (!navigator.mediaDevices?.getUserMedia) return 'localhost 또는 HTTPS 주소에서 열어 주세요.';
  return '카메라를 켜지 못했어요. 새로고침 후 다시 시도해 주세요.';
}

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  return stream;
}
