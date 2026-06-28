---
title: "TechLog: AliaBot Phase 5.x Serverless Gemini API 연동 디버깅 VTL"
date: 2026-06-14
type: debug-log
category: AliaBot
subcategory: AI-Integration
tags: [aliabot, gemini, api, debugging, serverless, firebase-functions, oauth]
created: 2026-06-14
ai_model: Claude 3.5 Sonnet High (Antigravity)
workspace: Winterbud77/AliaBot
session: AliaBot_Phase5_Serverless_Gemini_Setup
summary: "서버리스 Cloud Functions 경유 Gemini API 호출 시 발생하는 401 Unauthorized 에러와 서버리스 핫 인스턴스 캐싱 지연 현상을 규명하고 해결한 전체 과정 기록"
related_docs:
  - Docs/VTL_VSOP_Writing_Guide.md
  - Docs/Session_SOP_Guidelines.md
  - Outputs/20260530_AliaBot_Phase52_Gemini_Debug_VTL.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# 🐛 [TechLog] AliaBot Phase 5.x — Serverless Gemini API 디버깅 VTL

> **목표:** 원격 Firebase Cloud Functions 서버가 구글 AI Studio의 `AQ.Ab8R...` 신형 키를 사용하여 통신을 대리 요청할 때 발생하는 401 Unauthorized 에러와 서버 캐시 지연 현상의 기술적 인과관계를 보존합니다.

---

## 1. 🗂️ 문제 상황 (Problem Statement)
- **증상**: 54번~68번 메모 영역에서 해시태그(#)와 요약(Summary)이 노출되지 않고 백그라운드 갱신(Auto-backfill)이 멈추는 장애 발생.
- **서버 로그 및 에러**:
  ```text
  [analyzeMemoWithGemini] Error: Gemini API 오류 (401): Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.
  ```
- **환경**: 원격 배포된 Vercel PWA 웹앱 및 로컬호스트(`http://localhost:5173`) 환경.

---

## 2. 🔍 원인 분석 과정 (Chain of Thought)

### Step 1: 로컬호스트 vs 원격 서버의 통신 분기 차이점 발견
- **로컬호스트(과거 성공 시점)**: 사용자의 로컬 환경 `localStorage`에 API 키가 적재되어 있을 때, 프론트엔드가 직접 구글 API 서버에 `fetch`를 날림 (BYOK 방식). 이 경우 구글 게이트웨이는 호출 출처를 따지지 않고 키가 활성 상태면 정상(200 OK) 리턴.
- **원격 배포/PWA (서버리스 방식)**: 개별 사용자의 API 키를 수집하지 않으므로, 백그라운드 서버(Firebase Functions)가 호스트가 주입한 Secret `GEMINI_API_KEY`를 꺼내 대리 호출. 이 경우 구글 API Gateway는 호출 주체인 Firebase 서비스 계정(Service Account)과 API 키의 프로젝트 바인딩 적합성을 강력히 필터링함.

### Step 2: `AQ.Ab8R...` 신형 키의 프로젝트 종속성 규명
- 구글 AI Studio의 신형 키(`AQ.Ab8R...`)는 과거 범용 키(`AIzaSy...`)와 달리, 특정 Google Cloud Project에 강력하게 종속되어 생성됨.
- 만약 이미 복잡한 구글 클라우드 보안 설정이 등록된 기존의 프로젝트(예: `AliaBot-Dev`) 하에서 신형 키를 발급받으면, 파이어베이스 서버(`react-todo-d3fcc`)가 이 키를 대리 전송할 때 **자격 증명 소유권 불일치(401 Unauthorized)**로 즉시 차단당함.

### Step 3: 서버리스 컨테이너 캐시 동기화 지연 (Warm Instance Caching)
- 사용자가 터미널에서 신규 프로젝트 기반의 키로 시크릿을 갱신(`firebase functions:secrets:set`)했음에도 즉시 반영되지 않고 계속 401 에러를 뿜음.
- **원인**: 파이어베이스의 Node.js 서버리스 컨테이너들이 메모리에 구버전 만료 키를 캐싱한 채 대기(Warm Start) 상태를 유지하고 있었음.
- **해결책**: `functions/index.js`에 주석 한 줄을 달아 변경을 유도한 뒤 `firebase deploy --only functions`를 다시 날려 컨테이너의 강제 완전 재구동(Cold Start)을 완료함으로써 정상 갱신을 성공시킴.

---

## 3. ✅ 최종 해결 결과

### 1) 클라이언트 Auto-Backfill 코드 보완
- `src/App.jsx` 의 line 179를 수정하여, 백필 스캔 시에도 무조건 서버 프록시만 고집하지 않고 사용자의 로컬 키가 있으면 우선권을 부여하도록 아키텍처 유연성 확보:
  ```diff
  - analyzeWithGemini(todo.text, null)
  + analyzeWithGemini(todo.text, apiKeys.gemini || null)
  ```

### 2) Vercel PWA 및 Localhost 복구 확인
- **결과**: `https://aliabot.vercel.app` 과 `http://localhost:5173` 에서 54번부터 69번까지 밀려있던 모든 메모에 보라색 해시태그(#)와 요약 배지가 실시간으로 전부 복원됨을 검증 완료.

---

## 4. 🗺️ 향후 재발 방지 지침 (VTL FAQ)
- **Q**: 서버 배포 후에도 계속 `Expected OAuth 2 access token (401)`이 발생하면?
  - **A**: 발급받은 키가 특정 GCP 프로젝트 보안에 묶여있기 때문입니다. AI Studio에서 반드시 `+ 프로젝트 만들기`를 통해 아무 제약이 없는 신규 독립형 프로젝트 영역을 개설하고 키를 새로 발급받아야 합니다.
- **Q**: 터미널로 시크릿을 갱신했는데도 계속 옛날 키 에러를 뱉는다면?
  - **A**: 서버리스 컨테이너 캐시 지연 현상입니다. `index.js` 소스 코드를 조금이라도 변경한 후 `firebase deploy`를 날려 인스턴스를 강제로 재생성하십시오.
