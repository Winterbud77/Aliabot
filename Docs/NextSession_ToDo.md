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
- **구현 상태(이번 세션 완료):** Export 모달을 `목적지(복수 체크)` 기반으로 전환 (Obsidian/Notion/Clipboard)
  - 태그 기반 추천(`src/utils/routingRules.js`)으로 체크 상태가 초기화됩니다.
  - Notion은 `Notion API Token + Database ID + Title/Content Property Name`을 Settings에서 입력해야 동작합니다.
  - Obsidian은 로컬 PC에서 Obsidian이 켜져 있고 `Local REST API` 커뮤니티 플러그인이 실행 중일 때 클라이언트 다이렉트 HTTPS 통신으로 삽입됩니다.

### 🗓️ Phase 5.4: 일정(Calendar) 및 이메일(Mail) 채널 확장
- **Google Calendar 연결 (난이도: 보통):**
  - 로그인 시 구글 캘린더 쓰기 권한(`https://www.googleapis.com/auth/calendar.events`) Scope를 요청하여 액세스 토큰 획득.
  - "!일정" 카테고리의 텍스트를 AI가 분석(시간, 날짜, 장소 파싱)하여 구글 캘린더에 자동으로 이벤트를 삽입하는 프론트엔드 연동 구현.
- **이메일(Mail) 발송 기능 (난이도: 낮음 - Blaze 요금제 활용):**
  - 현재 Firebase가 **Blaze(종량제)** 요금제이므로 외부 메일 API(Resend, SendGrid 등) 호출에 제약이 없습니다.
  - 중요한 SOP 노트나 일일 요약 브리핑을 이메일로 즉시 발송(내보내기 목적지 목록에 '이메일' 추가)하여 지인 혹은 본인에게 메일로 자동 전송하는 API 기능을 통합합니다.

### 📊 Phase 5.5: 대시보드 스프레드시트 뷰 및 CSV 파일 내보내기 (추가 예정 사항)
- **엑셀 표 보기 전환 스위치 (Toggle View):**
  - 기존의 모바일용 세로 카드 리스트 형식 외에, 전체 메모 데이터를 엑셀처럼 격자 형태로 넓게 모아 볼 수 있는 표 보기(Table View) 모드 전환 스위치를 상단에 추가합니다.
- **CSV 데이터 다운로드 (Export to CSV):**
  - 가벼운 순수 자바스크립트 CSV 변환 엔진을 프론트엔드에 구현하여, `📥 Excel 다운로드` 버튼 클릭 시 Firestore 내 전체 누적 메모를 즉각 `.csv` 엑셀 파일로 로컬 기기에 저장할 수 있게 합니다. (노션을 쓰지 않는 타 사용자들에게 아주 가볍고 강력한 오프라인 데이터 백업 수단이 됩니다.)

### 🤖 Phase 6.1: Gemini 문서 분석 (NotebookLM 대체)
- **NotebookLM 연동 전략:**
  - NotebookLM은 외부 오픈 API가 제공되지 않으므로, AliaBot에서 내보내진 Notion이나 Google Drive 폴더를 NotebookLM의 Source로 물리는 간접 연계 전략을 사용합니다.
  - 혹은 AliaBot 자체 내부에 Gemini API를 사용하여, 사용자가 업로드한 긴 텍스트 파일/PDF를 심층 분석하여 요약본 노트를 추출해 주는 자체 내장 "Gemini AI 분석기"를 구현할 수 있습니다.

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

현재 `Docs` 및 `Outputs` 폴더에 지난 대화들의 모든 핵심 지식과 해결 과정이 완벽히 백업되어 있습니다. 새 세션의 AI(Claude 또는 Gemini)에게 **이 문서들과 함께 아래 파일들을 읽어보라고 지시하시면 맥락이 100% 복원**됩니다.

- `Docs/20260608_AliaBot_Phase5_PWA_AI_Backfill_VTL_SOP.md`: PWA 설치 트러블슈팅, 서비스워커 갱신, AI 백필 및 뷰포트 개선 기술로그 (최신)
- `20260428_React_Todo_PWA_SOP_Gemini_Antigravity.md`: PWA 설치 이슈 및 다중 모델 협업 표준 절차 (기초)
- `20260510_AliaBot_Phase4_Deployment_VTL.md`: Vercel GitOps 자동 배포 및 Firestore Security Rules 구축 기록
- `20260512_AliaBot_MultiAgent_Strategy_VTL.md`: Antigravity 내 세션 분리 및 모델 교체 시 맥락 유지/파일 공유 아키텍처

---

## 3. 🏁 새로운 세션 시작 가이드

사용자님, 새로운 탭에서 대화창(Conversation Session)을 만드신 후 첫 마디로 아래 문장을 복사해서 붙여넣어 주세요!

> **"안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트 개발을 진행 중이야. 작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Docs/20260608_AliaBot_Phase5_PWA_AI_Backfill_VTL_SOP.md` 기술 로그를 꼼꼼히 읽고 현재 우리의 아키텍처와 다음 단계인 [Google Calendar 연동, Email 발송 API 통합] 목표를 파악해 줘. 파악이 완료되면 준비되었다고 답변하고, 개발 계획을 수립해 줘!"**
