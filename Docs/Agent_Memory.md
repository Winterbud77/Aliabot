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

---

## 2. 🏗️ 기술 스택 및 데이터베이스 구조 (Technical Stack)

### ① 프론트엔드 (Frontend)
- **React 18 + Vite**: 로컬 기본 구동 포트는 `5173` 입니다.
- **PWA (Progressive Web App)**: Service Worker(`sw.js`)를 통해 오프라인 지원을 수행하며, 수명 주기 갱신 시 `skipWaiting` 및 `clients.claim`을 이용해 즉각 캐시를 강제 통제합니다.
- **CSS**: TailwindCSS를 배제한 순수 **Vanilla CSS**로 반응형 UI 및 HSL 기반의 다크 모드/비주얼 강점을 구축합니다.

### ② 백엔드 (Backend - Firebase)
- **Firestore Database**:
  - `users/${uid}/todos/${todoId}` 경로에 메모 카드가 저장됩니다.
  - 주요 문서 필드: `text` (원문), `seq` (역순 일련번호), `tags` (배열), `summary` (문자열 요약), `aiProcessed` (AI 스캔 완료 여부 플래그).
- **Cloud Functions (Gen 2 - asia-northeast3 서울 리전)**:
  - `analyzeMemoWithGemini`: 호스트가 등록한 호스트 전용 API Key로 Gemini API를 프록시 대리 호출하는 Callable 함수.
  - `sendEmailViaFunctions`: Firebase Secret Manager에 등록된 `EMAIL_API_KEY` 환경변수를 로드하여 Resend/SendGrid REST API 기반으로 클라이언트의 대리 이메일 발송 요청을 처리하는 Callable 함수.

### ③ 외부 채널 연동 (OAuth & Dispatch Channels)
- **Google Calendar API**:
  - `firebase.js`에 `googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')`를 명시하여 로그인 시 캘린더 읽기/쓰기 권한(Scope)을 획득합니다.
  - 로그인 성공 시 획득한 구글 캘린더 `accessToken`은 브라우저 로컬 스토리지 및 `googleAccessToken` 상태 변수에 유지됩니다.
  - 메모를 내보낼 때 `insertCalendarEvent(accessToken, eventDetails)`를 통해 구글 캘린더 REST API로 연동합니다.
- **Serverless Email (Firebase Cloud Functions)**:
  - `functions/index.js`에 `sendEmailViaFunctions` Callable function을 정의하여 외부 API(Resend, SendGrid)를 통해 이메일을 발송합니다.
  - 이를 위해 Firebase 프로젝트가 **Blaze (종량제 요금제)** 상태여야 외부 아웃바운드 트래픽 차단이 풀립니다.
- **Natural Language Event Parsing (자연어 일정 파싱)**:
  - 메모가 추가되면 Gemini API가 실시간 또는 백필로 자연어를 분석하여 날짜/시간 정보를 ISO 8601 포맷으로 절대 환산하여 Firestore `metadata.parsedEvent` 필드에 캐싱해 둡니다. 이 과정에서 현재 서울 표준시(Reference Time)를 주입받아 상대 날짜 표현을 정밀 변환합니다.

---

## 3. 🚨 Gemini API 연동 핵심 규칙

1. **서버리스 API Key 사용**:
   - Cloud Functions 서버가 대리 통신할 때 구글 API 게이트웨이의 401 차단을 막으려면, 구글 AI Studio의 `+ 프로젝트 만들기`를 통해 **보안 제한이 걸려있지 않은 완전히 독립된 임시 프로젝트 하에서 `AQ.Ab8R...` 키를 발급받아 등록**해야 합니다.
2. **서버 캐시 지연 해결**:
   - `firebase functions:secrets:set GEMINI_API_KEY`를 통해 키를 교체한 후에는, 반드시 `functions/index.js`에 의미 없는 주석 등의 소스 변경을 주어 강제로 `firebase deploy --only functions` 함으로써 인스턴스를 콜드 부팅(Cold Start)해야 정상 반영됩니다.
3. **클라이언트 Auto-Backfill 연동**:
   - 프론트엔드(`App.jsx`)에서 태그가 없는 메모를 스캔하여 백필할 때도, 로컬에 저장된 사용자 키(`apiKeys.gemini`)가 있으면 서버 프록시 호출보다 우선하여 파라미터로 넘겨주도록 코딩해야 합니다.

---

## 4. 📄 세션 종결 시 다큐멘테이션 규칙
- 매 주제나 트러블슈팅이 완전히 종결되었을 때, 에이전트는 즉각 **개선사항과 원리를 반영한 VTL(Visual Tech Log)과 SOP/VSOP 문서를 Outputs/ 폴더 하위에 날짜 패턴(`YYYYMMDD_...`)으로 자동 생성하거나 기존 문서를 완전 보완**해야 합니다.
