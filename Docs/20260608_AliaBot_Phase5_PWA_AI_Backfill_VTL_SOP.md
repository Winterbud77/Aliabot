# AliaBot Phase 5.x 신규 기능 및 문제 해결 기술로그 (VTL & SOP)

본 문서는 이전 버전의 VTL 및 SOP에 수록되지 않은, **PWA 수명 주기 갱신, 중복 레지스트리 복구, AI 백그라운드 백필(Auto-backfill), 리스트 번호 역순 보정 및 모바일 스크롤 개선**에 관한 핵심 원리 및 운영 매뉴얼을 다룹니다.

---

## 1. PWA 중복 레지스트리 충돌 및 강제 청소 프로토콜 (SOP)

### 1.1 핵심 현상 및 원인 (Terminology)
* **현상**: 사용자가 바탕화면의 PWA 바로가기 아이콘을 삭제하거나 캐시를 지웠음에도, 브라우저가 "App으로 다운받기"를 표시하지 않고 주소창에 **"App에서 열기"** 아이콘만 유지하는 현상.
* **원인 (OS App Registry Collision)**: PWA를 설치할 때 Chrome 엔진은 Windows OS의 레지스트리 및 앱 목록에 해당 도메인(`aliabot.vercel.app`)을 정식 앱으로 등록합니다. 단순 파일 제거로는 레지스트리가 삭제되지 않으며, 누적된 다수의 버전 정보가 브라우저에 남아있어 "이미 기기에 설치된 앱"으로 강제 간주되는 상태입니다.

### 1.2 복구 절차 (SOP)
1. **PWA 창에서 삭제**:
   * 크롬 주소창의 **"App에서 열기"** 아이콘 또는 로컬 PC에 설치된 독립된 AliaBot 앱을 실행합니다.
   * 앱 창 우측 상단의 **세 점 메뉴(⋮)**를 누릅니다.
   * **`AliaBot 제거... (Uninstall AliaBot...)`** 버튼을 클릭하고, **"Chrome에서도 데이터 삭제"**를 체크한 뒤 제거합니다.
2. **OS 앱 목록에서 일괄 정리**:
   * Windows **[설정] ➡️ [앱] ➡️ [설치된 앱]** 으로 진입합니다.
   * `AliaBot`을 검색하여 중복 설치된 모든 인스턴스를 하나씩 마우스 우클릭하여 **[제거]**합니다.
3. **클라이언트 초기화**:
   * 크롬 브라우저에서 `https://aliabot.vercel.app`에 새로 접속합니다.
   * 개발자 도구(F12) ➡️ **Application** ➡️ **Storage** 영역에서 해당 도메인에 대한 **[Clear site data]**를 눌러 잔여 오리진 정보를 소거합니다.
   * 브라우저를 강제 새로고침(`Ctrl + Shift + R`)하면 주소창 우측에 **"App으로 다운받기" / 설치 아이콘**이 정상 노출됩니다.

---

## 2. AI 요약/태깅 백그라운드 자동 백필 (Auto-backfill) 엔진 (VTL)

### 2.1 설계 목적 및 메커니즘
* **목적**: 빌드 과도기(비밀키 충돌 및 호스트 API 오동작 시기)에 작성되어 AI 요약(`summary`)과 태그(`tags`)가 비어 있는 과거 메모들(예: 54번~67번 누락 데이터)을 로그인 시 자동으로 감지하여 백그라운드에서 보완합니다.
* **작동 원리**:
  1. Firestore의 `onSnapshot` 이벤트가 발생할 때마다, 현재 로그인된 사용자의 메모 리스트 중 `tags`가 비어 있고 `summary`가 없으며 `aiProcessed !== true` 상태인 문서를 필터링합니다.
  2. 시스템 부하 및 API 속도 제한(Rate Limit)을 피하기 위해 최신 누락 문서부터 **최대 5개씩(`slice(0, 5)`)만** 잘라내어 백그라운드 비동기 루프로 전송합니다.
  3. `analyzeWithGemini` 프록시를 호출하여 태그와 요약을 가져옵니다.
  4. 응답 성공 시 Firestore 해당 문서에 `tags`, `summary`, `aiProcessed: true`를 업데이트합니다.
  5. API 에러나 분석 실패 시에도 무한 재요청을 방지하기 위해 `aiProcessed: true` 플래그를 심어 다음 검색 스캔 대상에서 제외합니다.

