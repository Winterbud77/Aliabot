# 🚀 AliaBot Conductor: Phase 5+ Master Roadmap & Handover

> **문서 목적:** 기나긴 'React Todo List Enhancement' 세션을 성공적으로 종료하고, 새로운 'AliaBot' 세션으로 맥락(Context)을 전달하기 위한 공식 인수인계 및 향후 개발 마스터 플랜입니다.

---

## 1. 🎯 다음 세션(새 대화창) 핵심 목표: "지휘자의 오케스트레이션"

다음 세션에서는 AliaBot이 단순한 메모 앱을 넘어, 외부 서비스들을 조율하는 진정한 **'Conductor(지휘자)'**로 진화합니다.

### ✅ Phase 5.2: LLM 엔진 결합 및 AI 자동화 (완료 - 2026-05-26)
- **STT 버그 수정:** `continuous=false` 변경으로 마이크 후 '추가' 버튼 미작동 버그 해결
- **Gemini AI 태깅/요약:** `src/api/gemini.js` 신규 생성, 메모 저장 후 백그라운드 AI 분석, tags/summary Firestore 저장
- **Firestore 스키마 확장:** `tags[]`, `summary`, `aiProcessed` 필드 추가
- **브랜치:** `feature-ai-routing` 커밋 완료
- **UX 보강(5/31):** 최신순(`createdAt desc`) 정렬, 인라인 수정/저장, 태그 필터 배너/칩, `seq` 없는 기존 데이터에 대한 UI fallback(`index + 1`) 적용

### 🔀 Phase 5.3: 라우팅(Routing) 및 다중 노트 분할
- **플러그인 기반 전송 UI:** 현재 단일 버튼인 '내보내기'를 모달창으로 확장하여, 메모의 성격에 따라 목적지를 체크박스로 다중 선택할 수 있게 합니다.
- **구현 상태(이번 세션):** Export 모달을 `목적지(복수 체크)` 기반으로 전환 (Obsidian/Notion/Clipboard)
  - 태그 기반 추천(`src/utils/routingRules.js`)으로 체크 상태가 초기화됩니다.
  - Notion은 `Notion API Token + Database ID + Title/Content Property Name`을 Settings에서 입력해야 동작합니다.
- **노트 플랫폼 연동 (Connect to Notes):** 
  - **Notion:** 공식 API를 통해 특정 데이터베이스(표)에 메모 삽입.
  - **Obsidian:** 로컬 파일 시스템 제약 우회를 위한 Markdown 포맷 최적화 및 드래그 앤 드롭/클립보드 방식 고도화.
  - **OneNote:** (추후 옵션) Microsoft Graph API 연동.

### 🗓️ Phase 5.4: 일정 및 소통 채널 확장
- **Calendar 연결:** Google Calendar API를 연동하여 "내일 오후 3시 회의" 같은 메모를 AI가 파싱하여 자동으로 캘린더 일정으로 등록합니다.
- **DB 최적화:** Firebase Firestore의 데이터 구조를 '단순 메모'에서 '다중 메타데이터(목적지, 태그, 일정 여부 포함)'를 담을 수 있는 구조로 마이그레이션합니다.

### 🤖 Phase 6.1: Gemini 문서 분석 (NotebookLM 대체)
- Gemini API로 문서 업로드 → 분석 → 인사이트 반환 기능 구현

### 🌿 Phase 6.2: Priva RPA 브리지 연동
- **전제 조건:** Priva Office Direct(PODesktop.exe) 로컬 RPA 자동화 스크립트 완성 (ChatGPT 프로젝트 SOP 취합 중)
- **참고 문서:** `Outputs/20260429_Priva_RPA_Automation_Plan_TechLog.md`
- **통합 방식:** Firestore `/priva_commands` 컬렉션을 명령 중계소로 사용
  - AliaBot 모바일 → Firestore에 명령 저장
  - 온실 PC의 Python 에이전트 → Firestore 감시 → RPA 실행 → 결과 반환
- **Step 1:** Python Firestore 리스너 에이전트 구현
- **Step 2:** PODesktop 화면 좌표 학습 (스크린샷 제공 필요)
- **Step 3:** 기본 제어 명령 (온도 설정, ON/OFF)
- **Step 4:** 센서 읽기 → AliaBot 대시보드 표시
- **Step 5:** Gemini 자연어 명령 파싱 통합

---

## 2. 📚 이전 세션 VTL & SOP 점검 완료 상태

현재 `Outputs` 폴더에 지난 대화들의 모든 핵심 지식과 해결 과정이 완벽히 백업되어 있습니다. 새 세션의 AI(Claude 또는 Gemini)에게 **이 문서들과 함께 아래 파일들을 읽어보라고 지시하시면 맥락이 100% 복원**됩니다.

- `20260428_React_Todo_PWA_SOP_Gemini_Antigravity.md`: PWA 설치 이슈 및 다중 모델 협업 표준 절차 (최종 완성본)
- `20260428_React_Todo_PWA_TechLog_Gemini_Antigravity.md`: React PWA 초기 구축 기술 로그
- `20260507_SidersBot_Phase2_VTL.md`: Firebase DB 및 음성 인식(STT) 도입 기술 로그
- `20260510_AliaBot_Phase4_Deployment_VTL.md`: Vercel GitOps 자동 배포 및 Firestore Security Rules 구축 기록
- `20260512_AliaBot_MultiAgent_Strategy_VTL.md`: Antigravity 내 세션 분리 및 모델 교체 시 맥락 유지/파일 공유 아키텍처 (최신)

---

## 3. 🏁 새로운 세션 시작 가이드

사용자님, 새로운 탭에서 대화창(Conversation Session)을 만드신 후 첫 마디로 아래 문장을 복사해서 붙여넣어 주세요!

> **"안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트의 Phase 5.2를 시작할 거야. 작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Outputs` 폴더의 가장 최근 VTL 문서들을 읽고 현재 우리의 아키텍처와 이번 세션의 목표를 파악해 줘. 완료되면 `feature-ai-routing` 이라는 브랜치를 새로 파고 알려줘!"**
