# 📊 AliaBot Phase 5.5: 대시보드 스프레드시트 뷰 전환 및 CSV 다운로드 구현 계획 (Dashboard Spreadsheet View & CSV Export Plan)

본 계획서는 AliaBot PWA 애플리케이션에 대시보드 스프레드시트 뷰(Table View) 전환 기능과 Firestore 내 전체 누적 메모를 CSV 파일로 다운로드하는 기능을 도입하기 위한 설계 및 개발 계획을 정의합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① Toggle View (보기 토글) & Conditional Layout Rendering (조건부 레이아웃 렌더링)
* **개념**: 사용자 인터페이스(UI) 상에서 동일한 데이터 원본(`todos` 상태 배열)을 유지한 채, 사용자의 선택 상태(State)에 따라 렌더링하는 시각적 템플릿을 동적으로 전환하는 기법입니다.
* **작동 원리**: React의 `useState` 훅을 활용하여 현재 활성화된 뷰 모드(`viewMode`: `'list'` 또는 `'table'`)를 상태로 관리합니다. 상단 헤더 영역에 배치된 토글 스위치나 버튼을 누르면 상태가 변경되며, 조건부 렌더링 식(`viewMode === 'table' ? <TableView /> : <ListView />`)을 통해 화면에 그려지는 DOM(Document Object Model; 문서 객체 모델) 트리 구조를 즉각 스왑(Swap)합니다. CSS에서는 테이블 뷰를 위해 HTML5 표준 `<table>` 태그와 `thead`, `tbody` 구조를 채택하여 정형화된 격자 형태를 지원합니다.

### ② Client-side CSV Generation (클라이언트 측 CSV 생성) & UTF-8 BOM (Byte Order Mark; 바이트 순서 표식)
* **개념**: 서버(Firestore 또는 Firebase Cloud Functions)를 거치지 않고, 사용자의 웹 브라우저 내에서 직접 자바스크립트 엔진만으로 정형 데이터를 CSV(Comma-Separated Values; 쉼표로 구분된 값) 문자열로 가공하는 기법입니다.
* **작동 원리**: 
  1. Firestore로부터 가져온 메모 객체 배열(`Array` of `Objects`)을 순회하며, 각 행(Row)에 매칭될 헤더 필드(등록일시, 내용, 요약, 태그, 전송 목적지 등)를 추출합니다.
  2. 필드 내에 쉼표(`,`), 줄바꿈(`\n`), 큰따옴표(`"`)가 포함될 경우 CSV 포맷 오류가 발생하므로, 각 필드 값을 큰따옴표로 감싸고 내부 큰따옴표는 이중 큰따옴표(`""`)로 이스케이프(Escape; 탈출) 처리하는 전처리 로직을 적용합니다.
  3. **BOM (Byte Order Mark; 바이트 순서 표식)**: 한글이 포함된 텍스트 파일을 Microsoft Excel에서 열 때 유니코드 인코딩이 깨지는 현상이 빈번합니다. 이를 방지하기 위해 생성된 CSV 문자열의 가장 첫머리에 UTF-8 BOM을 식별할 수 있는 3바이트 표식(`\uFEFF`)을 강제로 삽입하여 브라우저가 UTF-8 문서임을 엑셀에 명시적으로 인지시킵니다.

