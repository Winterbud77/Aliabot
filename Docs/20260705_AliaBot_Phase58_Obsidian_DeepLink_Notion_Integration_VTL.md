---
created_at: 2026-07-05
agent_model: Gemini 1.5 Pro (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 5.8: Obsidian Deep Link & Notion Integration"
session_id: "bf344642-382f-4515-9b71-60b5ea124d9a"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 📘 Value Technology Log (VTL)
## Phase 5.8: 옵시디언 딥링크(Obsidian URI) 도입 및 노션(Notion) 우회 연동 설계로그

본 문서는 HTTPS 모바일 PWA 환경의 브라우저 보안 샌드박스(Sandbox) 정책 및 노션(Notion) API의 CORS 제약을 원천 극복한 무선 연동 아키텍처 설계 배경과 핵심 기술 지식을 보존합니다.

---

## 1. 🧠 설계 사고 과정 (Thinking Process) & 아키텍처 아키타이프

```mermaid
graph TD
    A[PWA Client (HTTPS Vercel)] -->|1. OS Protocol Handler| B[Obsidian Native App (Local)]
    A -->|2. Callable Cloud Functions (Relay)| C[Firebase Serverless Backend (SSL)]
    C -->|3. HTTPS Request Bypass CORS| D[Notion API Server]
    
    style A fill:#bfdbfe,stroke:#2563eb,stroke-width:2px
    style B fill:#bbf7d0,stroke:#16a34a,stroke-width:2px
    style C fill:#fef08a,stroke:#ca8a04,stroke-width:2px
    style D fill:#fed7aa,stroke:#ea580c,stroke-width:2px
```

### ① 옵시디언 연동: Mixed Content (혼합 콘텐츠) 차단 극복
* **배경 및 문제점**: 로컬 개발 서버(`http://localhost:5173`)에서는 Obsidian Local REST API 플러그인과 통신이 가능했으나, HTTPS 실배포 PWA 환경 및 모바일 환경에서는 보안 정책에 의해 HTTP 루프백 포트로의 브라우저 요청(Fetch)이 원천 차단됨.
* **해결 사유 (Thinking Process)**: 브라우저 샌드박스 내부에서 나가는 네트워크 요청은 브라우저 보안 규격을 절대 우회할 수 없음. 그러나 **OS Protocol Handler (운영체제 프로토콜 처리기)**를 경유하는 `obsidian://` 커스텀 스키마는 브라우저의 샌드박스 보안망 밖에서 동작하여 네이티브 앱을 다이렉트로 깨울 수 있음.
* **설계 선택**: 비개발자 및 모바일 PWA 사용자를 위해 디폴트로 `딥링크 모드 (Deep Link Mode)`를 제공하며, 기존 로컬 컴퓨터 단독 사용자용 `Local REST API 모드`도 공존하도록 토글식 설정을 지원함.

### ② 노션 연동: CORS (교차 출처 자원 공유) 우회 및 보안 강화
* **배경 및 문제점**: 노션 공식 API 서버(`api.notion.com`)는 브라우저 단에서 나가는 직접 HTTP POST 요청에 대해 CORS 응답 헤더를 돌려주지 않아 웹 앱에서 다이렉트 전송 시 브라우저가 전송을 중단시킴.
* **해결 사유 (Thinking Process)**: 브라우저가 아닌 백엔드 Node.js 환경에서는 CORS 제약을 받지 않음. 따라서 Firebase Cloud Functions에 노션 API 요청을 중계해 주는 **API Proxy Relay (API 프록시 중계)** 백엔드 엔드포인트(`sendToNotionViaFunctions`)를 추가 설계함.
* **보안 사유**: 사용자 개개인의 노션 API 토큰을 Firebase 환경 변수에 하드코딩하지 않고, 클라이언트 단 설정에 입력해 두었다가 함수 기동 시 페이로드로 중계하는 **BYOK (Bring Your Own Key)** 구조를 채택하여 완벽한 개인정보 격리를 실현함.

---

## 2. 🛠️ 트러블슈팅 이력 (Troubleshooting Log)

### ① 에러 메시지: `Notion API Token이 설정되지 않았습니다`
* **원인**: 설정창에 노션 정보가 공란일 때 비동기 로직이 가동되는 것을 미연에 방지한 자가 검증 결과.
* **대처**: 설정창을 열어 토큰과 ID 필드를 완벽히 채워 해결.

### ② 에러 메시지: `Could not find database with ID: ...`
* **원인**: 노션의 페이지 1:1 공유 정책에 의해 `AliaBot` 커넥션이 대상 데이터베이스 표 페이지에 권한 부여되지 않은 상태.
* **대처**: 페이지 우측 상단의 `점 3개` ➡️ `연결 추가` 메뉴를 통해 `AliaBot` 통합 봇을 추가하여 통신로 오픈 완료.

### ③ 에러 메시지: `Cannot convert argument to a ByteString because the character at index 8 has a value of 50900 ...`
* **원인**: HTTP 통신 헤더(Header) 영역은 오직 아스키(ASCII) 문자만 전송할 수 있습니다. PWA 실서버 설정창 입력 도중 한글 자판 상태에서 오타가 들어가면서 9번째 글자 자리에 한글 **`울`**(유니코드 값: 50900)이 삽입되어 브라우저 인코딩 예외가 발생했습니다.
* **대처**: 설정창의 Notion 토큰 및 ID 필드를 완전히 청소한 후 순수 알파벳과 숫자 조합으로 재기입하여 전송 성공.

### ④ PWA 실서버(Vercel) 접속 시 최초 노션/캘린더 연동 실패 현상
* **원인**: 브라우저의 **동일 출처 정책(Same-Origin Policy)**에 의해 `localhost`와 `aliabot.vercel.app`은 물리적으로 완전히 격리된 저장소(localStorage)를 지닙니다. 이로 인해 로컬에서 입력한 설정과 세션이 실서버로 자동 동기화되지 않는 보안 명세 때문입니다.
* **대처**: 실서버 도메인으로 접속한 PWA 화면에서 ⚙️ 설정 창을 열어 노션 정보를 직접 최초 1회 재기입하고, 구글 로그인을 신규 터치하여 인증 세션을 바인딩 완료.

### ⑤ [UI/UX 개선] Localhost와 Live PWA 뷰 식별 장치 추가
* **원인**: 로컬호스트와 실서버 배포판의 UI 스킨이 동일하여 개발 및 실기 검증 시 오작동 구분이 힘든 환경적 불편 요소가 있었습니다.
* **대처**:
  1. **탭 타이틀 영구 고정**: React 생명주기 초기화 시 `localhost` 접속을 감지하여 브라우저 타이틀바를 `AliaBot - My AI Secretary [Localhost:5173]`으로 탭 명칭을 고정 변경.
  2. **헤더 뱃지 렌더링**: `App.jsx` 헤더의 로고(`AliaBot v2.1`) 바로 옆에 주황색으로 강조된 **`Localhost:5173`** 뱃지를 상시 표기하여 시각적 구별성을 확보.
