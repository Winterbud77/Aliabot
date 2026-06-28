# 🚀 AliaBot Conductor: Phase 5+ Master Roadmap & Handover

> **문서 목적:** '일정/옵시디언 날짜 폴백 및 다중 뱃지 UI 개선, 동기화 경로 이전' 세션을 성공적으로 종료하고, 새로운 'AliaBot Phase 5.6' 세션으로 완벽한 맥락(Context)을 상속하기 위한 인수인계 및 개발 마스터 로드맵입니다.

---

## 1. 🎯 다음 세션(새 대화창) 핵심 목표: "이메일/캘린더 샌드박스 테스팅 및 예외 데이터 백필 모니터링"

다음 세션에서는 구현 완료된 이메일 목적지 전송 기능과 캘린더 전송 기능의 샌드박스(실제 메일/캘린더 API 연동 전송) 연동 실 검증을 수행하고, 날짜 파싱 오동작 예외에 대응하는 복구 모니터링에 집중합니다.

### ✅ 이번 세션 완료 사항 (Phase 5.5 ~ Phase 5.6)
* **대시보드 스프레드시트 뷰 전환 (Phase 5.5)**:
  * 기존의 모바일용 세로 카드 리스트 형식 외에, 전체 메모 데이터를 엑셀처럼 격자 형태로 넓게 모아 볼 수 있는 표 보기(Table View) 모드 전환 스위치 구현.
  * 테이블 모드 활성화 시 전체 레이아웃 너비가 `450px`에서 `1200px`(`width: 95%`)로 부드럽게 확장되는 가변 레이아웃 구현.
  * 표 보기 상태에서의 인라인 수정 폼, 전송 뱃지, AI 가속 가시화 구현.
* **Excel 호환 CSV 다운로드 (Phase 5.5)**:
  * 한글 깨짐이 없는 UTF-8 BOM (`\uFEFF`) 기반 로컬 다운로드 유틸리티(`csvExporter.js`) 구현 및 연동.
* **이메일(Mail) 발송 채널 확장 (Phase 5.6)**:
  * 내보내기 목적지 모달에서 이메일(`Email`)이 체크된 경우, 동적으로 수신인 주소를 개별 기입할 수 있는 텍스트 인풋 폼 추가.
  * 빈 칸으로 둘 시 본인 메일(기본 로그인 계정)로 자동 매핑되고, 특정 이메일을 기입할 시 지인 등 해당 지정 이메일 주소의 수신인 파라미터(`to`)를 Cloud Functions 백엔드로 전달하도록 파이프라인 완성.
* **이메일(Mail) 샌드박스 테스팅 완료 (Phase 5.6)**:
  * Resend API Key를 Firebase Secret Manager에 정상 주입 및 배포하여 사용자의 실제 수신함으로 요약 메일 발송에 최종 성공.
* **Gemini API 429 및 401 권한 충돌 해소 (Phase 5.7)**:
  * 청정 독립 프로젝트(`AliaBot-Pro` / `+ 프로젝트 만들기` 방식) 기반의 신형 `AQ.Ab8R...` API Key 발급 및 Firebase 주입 배포 완료.
  * 리액트 `useEffect` 기반의 독립 **10초 주기 AI 백필 폴러(AI Backfill Poller) 훅**을 아키텍처로 도입하여, 비동기 기아(Starvation)를 해결하고 타임스탬프(`createdAt`)가 유실된 구형 문서까지 안전하게 복원 치료하는 파이프라인 정착 완료.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

### 🗓️ Phase 5.8: 수신 이메일(Inbound Email) 웹훅 처리 및 실시간 AI 디스패치 (다음 세션 주 목표)
* **Resend Inbound Route 수신 연동**:
  * 외부(사용자 혹은 Claude 에이전트 등)에서 특정 연동 이메일 주소로 답장이나 메일을 발송했을 때, Resend의 수신 경로 설정을 통해 Firebase Cloud Functions 웹훅 엔드포인트(`https://.../receiveEmail`)로 이메일 데이터를 실시간 토스하도록 웹훅 처리기 설계.
* **Claude / Gemini 양방향 디스패치(Interactive Dispatch) 프로토타입**:
  * 수신된 이메일 본문을 AI 모델로 파싱하여 메일 보낸 의도와 본문을 해석한 뒤, 해당 사용자의 Firestore DB에 자동으로 메모/일정 아이템으로 등록 또는 상태 업데이트를 실행하는 수집 엔진 개발.

---

## 2. 📚 이전 세션 VTL & SOP 점검 완료 상태

새로운 AI 에이전트(Claude 또는 Gemini)에게 아래 문서들을 읽어보라고 지시하면 현재까지 정립된 Git 수칙, PWA 구조 및 동기화 설계가 100% 동기화됩니다.

* **`Docs/20260627_AliaBot_Phase55_Spreadsheet_VTL.md`**: 대시보드 스프레드시트 뷰 전환, CSV 다운로드 및 백필 폴러 아키텍처 구현 기술로그 (본 세션 결과물)
* **`Docs/20260628_AliaBot_Email_Deploy_SOP.md`**: 이메일 API 키 환경변수 셋팅 및 배포 수칙서 (한글 토큰 파싱 에러 방지 가이드 포함)
* **`Docs/20260625_AliaBot_MultiDevice_Sync_VTL.md`**: 일정/옵시디언 날짜 폴백 구현, 다중 뱃지 UI 렌더링, `100 Source` 미러링 경로 이전 및 `.gitignore` 설정 기술로그
* **`Docs/20260625_AliaBot_MultiDevice_Sync_VSOP.md`**: 다중 기기(PC 2대 + 모바일) 옵시디언 동기화 안전 수칙 및 충돌 방지 절차서

---

## 3. 🏁 새로운 세션 시작 가이드 (First Prompt)

사용자님, 새로운 대화창(Conversation Session)을 시작하신 후 첫 마디로 아래 문장을 복사해서 그대로 붙여넣어 주세요!

> **"안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트 개발을 진행 중이야. 작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Docs/20260627_AliaBot_Phase55_Spreadsheet_VTL.md` 기술 로그를 꼼꼼히 읽고 현재 아키텍처와 다음 단계인 [Phase 5.8: 수신 이메일(Inbound Email) 웹훅 처리 및 실시간 AI 디스패치] 목표를 파악해 줘. 파악이 완료되면 준비되었다고 답변하고, 구체적인 개발 계획을 수립해 줘!"**
