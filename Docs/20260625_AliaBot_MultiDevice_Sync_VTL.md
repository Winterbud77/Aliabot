# 🛠️ VTL: AliaBot Phase 5.5 — 일정/옵시디언 날짜 폴백 및 다중 뱃지 렌더링 기술로그 (VTL)

---
title: "VTL: AliaBot Phase 5.5 — 일정/옵시디언 날짜 폴백 및 다중 뱃지 렌더링 기술로그"
date: 2026-06-25
type: visual-tech-log
category: AliaBot
subcategory: Phase5/Integration
tags: [vtl, debugging, date-parsing, multi-badge, react, fallback]
---

> **본 기술로그(VTL)의 목적**:
> AI 파싱 지연 상황에서도 목표 시간(To Do Date)이 정확히 저장되게 지원하기 위한 정적 날짜 추출 유틸리티 연동 내역과, 메모 카드 상단에 전송 완료된 다중 목적지 배지들이 가로 정렬로 동시 노출되도록 개선한 UI 코드 변경점 및 기술 구조를 영구 기록합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① Deterministic Fallback Date Parser (결정론적 폴백 날짜 파서)
AI(Gemini)에 의한 자연어 정보 추출(Information Extraction) 과정이 일시적 한도 초과(429 Rate Limit)나 파싱 실패로 빈 결과를 반환하더라도, 원본 메모 문장에 명시된 날짜 형태(`X월 Y일`, `M/D`, `June 28` 등)와 시간 단어(`오전 X시`, `14:30` 등)를 클라이언트 단의 자바스크립트 정규식으로 탐색하여 날짜 객체(`Date`)를 확정 획득하는 복원 메커니즘입니다.

### ② Dynamically Wrapped Badge Array (동적 배치 배지 배열)
Firestore에서 개별 문서 단위로 들고 있는 전송 완료 플래그 배열(`destinations` 필드)의 값들을 React의 컴포넌트 매핑(`Array.prototype.map`)을 거쳐 개별 뱃지 엘리먼트로 변환하고, 이를 Flexbox 래핑(`flex-wrap: wrap`) 스타일로 묶어 화면 크기에 상관없이 가로로 나란히 나열하는 시각적 피드백 구성 방식입니다.

---

## 2. 🏗️ 아키텍처 및 데이터 흐름 변화 (Data Flow)

```mermaid
flowchart TD
    A[사용자 입력: "!일정 6월 26일 토마토 적엽"] --> B(메모 Firestore 추가)
    B --> C{AI 백필 정상 구동?}
    
    C -- YES --> D[metadata.parsedEvent 에 6월 26일 날짜 캐싱]
    C -- NO (API 한도초과 등) --> E[metadata.parsedEvent 는 null 상태 유지]
    
    D --> F[내보내기 실행 GCal/Obsidian]
    E --> F
    
    F --> G{parsedEvent 존재 여부?}
    G -- YES --> H[AI 캐싱 날짜 기준 일정 생성 & Siders_20260626_파일명 빌드]
    G -- NO --> I[dateParser.extractDateFromText 가동하여 본문에서 6월 26일 강제 추출]
    
    I --> J[추출 성공: 6월 26일 일정 등록 & Siders_20260626_파일명 빌드]
    I --> K[추출 실패: 시스템 오늘 날짜 6월 25일로 기본 등록]
```

---

## 3. 📝 코드 수정 상세 내역 (Code Changes)

### 1) [NEW] `src/utils/dateParser.js` 생성
* **역할**: 본문 텍스트 내에서 날짜(`extractDateFromText`)와 한국 표준시 ISO 스트링 변환(`getSeoulISOStringFromDate`)을 수행하는 공통 파싱 헬퍼 모듈을 신규 제작했습니다.

### 2) [MODIFY] `src/api/calendar.js` 연동
* 캘린더 등록 함수(`insertCalendarEvent`) 내부에 AI 파싱 데이터가 빈 상태로 넘어오거나 오류가 날 경우, `extractDateFromText`를 이용해 원본 텍스트의 목표 일자를 추출하여 저장하는 Fallback 구조를 구현했습니다.

### 3) [MODIFY] `src/api/obsidian.js` & `src/App.jsx`
* 옵시디언 전송(`sendToObsidian`) 시 세 번째 인자로 대상 정보(`eventDetails`)를 받아, 파일명을 생성할 때 `Siders_YYYYMMDD_HHMMSS.md` 형태로 목표 날짜가 정상 투영되도록 파일명 조립 로직을 보완하고 `App.jsx`에서 메타데이터를 매개하도록 수정했습니다.

### 4) [MODIFY] 다중 뱃지 출력 구현 (`src/App.jsx`)
* 단일 카테고리만 렌더링하던 931라인의 뱃지 출력 영역을 `todo.destinations` 배열을 순회하여 `[📅 캘린더] [📝 Obsidian]` 등이 가로로 모두 출력되도록 마크업을 동적 맵핑 구조로 갱신했습니다.
