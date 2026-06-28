# Visual Tech Log (VTL) & SOP: React Todo List V2

본 문서는 React Todo List 애플리케이션에 하이브리드 디스패치(Hybrid Dispatch) 기능을 추가하는 과정에서 발생한 핵심 설정 및 UI 변경 사항을 기록한 **Visual Tech Log (VTL)** 겸 **VSOP**입니다. 추후 동일한 설정이나 유지보수를 진행할 때 직관적인 참고 자료로 활용됩니다.

---

## 1. Firebase 연동 및 인증 설정 (Phase 1)

Firestore 데이터베이스와 Google Authentication을 연결하는 과정에서 발생한 주요 화면 캡처와 문제 해결 과정입니다.

### 1.1 데이터베이스 생성 및 지역 설정
Firebase 콘솔에서 Firestore를 설정할 때, 지역(Region) 선택 화면입니다.
기본값인 `nam5 (United States)`를 사용할 수 있으며, 한국 사용자의 경우 응답 속도 최적화를 위해 `asia-northeast3 (Seoul)`을 선택하는 것이 좋습니다.

![Firestore 데이터베이스 생성](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778118887302.jpg)

### 1.2 테스트 모드 설정 (매우 중요)
초기 개발 단계에서는 React 앱에서 자유롭게 데이터를 읽고 쓸 수 있도록 보안 규칙을 **"테스트 모드에서 시작"**으로 설정해야 합니다. 프로덕션 모드 선택 시 권한 에러(Permission Denied)가 발생합니다.

![테스트 모드 설정](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778120041339.jpg)

### 1.3 Google Authentication 활성화
로그인 시스템을 위해 **Authentication > Sign-in method** 탭에서 **Google** 제공업체를 사용 설정해야 합니다.

![Google 로그인 설정](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778120139572.jpg)

### 1.4 로그인 성공 확인
구글 계정 인증 창을 거쳐 성공적으로 로그인된 화면입니다. 이때 기존 로컬 스토리지(localStorage)에 있던 데이터가 Firestore로 자동 마이그레이션(동기화)됩니다. 앱 우측 상단이 `Login`에서 `Logout` 버튼으로 변경된 것을 확인할 수 있습니다.

![로그인 인증 창](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778121066873.jpg)
![로그인 완료된 UI](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778121066898.jpg)

> [!TIP]
> **트러블슈팅 기록: 팝업 차단 및 잘못된 도메인 오류**
> 로컬 환경(`localhost:5173`)에서 로그인 버튼 클릭 시 팝업이 뜨지 않거나 "The requested action is invalid."라는 에러가 발생했습니다.
> 1. `src/firebase.js` 파일 내 `authDomain` 속성의 오타(`re-act-todo...`)로 인해 잘못된 주소로 연결된 것이 원인이었습니다.
> 2. 오타 수정 후, 브라우저가 이전 코드를 기억(캐싱)하고 있는 것을 해결하기 위해 **강력 새로고침(Ctrl + Shift + R)**을 수행하여 해결했습니다.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

## 2. 하이브리드 디스패치 파서 및 UI (Phase 2)

단순 할 일(Todo)을 넘어서, 외부 시스템(Calendar, Obsidian)으로 내보내기 위한 사용자 인터페이스와 자동 분류 파서 로직을 구현했습니다.

### 2.1 자연어 파서(Command Parser) 적용
사용자 입력 텍스트를 분석하여 카테고리를 자동 할당하는 `src/utils/parser.js`를 구현했습니다.
* `!메모`, `!obsidian` 키워드 포함 -> `obsidian` 카테고리 할당 (보라색 뱃지)
* `오늘`, `내일`, `시간(00:00)`, `미팅` 키워드 포함 -> `calendar` 카테고리 할당 (파란색 뱃지)
* 기본값 -> `todo`

### 2.2 Export 모달 UI 추가
각 투두 항목에 **[내보내기(Export)] 버튼**을 추가했습니다.
버튼 클릭 시 화면 중앙에 모달창이 나타나며, 외부 시스템으로의 전송 방식을 선택할 수 있습니다.
* **복사(Copy)**: 현재 리스트에 항목을 남겨두고 외부로만 전송
* **이동(Move)**: 외부로 전송한 뒤, 현재 리스트에서는 항목을 삭제