```javascript
// App.jsx 내 백필 로직 예시
const pendingAiDocs = todosData.filter(todo => 
    todo.text && 
    (!todo.tags || todo.tags.length === 0) && 
    !todo.summary && 
    todo.aiProcessed !== true
)
if (pendingAiDocs.length > 0) {
    pendingAiDocs.slice(0, 5).forEach(todo => {
        analyzeWithGemini(todo.text, null)
            .then(async (result) => {
                const todoRef = doc(db, `users/${currentUser.uid}/todos`, todo.id)
                await updateDoc(todoRef, {
                    tags: result?.tags || [],
                    summary: result?.summary || '',
                    aiProcessed: true
                })
            })
    })
}
```

---

## 3. PWA 즉각 갱신 수명 주기 제어 (skipWaiting & clients.claim) (VTL)

### 3.1 백그라운드 수명 주기 제어 지연 문제
* **현상**: 새로운 서비스 워커 `v5`가 빌드되어 배포되어도, 사용자가 현재 탭을 끄고 완전히 새로 접속하기 전까지 브라우저는 캐시를 갱신하지 않고 "대기(Waiting)" 모드로 신규 파일 반영을 무한 연기합니다.
* **해결책**:
  * `public/sw.js`의 `install` 리스너에 `self.skipWaiting()`을 이식하여 새 서비스 워커가 대기 없이 활성화되도록 강제합니다.
  * `activate` 리스너에 `self.clients.claim()`을 더해 활성화 즉시 열린 모든 탭의 네트워크 제어권을 즉각 획득하여 캐시 충돌을 원천 차단합니다.

---

## 4. 메모 리스트 번호 역순 연산 보정 (VTL)

### 4.1 역순 연산식 패치
* **원인**: 최신순 정렬 모드에서 일련번호(`seq`)가 아직 할당되지 않았거나 누락된 오래된 메모가 복구될 때, 기존의 단순 순서인 `index + 1`을 타게 되면 최신 메모가 1번이 되고 과거 메모가 뒷번호를 가리키는 정렬 모순이 발생했습니다.
* **해결 공식**:
  ```javascript
  {todo.seq ?? (todos.length - index)}
  ```
  - 고유 일련번호(`seq`)가 있으면 그것을 표시하고, 만약 누락된 구형 문서의 경우 전체 리스트 개수(`todos.length`)에서 현재 렌더링되고 있는 배열 인덱스(`index`)를 뺌으로써, **최신 입력일수록 항상 큰 고정 숫자를 부여받는 게시판형 리스트 구조**가 정상 유지되도록 수정하였습니다.

---

## 5. 모바일 뷰포트 높이 겹침(Overlap) 방지 레이아웃 (VTL)

### 5.1 Dynamic Viewport Height (dvh) 적용
* **배경**: 모바일 웹 브라우저(Safari, Chrome 모바일)에서는 주소창 및 네비게이션 툴바가 상하로 접히고 펴질 때마다 `100vh` 높이가 시시각각 틀어져 하단 입력 폼과 리스트가 겹치거나 가려지는 현상이 생깁니다.
* **해결책 (`index.css`)**:
  * `.app-container`의 높이를 `100dvh` (Dynamic Viewport Height)로 완전 격리하여 가변 브라우저 높이에 대응시켰습니다.
  * 상단 영역(`.app-fixed-top`)은 `flex-shrink: 0`으로 수축하지 않게 고정하고, 아래 리스트 영역(`.todo-scroll-region`)만 독립적인 스크롤(`overflow-y: auto`)을 갖게 하여, 모바일 및 데스크톱 환경 모두에서 상단 UI 요소가 흔들리지 않고 아래 스크롤만 부드럽게 작동하도록 반응형 구조를 확립했습니다.
