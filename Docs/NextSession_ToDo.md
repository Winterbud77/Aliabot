# Next Session To-Do (Phase 5)

## 🐛 버그 수정 (Bug Fixes)
- [ ] 마이크(STT) 녹음 완료 후 '추가' 버튼이 작동하지 않는 현상 수정.
  - *원인 예상:* Web Speech API가 텍스트를 `inputValue` 상태(State)에 업데이트하는 시점과 버튼의 `onClick` 이벤트 동기화 문제.

## ✨ 기능 개선 (Feature Improvements)
- [ ] 한/영 혼용 음성 인식(STT) 성능 개선.
  - *현재 상태:* 브라우저 기본 내장 Web Speech API를 사용하여 `ko-KR`로 고정되어 있어 영어 발음이 한글로 뭉개지는 현상 발생.
  - *개선 방향:* Whisper API(OpenAI) 또는 구글 Cloud Speech-to-Text 도입을 통해 언어 자동 감지 및 완벽한 한/영 혼용 인식 구현.
- [ ] AI 자동 요약 및 태깅 (Option B 적용).
