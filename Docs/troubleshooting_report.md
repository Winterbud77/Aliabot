# PWA 설치 문제 해결 리포트 (PWA Troubleshooting Report)

이번 프로젝트에서 PWA(Progressive Web App) 설치 버튼이 나타나지 않았던 문제의 핵심 원인과 해결 과정을 정리한 문서입니다. 향후 비슷한 환경에서의 개발 지침(SOP)으로 활용하시기 바랍니다.

## 1. 문제 개요 (Issue Overview)
- **증상**: 서비스 워커와 매니페스트를 등록했음에도 불구하고 브라우저 주소창 및 앱 내부에 'Install' 버튼이 나타나지 않음.
- **환경**: Windows, PowerShell, Vite + React.

## 2. 핵심 원인 (Root Causes)

### 2.1 필수 리소스 누락 (Missing Required Assets)
- **내용**: PWA 설치를 위해서는 특정 크기(192x192, 512x512)의 아이콘이 반드시 존재해야 함. 이전에는 아이콘 파일이 부재하여 브라우저가 앱을 '설치 가능한 상태'로 인식하지 못함.

### 2.2 터미널 명령어 호환성 문제 (Shell Compatibility)
- **내용**: 윈도우 파워셸(PowerShell) 환경에서 `&&` 연산자나 일반적인 `copy` 명령어가 예기치 않게 실패함.
- **결과**: 아이콘 파일을 복사했다고 생각했으나 실제로는 `public` 폴더에 파일이 생성되지 않았던 것이 치명적이었음.

### 2.3 코드 내 구문 오류 (Syntax Errors)
- **내용**: [App.jsx](file:///c:/Users/eugene/Projects/Work01_Anti/src/App.jsx) 파일을 수정하는 과정에서 불필요한 백틱(`)이나 잘못된 텍스트가 포함되어 리액트 앱 자체가 중단됨.
- **결과**: 리액트 컴포넌트 실행 자체가 중단되어 PWA 관련 로직이 작동하지 않음.

## 3. 해결 단계 (Resolution Steps)

1.  **AI 리소스 생성**: `generate_image` 도구를 사용하여 PWA 표준에 맞는 고품질 아이콘을 생성함.
2.  **안전한 파일 복사**: 터미널 명령어 대신 **Node.js 스크립트([copy_icons.js](file:///C:/Users/eugene/Projects/Work01_Anti/copy_icons.js))**를 작성하여 파일 시스템 수준에서 확실하게 파일을 복사함.
3.  **코드 정규화**: [App.jsx](file:///c:/Users/eugene/Projects/Work01_Anti/src/App.jsx)와 [main.jsx](file:///c:/Users/eugene/Projects/Work01_Anti/src/main.jsx)를 다시 작성하여 문법 오류를 제거하고 깨끗한 상태로 복구함.
4.  **캐시 갱신**: 서비스 워커의 `CACHE_NAME`을 업데이트하여 브라우저가 새로운 아이콘과 설정을 강제로 인식하도록 유도함.

## 4. 향후 재발 방지 가이드 (SOP Recommendations)

- **파일 확인 루틴**: 아이콘 배치 후 반드시 `list_dir` 등을 사용하여 파일 존재 여부와 크기를 직접 확인해야 함.
- **강력 새로고침**: PWA 관련 변경 사항은 일반 새로고침으로 반영되지 않을 수 있으므로 반드시 **`Ctrl + F5`**를 권장함.
- **환경 점검**: 윈도우 환경에서는 운영체제 전용 명령어보다 언어(Node.js 등) 기반의 파일 조작이 더 안전함.
