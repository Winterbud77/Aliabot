# 🧠 AliaBot Agent Memory (에이전트 두뇌 상속 마스터)

> **이 문서의 역할**: 본 프로젝트(AliaBot)를 유지보수하기 위해 접속하는 모든 인공지능 에이전트(Claude, Gemini 등)가 **가장 먼저 학습하여 뇌세포에 적재해야 하는 핵심 프로젝트 아키텍처 및 철학적 원칙 지침서**입니다.

---

## 1. 🎯 프로젝트 설계 철학 및 가치관 (필수 준수)

본 프로젝트의 소유자(USER)는 **비개발자이지만 뛰어난 논리적 시스템 이해도를 가진 도메인 아키텍트**입니다. 에이전트는 아래 지침을 1초의 타협도 없이 절대적으로 준수해야 합니다.

1. **개념과 원리 우선 설명 (Terminology & Mechanism First)**:
   - 어떠한 코딩 버그나 질문에 답할 때, 즉흥적인 코드 패치나 퀵픽스(Quick-fix)부터 들이밀지 마십시오.
   - 반드시 **1) 관련된 핵심 개념과 작동 원리를 명확히 한글로 먼저 논리적으로 설명**하고, **2) 그 이후에 구체적인 소스 코드나 해결 명령을 순서대로 제시**하십시오.
2. **모든 답변 한글(Korean) 원칙**:
   - 모든 기술 답변과 안내는 유려한 한글로 진행하십시오.
   - 단, 주요 컴퓨터 키워드나 명사 용어는 영어 원문을 병기하되, 생소할 수 있는 전문 용어는 괄호 안에 한글 뜻을 함께 적어 비개발자 아키텍트가 완전히 소화할 수 있도록 배려하십시오.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

## 2. 🏗️ 기술 스택 및 데이터베이스 구조 (Technical Stack)

### ① 프론트엔드 (Frontend)
- **React 18 + Vite**: 로컬 기본 구동 포트는 `5173` 입니다.
- **PWA (Progressive Web App)**: Service Worker(`sw.js`)를 통해 오프라인 지원을 수행하며, 수명 주기 갱신 시 `skipWaiting` 및 `clients.claim`을 이용해 즉각 캐시를 강제 통제합니다.
- **CSS**: TailwindCSS를 배제한 순수 **Vanilla CSS**로 반응형 UI 및 HSL 기반의 다크 모드/비주얼 강점을 구축합니다.

### ② 백엔드 (Backend - Firebase)
- **Firestore Database**:
  - **할 일 목록(Todos)**: `users/${uid}/todos/${todoId}` 경로에 저장됩니다. 주요 문서 필드: `text` (원문), `seq` (역순 일련번호), `tags` (배열 요약), `summary` (문자열 요약), `aiProcessed` (AI 스캔 여부 플래그), `destinations` (내보낸 목적지들).
  - **챗 대화 기록(Chat Messages)**: `users/${uid}/chatMessages/${msgId}` 경로에 저장되며, PWA 모바일 새로고침 시에도 대화가 휘발되지 않도록 영속 보존합니다. 주요 필드: `text` (메시지 본문), `sender` (`user` | `assistant` | `system`), `createdAt` (서버 타임스탬프).
- **Cloud Functions (Gen 2 - asia-northeast3 서울 리전)**:
  - `analyzeMemoWithGemini`: 호스트가 등록한 호스트 전용 API Key로 Gemini API를 프록시 대리 호출하는 Callable 함수.
  - `chatWithGeminiCloud`: 호스트 Gemini 키로 다중 프로젝트 맥락 대화를 처리하여 브라우저 CORS 제약을 회회하고 API 키 보안을 유지하는 대리 호출 Callable 함수.
  - `sendEmailViaFunctions`: Firebase Secret Manager에 등록된 `EMAIL_API_KEY` 환경변수를 로드하여 Resend/SendGrid REST API 기반으로 클라이언트의 대리 이메일 발송 요청을 처리하는 Callable 함수.

