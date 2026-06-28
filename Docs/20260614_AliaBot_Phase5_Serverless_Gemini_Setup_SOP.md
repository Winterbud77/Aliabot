---
title: "VSOP: AliaBot Phase 5.x — Serverless Gemini API 및 PWA 캐시 동기화 복구 절차"
date: 2026-06-14
type: sop
category: AliaBot
subcategory: AI-Integration
tags: [sop, vsop, non-developer, gemini, firebase-functions, cache, pwa]
created: 2026-06-14
ai_model: Claude 3.5 Sonnet High (Antigravity)
related_vtl: Outputs/20260614_AliaBot_Phase5_Serverless_Gemini_Debug_VTL.md
summary: "구글 AI Studio 독립 프로젝트 개설, 서버 시크릿 주입, 서비스워커 및 로컬 개발서버 핫리로드 문제 해결 가이드"
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# 📋 VSOP: Serverless Gemini API 및 PWA 캐시 동기화 복구 절차

본 표준 운영 절차(SOP)는 비개발자 관리자나 동료 지인들이 AliaBot 사용 중 **AI 자동 태깅 및 요약이 멈췄거나, 크롬 브라우저에서 'AliaBot 설치' 아이콘 대신 '앱에서 열기'만 나올 때, 혹은 화면이 하얗게(Blank) 비어있을 때** 조치하는 순서도입니다.

---

## 1. 개요 및 사전 수집
- **대상**: AliaBot 프로젝트 관리자 및 테스트 참여 지인
- **소요 시간**: 약 5분
- **준비물**: Google 계정, 관리 권한 PC 터미널

---

## 2. 세부 절차 (Step-by-Step)

### Step 1. 구글 AI Studio에서 "독립형" API 키 만들기
기존에 복잡한 구글 클라우드 보안 설정이 꼬인 프로젝트를 탈피하여, 아무 제약이 없는 깨끗한 프로젝트 영역에서 API Key를 발급받아야 합니다.
1. **[Google AI Studio API Keys](https://aistudio.google.com/app/apikey)** 페이지에 접속 및 로그인합니다.
2. 우측 상단의 **[API Key 만들기]** (Create API key) 버튼을 클릭합니다.
3. 팝업창에서 **"가져온 프로젝트 선택"** 드롭다운 메뉴를 클릭하고 **`+ 프로젝트 만들기` (Create project)**를 선택합니다.
4. 우측 하단의 **[키 만들기]**를 클릭합니다.
5. 생성된 **`AQ.Ab8R...`** 형식의 API 키를 복사하여 안전한 곳에 저장합니다.

---

### Step 2. Firebase Cloud Functions 서버에 키 주입 및 강제 부팅
비밀 키를 교체하더라도 기존 서버 컨테이너가 낡은 열쇠를 메모리에 쥐고 대기하는 '캐시 지연' 현상을 깨부수어야 합니다.
1. 본 PC의 터미널(PowerShell)을 열고 프로젝트 루트 경로로 이동합니다.
2. 아래 명령을 실행합니다:
   ```powershell
   firebase functions:secrets:set GEMINI_API_KEY
   ```
3. `? Enter a value for GEMINI_API_KEY:` 문구가 나오면, Step 1에서 발급받은 **`AQ.Ab8R...` 키를 붙여넣고 Enter**를 누릅니다.
4. 낡은 시크릿을 버리고 재배포할 것인지 묻는 질문에 **`Yes` (또는 `y`)**를 기입하여 빌드 배포를 시작합니다.
5. 배포가 완료(`Deploy complete!`)되면 서버 리프레시가 정상적으로 종료된 것입니다.

---

### Step 3. 크롬 브라우저의 PWA 앱 목록 강제 청소
기기에 기존 AliaBot이 깔려있어 주소창의 '설치' 아이콘이 나타나지 않을 때 정리하는 법입니다.
1. 주소창 우측의 **[앱에서 열기]** 아이콘을 클릭해 AliaBot 전용 앱 창을 실행합니다.
2. 앱 타이틀 바 우측 상단의 **점 3개(선택 메뉴)**를 클릭합니다.
3. **`[AliaBot 제거...] (Uninstall AliaBot...)`**를 클릭하고, **"Chrome에서 데이터도 함께 지우기"** 체크박스에 체크한 뒤 **[제거]**를 누릅니다.
4. 브라우저로 돌아와 새로고침(`F5`)하면 주소창에 다시 **"AliaBot 설치(웹다운로드)"** 아이콘이 나타납니다.

---

### Step 4. 로컬호스트 흰 화면(Blank) 시 개발 서버 재부팅
개발 서버가 장시간(100시간 이상) 켜져 있어 핫 모듈 대체(HMR) 캐시가 꼬였을 때 해결책입니다.
1. 돌고 있는 터미널 창에서 **`Ctrl + C`**를 눌러 서버를 끕니다.
2. 다시 아래 명령을 쳐서 리프레시 부팅을 가동합니다:
   ```powershell
   npm run dev
   ```
3. 브라우저에서 `http://localhost:5173` 포트로 새롭게 진입합니다.

---

## 3. 🚨 문제 해결 FAQ (Troubleshooting)

| 증상 | 원인 | 해결 방안 |
|---|---|---|
| 키를 바꿨는데도 계속 401 Unauthorized 에러가 납니다. | `functions/index.js`에 코드 변경이 없어 옛날 서버가 그대로 떠있는 캐시 지연입니다. | `index.js` 끝단에 무의미한 주석 한 줄을 달고 `firebase deploy --only functions`를 재시행해 주십시오. |
| 포트 충돌로 `localhost:5174`로 자동 이동되었습니다. | 백그라운드에 이미 기존 `npm run dev` 서버가 돌아가 포트를 쥔 상태입니다. | 실행 중인 다른 터미널들을 닫아 5173 포트를 정리하거나, `localhost:5173` 주소를 주소창에 직접 쳐서 이동하십시오. |