### ③ Blob Object (블롭 객체) & Anchor Element Memory Revocation (앵커 엘리먼트 메모리 해제)
* **개념**: 브라우저 메모리에 존재하는 이진 데이터 또는 텍스트 데이터를 파일 객체 형태로 변환하여 컴퓨터 로컬 스토리지에 파일 형태로 다운로드하게 유도하는 메커니즘입니다.
* **작동 원리**:
  1. 위 단계에서 BOM을 추가하여 가공한 CSV 문자열을 `new Blob([csvData], { type: 'text/csv;charset=utf-8;' })` 생성자를 호출하여 파일 성격의 객체(Blob)로 변환합니다.
  2. `URL.createObjectURL(blob)` API를 통해 이 Blob 객체를 가리키는 브라우저 내부용 임시 가상 경로(Object URL)를 생성합니다.
  3. 자바스크립트 메모리 상에 가상의 `<a>` (Anchor; 앵커) 태그를 생성하고, `href` 속성에 임시 경로를 지정한 후, `download` 속성에 다운로드될 파일명(예: `AliaBot_Export_20260627.csv`)을 지정합니다.
  4. `link.click()`을 가상으로 실행시켜 다운로드 창을 발생시킨 뒤, 메모리 누수(Memory Leak)를 방지하기 위해 생성된 가상 경로를 즉시 파괴(`URL.revokeObjectURL`)하는 자원 정리 작업을 수행합니다.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

## 2. 📝 제안된 변경 사항 (Proposed Changes)

### [Frontend - Logic & Utilities]

#### [NEW] [csvExporter.js](file:///c:/Users/eugene/Projects/Work01_Anti/src/utils/csvExporter.js)
* **역할**: 메모 목록 데이터를 전달받아 Excel에서 호환되는 UTF-8 BOM 기반 CSV 텍스트를 만들고 다운로드 링크를 작동시키는 전용 모듈입니다.
* **추출 정보**: 순번(`seq`), 작성시간(`createdAt`), 본문내용(`text`), AI요약(`summary`), 태그(`tags`), 내보내기 목적지(`destinations`)

### [Frontend - UI/UX Components]

#### [MODIFY] [App.jsx](file:///c:/Users/eugene/Projects/Work01_Anti/src/App.jsx)
* **상태 필드 추가**: `viewMode` (`'list'` 또는 `'table'`)를 통해 렌더링 뷰를 전환합니다.
* **표 보기용 테이블(Table) 렌더링 로직**: `viewMode === 'table'`일 때 출력될 `<table class="spreadsheet-table">` 구조를 추가합니다. 인라인 액션 버튼(수정, 삭제, 재내보내기)도 테이블 내에 컴팩트하게 구성합니다.
* **컨트롤 바 UI 개편**: 필터와 정렬 버튼들이 배치된 상단 컨트롤 바 영역에 `📋 목록` / `📊 표` 전환 토글 버튼과 `📥 Excel 다운로드` 버튼을 추가합니다.

#### [MODIFY] [index.css](file:///c:/Users/eugene/Projects/Work01_Anti/src/index.css)
* **표 스타일링**: 스프레드시트 뷰에 걸맞은 테두리(Border), 호버 효과(Row Hover), 스크롤바(Sticky Table Header), HSL 기반 컬러 팔레트를 적용합니다.
* **스위치 토글 디자인**: 현대적이고 매끄러운 탭 스타일의 토글 버튼 디자인을 추가합니다.
* **반응형 대책**: 모바일 환경에서 표 보기 진입 시 가로 스크롤(`overflow-x: auto`)을 제공하여 레이아웃 깨짐을 방지합니다.

---

## 3. 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **뷰 전환 토글 테스트**: 상단의 보기 토글을 눌렀을 때 화면이 부드럽게 세로 피드(List)에서 스프레드시트 격자(Table)로 전환되는지 확인합니다.
2. **테이블 인터랙션 테스트**: 표 보기 모드에서 각 행의 `수정` 버튼 클릭 시 기존의 인라인 수정 폼이나 모달이 깨짐 없이 동작하는지 확인합니다.
3. **CSV 다운로드 테스트**: `📥 Excel 다운로드` 버튼 클릭 시 로컬 기기에 `AliaBot_Export_YYYYMMDD.csv` 파일이 정상 다운로드되는지 확인합니다.
4. **한글 깨짐 검증**: 다운로드된 `.csv` 파일을 **Microsoft Excel** 및 **텍스트 편집기**로 각각 열어, 한글(메모 본문 및 요약)과 줄바꿈이 깨짐 없이 온전히 렌더링되는지 확인합니다.
