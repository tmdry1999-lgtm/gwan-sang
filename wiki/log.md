# 위키 작업 기록

새 기록을 맨 위에 쓴다. 형식: `## YYYY-MM-DD 작업종류 — 한 줄 요약` 다음 줄에 바뀐 페이지.

## 2026-11-04 앱 연결 — 위키 → app/data/*.json
- [sibigung.md](gwansang/sibigung.md), [samjeong-ogwan.md](gwansang/samjeong-ogwan.md), [plan-a-fortune.md](readings/plan-a-fortune.md) → `app/data/rules.json`
- [measurement-map.md](gwansang/measurement-map.md) → `app/data/landmarks.json`, `app/data/baseline.json`(추정 초기값)
- [gigwae.md](maehwa/gigwae.md) → `app/data/hexagrams.json` (64괘 체험용 메시지)
- 건강운: 질액궁(산근)은 정면 측정이 어려워 삼정의 중정·하정 균형(m05, m06)으로 대신함
- 사주 라이브러리: `@fullstackfamily/manseryeok` (한국천문연구원 기준) 채택

## 2026-11-02 ingest — 위키 첫 작성
- 웹 자료 s01–s13 수집 → [raw/sources.md](../raw/sources.md)
- 전 페이지 신규 작성
- 남은 일:
  - 마의상법·유장상법·매화역수 원문 발췌를 `raw/`에 넣고 g01–g04 검증
  - 질액궁·재백궁 위치는 출처마다 다름 → 앱은 [sibigung.md](gwansang/sibigung.md)의 "앱 채택안"을 따름
  - 사주 라이브러리 선택(한국 기준 vs 중국 기준 절기) → 설계서 참조
