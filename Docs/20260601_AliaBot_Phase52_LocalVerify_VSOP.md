---
title: "VSOP: AliaBot Phase 5.2 — 로컬 검증 표준 절차"
date: 2026-06-01
type: sop
category: AliaBot
subcategory: Phase5.2-LocalVerify
tags: [aliabot, sop, vsop, local-verify, non-developer]
created: 2026-06-01
ai_model: Cursor Agent (Auto)
related_vtl: outputs/20260601_AliaBot_Phase52_LocalVerify_VTL.md
summary: "비개발자도 따라할 수 있는 Phase 5.2 로컬 검증 절차 (스크린샷 포함)"
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# VSOP: AliaBot Phase 5.2 로컬 검증

> **대상:** AliaBot Secretary 로컬 테스트 (배포 없음)  
> **소요:** 약 15~20분  
> **준비물:** Gemini API 키, Google 로그인 계정

---

## Step 1. 개발 서버 켜기

1. VS Code/Cursor 터미널 열기
2. 아래 명령 실행:

```powershell
cd c:\Users\eugene\Projects\Work01_Anti
npm run dev
```

3. 터미널에 나온 주소 클릭 (예: `http://localhost:5173`)
4. **스크린샷 저장:** AliaBot 메인 화면

---

## Step 2. 로그인

1. Google 로그인 버튼 클릭
2. 팝업이 막히면 Redirect 로그인 안내에 따라 진행
3. 로그인 후 메모 목록이 보이면 OK

---

## Step 3. Gemini API 키 입력

1. 우측 상단 **⚙️ 설정** 클릭
2. **Gemini API Key** 입력란에 키 붙여넣기
   - `Ctrl+A` → `Delete` → `Ctrl+V` (기존 내용 지우고 전체 붙여넣기)
3. 설정 창 닫기 (입력 즉시 localStorage 저장됨)
4. **스크린샷 저장:** 설정 화면 (키는 가려진 상태)

---

## Step 4. AI 태깅 테스트

1. 입력창에 아래 문장 입력:

```
프리바 환경제어 야간 보온 SOP 작성 및 검토 필요
```

2. **[추가]** 클릭
3. **1~3초 대기**
4. 확인:
   - 메모 아래 `#태그` 칩 1~3개
   - 한 줄 요약 문장
5. `F12` → **Console** 탭:
   - `[Gemini] ✅ 파싱 성공` 확인
6. **스크린샷 저장:** 메모 + Console 함께

### 실패 시 FAQ

| 증상 | 확인 |
|---|---|
| 태그 없음 | Gemini 키 재입력, Console에 404/401 확인 |
| 404 model not found | `gemini.js` 모델명 확인 (2.5-flash) |
| JSON 파싱 실패 | Console `[Gemini] AI 원문 응답` 캡처 후 VTL Issue 기록 |

---

## Step 5. UX 기능 확인

### 5-1. 최신순
- 방금 추가한 메모가 **맨 위**에 있는지 확인

### 5-2. 번호(seq)
- 새 메모에 **고정 번호**가 붙는지 확인
- 과거 메모는 `·` 또는 백필 후 번호

### 5-3. 수정
- ✏️ 클릭 → 텍스트 수정 → ✓ 저장

### 5-4. 태그 필터
- 태그 칩 클릭 → 해당 메모만 표시
- `#태그 필터 중` 배너 확인

각 단계 **스크린샷 1장** 권장 → `docs/Screenshots/202606/` 저장

---

## Step 6. 결과 보고 (Cursor에게)

검증 후 채팅에 아래 형식으로 알려주세요:

```
Phase 5.2 로컬 검증 결과:
- AI 태깅: PASS/FAIL
- 최신순: PASS/FAIL
- seq: PASS/FAIL
- 수정: PASS/FAIL
- 태그필터: PASS/FAIL
- (스크린샷 첨부)
```

→ Agent가 VTL Section 6을 **PASS/FAIL**로 갱신합니다.

---

## Step 7. 완료 후 (배포 없음)

- Git commit만 (`feature-ai-routing`)
- **master push / Vercel 배포는 하지 않음** (지인 공유 URL 유지)