### ③ 외부 채널 연동 및 프로젝트 브릿지 (OAuth & Integration Bridge)
- **GitHub Project Chat Bridge (다중 프로젝트 연결)**:
  - **작동 원리**: 설정창에 등록된 GitHub Repository 주소(`owner/repo`)와 PAT(Personal Access Token) 정보를 이용해 깃허브 REST API로 대상 리포지토리의 `CLAUDE.md`, `README.md` 문서를 Fetch합니다.
  - **맥락 주입 (Context Injection)**: 긁어온 마크다운 원문을 AI 시스템 프롬프트(System Prompt) 하단에 `[프로젝트 컨텍스트]`로 주입하고 사용자의 질문 및 이전 대화 history를 조립하여 Gemini API에 전송함으로써, 타 프로젝트와 AliaBot 간의 실시간 브릿지 대화를 실현합니다.
- **Google Calendar API**:
  - `firebase.js`에 `googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')`를 명시하여 로그인 시 캘린더 읽기/쓰기 권한(Scope)을 획득합니다.
  - 로그인 성공 시 획득한 구글 캘린더 `accessToken`은 브라우저 로컬 스토리지 및 `googleAccessToken` 상태 변수에 유지됩니다.
  - 메모를 내보낼 때 `insertCalendarEvent(accessToken, eventDetails)`를 통해 구글 캘린더 REST API로 연동합니다.
- **Natural Language Event Parsing (자연어 일정 파싱)**:
  - 메모가 추가되면 Gemini API가 실시간 또는 백필로 자연어를 분석하여 날짜/시간 정보를 ISO 8601 포맷으로 절대 환산하여 Firestore `metadata.parsedEvent` 필드에 캐싱해 둡니다. 이 과정에서 현재 서울 표준시(Reference Time)를 주입받아 상대 날짜 표현을 정밀 변환합니다.
  - 이를 위해 Firebase 프로젝트가 **Blaze (종량제 요금제)** 상태여야 외부 아웃바운드 트래픽 차단이 풀립니다.

---

## 3. 🚨 Gemini API 연동 핵심 규칙

1. **Host-managed API Proxy (호스트 대리 호출) 기본 원칙**:
   - **아키텍처 정의**: 지인 테스트 기간 동안 일반 사용자들은 자신의 API 키를 직접 입력하는 **BYOK (브라우저 직접 호출) 방식을 사용하지 않는 것**을 기본 설계 정책으로 삼습니다.
   - **작동 방식**: 사용자의 클라이언트 설정 창 내 `Gemini API Key` 입력 칸은 항상 **비워두는 상태(Empty)**로 가동됩니다. 이 경우 클라이언트는 Firebase Cloud Functions의 프록시 대리 호출 함수(`analyzeMemoWithGemini`)를 트리거하며, 서버는 Firebase Secret Manager에 저장된 호스트(개발자)의 대표 Gemini API Key를 로드하여 동작합니다.
   - **Blaze 요금제 필수성**: Firebase 프로젝트가 **Blaze (종량제 요금제)** 상태이므로 구글 외부의 Gemini API 게이트웨이로 나가는 트래픽이 차단되지 않아 지인들도 호스트의 API 키로 요약 서비스를 정상 공유받을 수 있습니다.
2. **서버리스 API Key 보안**:
   - Cloud Functions 서버가 대리 통신할 때 구글 API 게이트웨이의 401 차단을 막으려면, 구글 AI Studio의 `+ 프로젝트 만들기`를 통해 **보안 제한이 걸려있지 않은 완전히 독립된 임시 프로젝트 하에서 `AQ.Ab8R...` 키를 발급받아 등록**해야 합니다.
3. **서버 캐시 지연 해결**:
   - `firebase functions:secrets:set GEMINI_API_KEY`를 통해 키를 교체한 후에는, 반드시 `functions/index.js`에 의미 없는 주석 등의 소스 변경을 주어 강제로 `firebase deploy --only functions` 함으로써 인스턴스를 콜드 부팅(Cold Start)해야 정상 반영됩니다.
4. **클라이언트 Auto-Backfill 연동 주의**:
   - 프론트엔드(`App.jsx`)에서 백필이 작동할 때, 사용자가 개별 키(`apiKeys.gemini`)를 기입하지 않은 비어 있는 환경에서도 백엔드 서버 함수로 원활하게 Proxy 요청을 전달하여 대리 처리가 문제없이 수행되도록 보장되어야 합니다.
