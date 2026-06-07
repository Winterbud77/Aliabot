---
title: "TechLog: AliaBot Phase 5.x PWA AI Backfill VTL"
date: 2026-06-08
type: tech-log
category: AliaBot
subcategory: Phase 5.x
tags: [aliabot, phase5, pwa, ai-backfill, dvh, logic]
created: 2026-06-08
ai_model: Antigravity (Medium)
workspace: Winterbud77/AliaBot
summary: "PWA 즉각 수명주기 갱신, AI 백필 복구, 리스트 번호 역순 보정 및 모바일 dvh 스크롤 개선 기술로그"
---

# TechLog: AliaBot Phase 5.x PWA & AI Backfill VTL

본 기술로그는 AliaBot Conductor Phase 5.x 개발 과정 중 구현된 **AI 백그라운드 백필(Auto-backfill), PWA 즉각 수명 주기 제어, 리스트 번호 역순 보정, 모바일 dvh 스크롤 레이아웃 개선**에 대한 구현 원리와 검증 결과를 기술합니다.

---

## 1. AI 요약/태깅 백그라운드 자동 백필 (Auto-backfill) 엔진

### 1.1 설계 배경 및 원인
* **증상**: 백엔드 함수 배포 지연 및 API 키 임시 미등록으로 인해 54번~67번 메모 영역에 AI 자동 태그(#)와 요약(Summary) 데이터가 누락되어 리스트 가시성이 저하되는 현상이 존재했습니다.
* **해결 가설**: 로그인 완료 후 Firestore 데이터 구독(`onSnapshot`) 시점에서 AI 분석 플래그(`aiProcessed`)가 비어 있는 과거 문서를 탐지하여, 클라이언트 유하가 없는 선에서 점진적으로 자동 API 요청을 보내 보정하도록 설계했습니다.

### 1.2 작동 메커니즘
1. Firestore의 실시간 스냅샷을 돌며 `tags`가 비어 있고, `summary`가 존재하지 않으며, `aiProcessed !== true` 상태인 메모 목록을 스캔합니다.
2. 짧은 시간에 다수의 API 호출로 인한 **과부하(Rate Limit)**를 회피하기 위해 `slice(0, 5)`를 통해 **한 번에 최대 5개씩만** 필터링하여 백그라운드 비동기 루프로 전송합니다.
3. API 호출이 완료되거나 에러가 났을 때 `aiProcessed: true`를 강제로 마킹하여, 재스캔 시 이미 분석 시도된 문서가 중복 연산되지 않도록 잠금(Lock) 처리합니다.

---

## 2. PWA 즉각 갱신 수명 주기 제어 (skipWaiting & clients.claim)

### 2.1 서비스 워커 업데이트 지연
* **원리**: PWA 서비스 워커(`sw.js`) 파일의 새로운 버전(`v5` 등)이 배포되더라도, 브라우저는 실행 중인 기존 AliaBot 세션 탭이 전부 닫히기 전까지 활성화(Activate)를 대기(Waiting) 모드로 묶어놓습니다.
* **해결책**:
  * 서비스 워커 설치(`install`) 이벤트에 `self.skipWaiting()` 코드를 명시하여 신버전 다운로드 완료 즉시 활성화되도록 제어권을 강제 위임했습니다.
  * 활성화(`activate`) 리스너에 `self.clients.claim()`을 주입하여 활성 즉시 웹앱 탭 전체를 장악해 최신 캐시 리소스가 로딩되도록 제어 아키텍처를 확립했습니다.

---

## 3. 메모 리스트 번호 역순 연산 보정

### 3.1 역순 연산 공식
* **원인**: 최신 작성 문서가 리스트 맨 위로 가는 내림차순 정렬 모드에서 일련번호(`seq`)가 아직 지정되지 않았거나 복원 중인 구형 메모들이 화면에 렌더링될 때, 단순히 `index + 1` 공식을 타게 되면 1, 2, 3 순으로 찍혀서 정렬 규칙과 충돌했습니다.
* **해결 공식**:
  ```javascript
  {todo.seq ?? (todos.length - index)}
  ```
  * 고유 일련번호(`seq`)가 없을 때, 전체 리스트 길이(`todos.length`)에서 현재 배열 인덱스(`index`)를 빼는 공식을 대입하여 최신 메모일수록 항상 큰 번호를 부여받는 리스트 일관성을 복구했습니다.

---

## 4. 모바일 뷰포트 높이 겹침(Overlap) 방지 레이아웃

### 4.1 Dynamic Viewport Height (dvh)
* **배경**: 모바일 브라우저는 주소창과 툴바의 개폐에 따라 실제 가용 높이가 변동하여 `100vh` 높이가 화면을 뚫고 나가 아래 입력 폼이 겹치거나 잘리는 문제가 존재합니다.
* **해결책**:
  * `.app-container`의 높이를 `100dvh`로 제한하고, 상하 요소 배치 방식을 flex-column으로 지정하였습니다.
  * 상단 로고 및 입력부는 고정하고, 목록 영역(`.todo-scroll-region`)만 스크롤되도록 격리하여 모바일 터치 브라우저 높이 변동에도 가독성이 훼손되지 않도록 조치하였습니다.
