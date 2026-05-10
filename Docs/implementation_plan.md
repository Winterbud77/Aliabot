# 투두 리스트 고도화 및 구글 캘린더 연동 계획 (Refined Todo List & Google Calendar Integration Plan)

기존의 기본 기능을 넘어, 좀 더 전문적이고 실용적인 할 일 관리 도구로 발전시키기 위한 계획입니다.

## 사용자 리뷰 필요 사항 (User Review Required)

> [!IMPORTANT]
> **구글 캘린더 연동**에는 구글 클라우드 콘솔에서의 API 키 및 OAuth 2.0 클라이언트 ID 설정이 필요합니다. 
> 초기 단계에서는 연동을 위한 구조를 잡고, 사용자가 자신의 인증 정보를 입력할 수 있는 필드를 제공하는 방식으로 진행할 예정입니다.

## 제안된 변경 사항 (Proposed Changes)

### [Frontend - UI/UX]

#### [MODIFY] [App.jsx](file:///c:/Users/eugene/Projects/Work01_Anti/src/App.jsx)
- `todos` 상태 객체에 `completed` 필드 추가.
- `toggleTodo` 함수 구현: 클릭 시 완료/미완료 상태 전환.
- 맵핑 인덱스(`index`)를 활용한 번호 표기 추가.
- 구글 캘린더 연동 버튼 및 모달/입력창 구조 추가.

#### [MODIFY] [index.css](file:///c:/Users/eugene/Projects/Work01_Anti/src/index.css)
- `completed` 클래스 추가: `text-decoration: line-through` 및 색상 흐리게 처리.
- 커스텀 체크박스 스타일 적용: 세련된 "V" 표시 애니메이션.
- 리스트 번호 배지 스타일 추가.
- Google 브랜드 가이드에 맞춘 "Sign in with Google" 버튼 스타일.

### [Frontend - Integration]

#### [NEW] [googleCalendarService.js](file:///c:/Users/eugene/Projects/Work01_Anti/src/services/googleCalendarService.js)
- Google API 클라이언트(`gapi`) 로드 및 인증 로직 추상화.
- 할 일을 캘린더 이벤트로 등록하는 함수 구현.

## 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **완료 표시**: 할 일을 클릭(또는 체크박스 클릭)했을 때 취소선이 생기고 글자색이 변하는지 확인.
2. **번호 표시**: 할 일이 추가될 때마다 1, 2, 3... 순서대로 번호가 매겨지는지 확인.
3. **UI 정교화**: 호버 효과 및 애니메이션이 좀 더 부드럽게 작동하는지 확인.
4. **구글 연동**: 연동 버튼 클릭 시 인증 프로세스(또는 설정 안내)가 정상적으로 나타나는지 확인.