5. **대시보드 스프레드시트 뷰 및 CSV 파일 내보내기 (Phase 5.5)**:
   - 모바일 비서 레이아웃 외에 PC 대형 화면을 지원하기 위한 테이블 격자(Grid) 형태의 표 보기 전환 토글 스위치 및 Firestore 내 전체 누적 메모를 `.csv` 파일로 변환하여 다운로드받는 브라우저 로컬 내보내기 기능을 향후 탑재합니다.

---

## 4. 📄 세션 종결 시 다큐멘테이션 규칙 및 바이브코딩 백과사전(VSOP & VTL Collection) 비전

1. **SOP/VTL 문서 자동 보완 규칙**: 
   - 매 주제나 트러블슈팅이 완전히 종결되었을 때, 에이전트는 즉각 **개선사항과 원리를 반영한 VTL(Visual Tech Log)과 SOP/VSOP 문서를 Docs/ 또는 Outputs/ 폴더 하위에 날짜 패턴(`YYYYMMDD_...`)으로 자동 생성하거나 기존 문서를 완전 보완**해야 합니다.
2. **바이브코딩 가이드북(Vibe-Coding Manual) 통합 자산화 비전**:
   - 본 프로젝트의 최종 마일스톤 중 하나는 **"비개발자 초보자 누구나 인공지능 에이전트와 대화하며 안전하게 소프트웨어를 조율 및 개발할 수 있는 바이브코딩 가이드북(AliaBot's VSOP & VTL Collection)"**의 구축입니다.
   - 따라서 에이전트는 개발 도중 만나는 사소한 기술적 문제(예: Open VSX 마켓플레이스의 패키지 부재, Markdown Preview Enhanced의 Mermaid 렌더링 팁, 파일 인코딩 에러 우회 삭제 프로세스 등)라도 무시하지 말고 텍스트와 도식(Mermaid)을 결합하여 VSOP/VTL 형태의 소중한 자산으로 꼼꼼히 기록하고 보존해야 합니다.

---

## 5. 🛠️ Antigravity 세션 관리 및 유실 복원 규칙 (Antigravity Session Management)

미래의 에이전트는 세션 유실 복구 및 대화방 명칭 꼬임 방지를 위해 아래 표준 프로토콜을 반드시 숙지하고 이행해야 합니다.

1. **Physical Termination (물리적 강제 종료)을 통한 캐시 정화**:
   - 로컬 세션 바이너리 파일(`.pb`)과 `brain` 폴더를 덮어쓰고 잠금(`attrib +r`)을 처리한 경우, 단순히 에디터의 `Reload Window`를 돌리는 것만으로는 백그라운드 **Language Server Process (언어 서버 프로세스)** 메모리에 구형 캐시가 고착되는 현상을 막을 수 없습니다.
   - 반드시 **VS Code 창 자체를 완전히 종료(Exit)하고 5초간 대기한 뒤 재부팅**해야만 **Memory Cache Flush (메모리 캐시 플러시)**가 일어나 디스크의 잠겨 있는 복원 데이터를 온전히 강제 로드해 옵니다.
2. **Rename (이름 바꾸기) UI 옵션 활용**:
   - 첫 질문 프롬프트에 `[System Instruction: ...]` 지시문을 사용하여 정규식 요약을 억지로 회피하려 하지 마십시오.
   - 에디터 UI 좌측의 **`Open Agent Manager (에이전트 관리자 열기)`**를 실행하고, 대상 세션 항목 우측 끝의 **점 세 개(...) 아이콘** 메뉴 내 **`Rename`**을 선택하여 정식 대화명을 수동으로 지정하십시오.
3. **Ghost Cache (유령 캐시) 소거**:
   - 복구 과정에서 중복 생성된 임시 세션 껍데기들은 디스크 상에서 지운 뒤, 과거 대화 목록 팝업 드롭다운 창 내에서 해당 세션 항목 위로 마우스 커서를 가져가 우측에 노출되는 **[휴지통 모양 아이콘 (🗑️)]**을 클릭하여 수동 UI 삭제 처리하는 것이 데이터베이스 락 충돌 없이 가장 안전합니다.