> [!NOTE]
> 모달 창과 파서 코드는 모두 적용이 완료되었습니다. 실제 외부 API 연결(Phase 3)은 아래에서 이어집니다.

---

## 3. 외부 시스템 연동: Obsidian (Phase 3)

작성한 할 일(또는 메모)을 Obsidian의 Local REST API를 통해 로컬 파일 시스템으로 직접 쏘아 보내는(Dispatch) 기능을 구현했습니다.

### 3.1 Obsidian 플러그인 연동 에러 및 해결 과정 (Troubleshooting X-Ray)

초기 연동 시 브라우저에서 아래와 같이 `Failed to fetch` 에러가 발생하는 문제가 있었습니다. 이 과정을 상세히 기록하여 향후 사용자 매뉴얼이나 디버깅 가이드로 활용합니다.

#### 🚨 1단계: 에러 발생 (`Failed to fetch`)
투두 리스트에서 [옵시디언으로 보내기]를 클릭했을 때, 연결을 거부당하는 에러가 발생했습니다.
![Failed to fetch 에러](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778129399106.jpg)

#### 🔍 2단계: 원인 파악 (옵시디언 설정 확인)
웹 브라우저가 로컬 포트(`27123`, `27124`)에 접근하지 못하는 가장 큰 이유는 옵시디언 플러그인의 통신 프로토콜(HTTP vs HTTPS) 불일치입니다.
사용자의 옵시디언 Local REST API 설정 창을 확인한 결과, **`Enable Encrypted (HTTPS) Server`** 스위치가 켜져(On) 있었습니다. 로컬 개발 환경에서는 암호화 인증서가 없어 브라우저가 통신을 차단하므로, 이 스위치를 끄거나(Off) 예외 처리를 해야 합니다.
![옵시디언 Local REST API 설정창](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778129904700.jpg)

#### 🛠️ 3단계: 내부망(X-Ray) 진단과 근본 원인
설정을 바꾼 후에도 포트가 열리지 않았습니다. 정확한 원인 파악을 위해 옵시디언 내부의 개발자 도구(`Ctrl + Shift + I` -> Console 탭)를 열어 **X-Ray 진단**을 수행했습니다.

> **[X-Ray 결과 해석 및 근본 원인]**
> 처음에 저희는 OneDrive 동기화 충돌을 의심했지만, X-Ray(콘솔 로그)를 찍어본 결과 실제 범인은 **플러그인 자체의 '상태 전이(State Transition) 버그'**였습니다. 
> 옵시디언 설정에서 포트 번호나 HTTPS 스위치를 바꿨을 때, 플러그인이 과거의 포트를 제대로 닫고 새로운 포트를 여는 과정을 매끄럽게 수행하지 못하고 '좀비 상태'로 멈춰버린 것입니다.

![옵시디언 개발자 도구 Console 화면](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778130552336.jpg)

#### 💊 4단계: 해결책 (심폐소생술)
이 버그를 해결하는 가장 확실한 방법은 플러그인의 프로세스를 완전히 강제 종료하고 재시작하는 것입니다.
1. 옵시디언 설정 -> **커뮤니티 플러그인** 탭으로 이동.
2. `Local REST API` 플러그인의 메인 스위치를 껐다가(Disable), 3초 후 다시 켭니다(Enable).
3. 위 사진의 콘솔 창 마지막 줄에 `[REST API] Listening on http://127.0.0.1:27123` 이라는 메시지가 나타나면 닫혀있던 포트가 정상적으로 열린 것입니다!

### 3.2 옵시디언 전송 성공
최종적으로 통신이 뚫린 후, 투두 리스트에서 [옵시디언 -> 복사] 버튼을 눌러 성공적으로 전송된 화면입니다.

![옵시디언 전송 성공 팝업](file:///C:/Users/eugene/.gemini/antigravity/brain/dddc4a67-d3cf-4c30-ad7f-1d82b45a1153/media__1778163332463.jpg)

> [!TIP]
> 이제 옵시디언의 `Inbox` 폴더에 가면 `Siders_날짜_시간.md` 형식으로 아름답게 파일이 생성되어 있을 것입니다!
