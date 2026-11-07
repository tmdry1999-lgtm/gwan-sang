# 웹 배포: GitHub Pages + 풀이용 Ollama 서버

```
방문자 브라우저 ── 얼굴 측정·판정은 여기서 끝 (사진·좌표·생일은 안 나감)
   │ 판정 결과 텍스트만, HTTPS
   ▼
Oracle 무료 서버: Caddy(HTTPS, /api/chat·/api/tags만 열림, 기록 없음) → Ollama(gemma3:1b)
```

- 사이트: `https://<계정>.github.io/gwan-sang/`
- 서버가 꺼져 있거나 느리면 앱이 알아서 기본 문장으로 풀이한다. 사이트 자체는 항상 열린다.

## 1. 사이트 (GitHub Pages)

1. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꾼다.
2. main에 push하면 `.github/workflows/pages.yml` 이 테스트 → 빌드 → 배포한다. 진행은 **Actions** 탭에서 본다.

## 2. 풀이 서버 (Oracle Cloud 평생 무료)

1. https://www.oracle.com/kr/cloud/free/ 가입 (카드 등록은 본인 확인용, 무료 범위 안에서는 청구 없음). 홈 리전은 **서울** 또는 **춘천**.
2. **컴퓨트 → 인스턴스 → 인스턴스 생성**
   - 이미지: **Canonical Ubuntu 24.04**
   - 구성: **Ampere (VM.Standard.A1.Flex)**, OCPU **4**, 메모리 **24GB** (무료 한도)
   - SSH 키: "키 쌍 생성" → 개인 키 내려받아 두기
   - "용량 부족"이 뜨면 시간 두고 다시 시도하거나 OCPU 2 / 12GB로 줄인다.
3. 인스턴스 화면의 **서브넷 → 보안 목록 → 수신 규칙 추가**: 소스 `0.0.0.0/0`, TCP, 대상 포트 `80,443`
4. 내 PC에서 접속해 설치 (공용 IP는 인스턴스 화면에 있음):

   ```powershell
   ssh -i 내려받은키.key ubuntu@<공용IP>
   ```
   ```bash
   git clone https://github.com/<계정>/gwan-sang.git
   sudo bash gwan-sang/deploy/setup-server.sh https://<계정>.github.io
   ```

   마지막에 `https://<IP>.sslip.io` 주소가 나온다. 10분 안팎 걸린다.
5. 저장소 **Settings → Secrets and variables → Actions → Variables → New repository variable**
   - `OLLAMA_URL` = 위 주소 (끝에 `/` 없이)
6. **Actions → Deploy to GitHub Pages → Run workflow** 로 다시 배포하면 사이트가 서버를 쓴다.

## 확인

- 사이트에서 `Ctrl+Shift+O` → Ollama 칸이 "연결됨"이면 성공.
- 풀이 아래 표시가 "풀이 문장: AI"면 서버가 쓴 것, "기본 문장"이면 대체 문장이다.

## 알아 둘 점

- **속도**: GPU가 없어 한 사람 풀이에 30초–1분쯤 걸린다. 카드가 하나씩 채워진다. 동시에 1명씩 처리하고 9번째 대기자부터는 기본 문장으로 넘어간다.
- **모델**: 기본 `gemma3:1b`. 문장 품질을 더 원하면 서버에서 `sudo MODEL=gemma3:4b bash gwan-sang/deploy/setup-server.sh https://<계정>.github.io` 로 다시 설치하고 저장소 변수 `OLLAMA_MODEL=gemma3:4b` 를 넣는다. 대신 2–3배 느려진다.
- **저장 안 함**: Caddy 접속 기록 없음, Ollama 출력은 버림(`StandardOutput=null`). 문제를 볼 때만 `/etc/systemd/system/ollama.service.d/override.conf` 의 그 두 줄을 잠시 지우고 `sudo systemctl restart ollama`.
- **남용**: 허용한 사이트 밖의 브라우저 요청은 Ollama가 거절한다. 다만 브라우저가 아닌 도구로는 누구나 호출할 수 있어서, 동시 1개·대기 8개 제한으로 서버가 버티게만 해 두었다.
- **Oracle 회수 정책**: 무료 인스턴스가 7일 동안 거의 놀면 회수될 수 있다. 오래 쓸 거면 계정을 "종량제(PAYG)"로 올려 두면 회수 대상에서 빠지고, 무료 한도 안에서는 여전히 0원이다.
