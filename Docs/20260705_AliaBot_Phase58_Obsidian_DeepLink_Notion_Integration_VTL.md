# 📘 Value Technology Log (VTL) & Standard Operating Procedure (VSOP)
## Phase 5.8: 옵시디언 딥링크(Obsidian URI) 도입 및 노션(Notion) 우회 연동 완결

> **문서 정보**
> * **작성일**: 2026년 7월 5일
> * **목적**: HTTPS 모바일 PWA 환경의 샌드박스 차단 정책을 극복하고, 노션(Notion) API의 CORS 제약을 극복한 설계 사고 과정과 상세한 사용자 연동 표준 운영 매뉴얼(SOP)을 보존함.

---

## 1. 🧠 설계 사고 과정 (Thinking Process) & 아키텍처 아키타이프

```mermaid
graph TD
    A[PWA Client (HTTPS)] -->|1. OS Protocol Handler| B[Obsidian Native App]
    A -->|2. Callable Cloud Functions| C[Firebase Serverless Backend]
    C -->|3. HTTPS Request Bypass CORS| D[Notion API Server]
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

## 2. 📝 Notion 연동 표준 운영 절차서 (VSOP)

사용자님이 실제 연동 시 직면하셨던 스크린샷과 디버깅 교훈을 엮은 가장 확실한 연동 절차서입니다.

### [1단계] Notion API 연결(Connection) 생성 및 액세스 토큰 획득
1. 웹 브라우저에서 [Notion Developers Connections 포털](https://app.notion.com/developers/connections)로 접속합니다.
2. 파란색 **`+ 신규 연결`** 버튼을 클릭합니다.
3. 연결 이름란에 **`AliaBot`** 이라고 적고 저장을 완료합니다.
4. 화면에 생성된 **`내부 통합 토큰` (또는 비공개 액세스 토큰)**을 복사합니다.
   > [!IMPORTANT]
   > 토큰을 입력할 때는 맨 앞의 접두어인 **`ntn_`을 포함한 전체 문자열**을 그대로 복사하여 입력해야 합니다. 접두어가 빠지면 노션 보안 시스템이 인증 거부(401 Unauthorized)를 반환합니다.

---

### [2단계] 메모를 보관할 표(Database) 생성 및 열 이름 설정
1. 본인의 노션 워크스페이스에 빈 페이지를 생성하고, 본문 입력창에서 **`/table`** 혹은 **`/표`**를 타이핑합니다.
2. 팝업 메뉴에서 단순 표 레이아웃 대신 **`표 보기 · 데이터베이스`** 항목을 클릭합니다.
3. 우측에 생성된 옅은 파란색의 **`새로 만들기`** 버튼을 클릭하여 완전한 표를 화면에 인스턴스화합니다.
   > [!CAUTION]
   > 일반 텍스트 문서 상단의 속성 추가 기능(`+ Add a property`)을 사용하면 안 되며, 반드시 본문 격자 형태의 **'표 보기 데이터베이스'**를 삽입하셔야 합니다.
4. 기본으로 생성되는 첫 번째 열인 **`Aa 이름`**을 클릭하고 이름을 **`Title`**로 변경합니다. (유형: 제목)
5. `Title` 열 헤더의 바로 오른쪽 옆에 있는 **`+` (플러스)** 아이콘을 클릭하여 새 열을 생성하고, 유형을 **`텍스트` (Text)** 로 설정한 뒤 이름을 **`Content`** 라고 수정합니다. (프로그램 상의 키값 매핑 목적)

---

### [3단계] 데이터베이스 ID 추출 및 권한 1:1 부여
1. 완성된 표의 링크를 복사하여 데이터베이스 ID(32자리 UUID)를 추출합니다:
   * 복사한 링크 예시: `https://www.notion.so/myworkspace/`**`394bed8a5dfd80e38e74d1c8295d156c`**`?v=...`
   * 중간에 들어간 32자리 문자열 `394bed8a5dfd80e38e74d1c8295d156c`가 **`Database ID`** 입니다.
2. **보안 권한 부여 (Connection Sharing)**:
   * 대상 페이지의 우측 최상단 **`공유`** ➡️ `연결 추가` 또는 **`점 3개 (···)`** ➡️ **`연결 추가`** 메뉴를 클릭합니다.
   * 검색창에 **`AliaBot`**을 타이핑하고, 자동 완성된 봇 계정을 클릭한 후 "이 페이지에 AliaBot 추가" 알림 창에서 **`확인`**을 누릅니다.
   > [!NOTE]
   > 이 과정을 누락하면 노션 API 전송 시 `Could not find database with ID...` 오류가 발생합니다. 링크가 있는 웹의 모든 사용자에게 전체 공개하지 않고 1:1 연결 추가를 통해서만 안전하게 통신 문을 개방해야 합니다.

---

### [4단계] AliaBot 설정 저장 및 전송 검증
1. AliaBot 대시보드의 우측 상단 **⚙️ 설정** 창을 클릭합니다.
2. 아래 정보를 각각 기입합니다:
   * **Notion API Token**: `ntn_`을 포함한 전체 API 토큰 기입
   * **Notion Database ID**: 추출한 32자리 문자열 기입
   * **Notion Title Property**: `Title`
   * **Notion Content Property**: `Content`
   * **Obsidian Vault Name**: `Winterbud-03MS` (사용자님의 옵시디언 보관소 이름)
3. 하단의 **`저장 및 닫기`** 버튼을 누릅니다.
4. 메모장에 `!노션 !옵시디언 새로운 PWA 프록시 연동 테스트`를 입력해 카드를 생성한 뒤, 내보내기(📤) 버튼을 눌러 두 채널을 선택하고 전송합니다.
5. 화면에 파란색 성공 마크와 함께 **`전송 완료: CLIPBOARD, NOTION`** 팝업 메시지가 노출되는지 확인합니다.

---

## 3. 🛠️ 트러블슈팅 이력 (Troubleshooting Log)

### ① 에러 메시지: `Notion API Token이 설정되지 않았습니다`
* **원인**: 설정창에 노션 정보가 공란일 때 비동기 로직이 가동되는 것을 미연에 방지한 자가 검증 결과.
* **대처**: 설정창을 열어 토큰과 ID 필드를 완벽히 채워 해결.

### ② 에러 메시지: `Could not find database with ID: ...`
* **원인**: 노션의 페이지 1:1 공유 정책에 의해 `AliaBot` 커넥션이 대상 데이터베이스 표 페이지에 권한 부여되지 않은 상태.
* **대처**: 페이지 우측 상단의 `점 3개` ➡️ `연결 추가` 메뉴를 통해 `AliaBot` 통합 봇을 추가하여 통신로 오픈 완료.

---
session_name: "AliaBot Phase 5.8: Obsidian Deep Link & Notion Integration"
session_id: "bf344642-382f-4515-9b71-60b5ea124d9a"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\Projects\Work01_Anti\Docs"
---
