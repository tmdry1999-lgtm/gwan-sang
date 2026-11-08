# 관상 체험 부스 앱 — 프로젝트 규칙

웹캠으로 얼굴을 측정해 관상 + 사주 + 매화역수를 통합한 **체험용** 풀이를 보여 주는 부스 데모.
목적은 "바이브코딩으로 이런 앱도 만들 수 있다"를 학생·학부모에게 보여 주는 것.

- 설계서: [docs/superpowers/specs/2026-11-02-gwansang-design.md](docs/superpowers/specs/2026-11-02-gwansang-design.md)
- 지식 위키 입구: [wiki/index.md](wiki/index.md)

## 실행

```powershell
npm install            # 의존성 + MediaPipe 모델을 app/public/mediapipe 에 받음
npm run dev            # http://localhost:5173  (크롬에서 열기)
npm test               # 판정 엔진·사주·괘·QR 단위 테스트
npm run build          # dist/ (QR 결과 페이지까지 포함)
```

- 운영자 패널: `Ctrl+Shift+O` (Ollama 상태, 모델 선택, 기준선 잡기, 전체 화면)
- Ollama 연결: Ollama 설치 → `ollama pull gemma3:4b` → 환경 변수 `OLLAMA_ORIGINS=http://localhost:5173` 설정 후 Ollama 재시작. 연결이 없으면 앱은 미리 쓴 기본 문장으로 풀이한다.
- QR이 휴대폰에서 열리려면 결과 페이지를 인터넷에 올리고 `VITE_RESULT_BASE_URL=https://.../result.html`로 빌드한다. (그 전에는 QR이 localhost를 가리킴)
- 웹 배포: main에 push하면 GitHub Actions가 GitHub Pages에 올린다(`.github/workflows/pages.yml`). 풀이용 Ollama 서버 만들기와 저장소 변수 `OLLAMA_URL`은 [deploy/README.md](deploy/README.md).

## 코드 지도

| 폴더 | 하는 일 |
|---|---|
| `app/src/engine/` | 판정: 오행형 얼굴(face), 사주(saju), 매화역수(maehwa), 카테고리(judge) |
| `app/src/measure/` | 랜드마크 → 측정값 m01–m17 |
| `app/src/llm/` | Ollama 호출, 금지어 필터, 기본 문장(fallback) |
| `app/src/share/` | QR 결과 압축(URL #) |
| `app/src/booth/` | 생일 입력, 운영자 패널, 기준선 저장 |
| `app/data/` | 위키에서 뽑은 규칙 JSON |

## 절대 규칙

1. **얼굴 사진·랜드마크 좌표·생일은 기기 밖으로 나가지 않는다.** 풀이 문장용 판정 결과 텍스트만 Ollama로 보낸다. Ollama는 부스 노트북의 로컬 Ollama이거나, 우리가 직접 운영하며 받은 내용을 저장하지 않는 서버([deploy/](deploy/README.md))만 쓴다. 클라우드 LLM API 금지.
2. **결과는 서버에 저장하지 않는다.** QR은 결과를 URL `#` 뒤에 압축해 담고, 정적 결과 페이지가 그것을 읽어 그린다.
3. **"체험용"이라고 쓴다.** "오락용"이라는 말은 쓰지 않는다.
4. **좋은 말이 먼저, 조심할 점도 재미로 알려 준다.** 별점이 낮은 운세 둘에는 "건강에 유의하세요", "큰돈이 나갈 수 있어요" 같은 가벼운 경고를 붙인다. 수명·질병 이름·사고·이혼·외모 평가는 여전히 금지. 말투 규칙은 [wiki/tone-guide.md](wiki/tone-guide.md).
5. **모든 풀이에 이유를 보인다.** "어느 부위가 어떻다 → 어느 근거에 따라 → 이렇게 본다".
6. 모르는 것은 추측해서 정하지 말고 사용자에게 묻는다.

---

## LLM 위키 운영 규칙 (카파시 LLM Wiki 방식)

이 프로젝트의 관상 지식은 세 층으로 관리한다.

| 층 | 폴더 | 누가 쓰나 | 규칙 |
|---|---|---|---|
| 원자료 | `raw/` | 사람이 넣고, LLM은 읽기만 | 고치지 않는다. 출처 URL·서명·날짜를 남긴다. |
| 위키 | `wiki/` | LLM이 쓰고 고친다 | 원자료를 요약·정리한 마크다운. 사람이 읽고 앱이 참조한다. |
| 스키마 | `CLAUDE.md` (이 파일) | 사람과 LLM이 함께 | 위키 구조와 작업 규칙. |

### 위키 페이지 형식

모든 위키 페이지는 이 머리말로 시작한다.

```markdown
---
title: 페이지 제목
sources: [raw/sources.md#항목-앵커, ...]
confidence: 높음 | 중간 | 낮음   # 출처끼리 일치하는 정도
updated: YYYY-MM-DD
---
```

- 다른 페이지는 상대 경로 마크다운 링크로 잇는다.
- 출처끼리 다른 내용은 지우지 말고 "유파별 차이" 절에 함께 적는다.
- `confidence: 낮음` 항목은 앱 풀이에 쓰지 않거나, 쓸 때 근거 문구를 약하게 쓴다.

### 작업 세 가지

1. **수집(ingest)**: 새 자료를 `raw/`에 넣으면 → 관련 위키 페이지를 고치고 → `wiki/index.md`와 `wiki/log.md`를 갱신한다.
2. **질문(query)**: 위키에서 답을 찾는다. 좋은 답은 새 위키 페이지로 남긴다.
3. **점검(lint)**: 페이지끼리 모순, 고아 페이지(링크 없음), 출처 없는 문장, 오래된 내용을 찾아 `wiki/log.md`에 적는다.

### 위키 → 앱 연결

앱은 위키를 직접 읽지 않는다. 위키에서 규칙을 뽑아 `app/data/*.json`(측정 기준, 해석 문구 조각)으로 만들고,
Ollama 프롬프트에는 그 JSON과 [wiki/prompt/llm-prompt.md](wiki/prompt/llm-prompt.md)의 틀만 넣는다.
위키를 고치면 해당 JSON도 함께 고친다.
