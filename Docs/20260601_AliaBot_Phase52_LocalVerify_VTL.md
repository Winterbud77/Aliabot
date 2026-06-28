---
title: "TechLog: AliaBot Phase 5.2 — Cursor 로컬 검증 VTL"
date: 2026-06-01
type: verify-log
category: AliaBot
subcategory: Phase5.2-LocalVerify
tags: [aliabot, cursor, phase5.2, local-verify, gemini, ux]
created: 2026-06-01
ai_model: Cursor Agent (Auto)
workspace: Winterbud77/AliaBot
session: Cursor_AliaBot_02
summary: "Antigravity → Cursor 이전 후 Phase 5.2(Gemini 태깅 + UX) 로컬 검증 체크리스트 및 정적 코드 리뷰 결과"
related_docs:
  - outputs/20260530_AliaBot_Phase52_Gemini_Debug_VTL.md
  - outputs/20260601_AliaBot_Phase52_LocalVerify_VSOP.md
  - docs/Session_SOP_Guidelines.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# VTL: AliaBot Phase 5.2 — Cursor 로컬 검증

> **문서 성격:** 실행 전·후 검증 기록용 Visual Tech Log  
> **운영 원칙:** 주제/Phase/기능 항목이 바뀔 때마다 VTL(과정) + VSOP(절차)를 `outputs/`에 추가 저장

---

## 1. 세션 맥락 (Context)

| 항목 | 내용 |
|---|---|
| 이전 환경 | Antigravity (AliaBot_01, overview.txt) |
| 현재 환경 | **Cursor** (AliaBot Secretary) |
| 배포 정책 | **로컬 우선**, Vercel push/배포는 사용자 명시 요청 시만 |
| Phase 5.2 목표 | Gemini AI 태깅/요약 + STT 버그 수정 + UX(최신순/수정/태그필터/seq) |

---

## 2. 정적 코드 리뷰 (Cursor, 터미널 실행 전)

> Agent가 소스 파일을 읽어 사전 확인한 결과입니다. **런타임 PASS/FAIL은 아래 체크리스트에서 사용자가 확인합니다.**

### 2.1 Gemini API (`src/api/gemini.js`)

| 검증 항목 | 코드 상태 | 비고 |
|---|---|---|
| 모델명 | `gemini-2.5-flash` | 1.5-flash deprecated 이슈 해결됨 |
| maxOutputTokens | `1024` | thinking 토큰 잘림 방지 |
| JSON 파싱 | `indexOf('{')` ~ `lastIndexOf('}')` | 마크다운 래퍼 대응 |
| 에러 방어 | Content-Type, non-JSON 응답 처리 | 콘솔 `[Gemini]` 로그 |

**정적 리뷰:** PASS (코드 구조 OK)

### 2.2 App.jsx Phase 5.2 UX

| 검증 항목 | 코드 상태 | 위치/근거 |
|---|---|---|
| 최신순 정렬 | `orderBy('createdAt', 'desc')` | Firestore query |
| 게시판식 번호 | `seq: todos.length + 1` | addTodo |
| seq 백필 | v1/v2 localStorage 플래그 | onSnapshot 내부 |
| 인라인 수정 | `editingId`, `saveTodo` | UI |
| 태그 필터 | `activeTag`, `.filter(...)` | UI |
| Gemini 연동 | `analyzeWithGemini` 백그라운드 | addTodo 후 |

**정적 리뷰:** PASS (코드 구조 OK)

### 2.3 참고 — Phase 5.3 코드 일부 존재

코드베이스에 이미 다음이 포함되어 있음 (본 VTL 범위는 5.2지만 기록):
- `src/api/notion.js`, `src/utils/routingRules.js`
- Export 모달 다중 목적지 UI

→ Phase 5.3 검증은 **별도 VTL**로 분리 예정

---

## 3. 로컬 검증 체크리스트 (Runtime)

### Step 0. 환경 준비

```powershell
cd c:\Users\eugene\Projects\Work01_Anti
npm run dev
```

- [ ] Vite 서버 기동 (보통 `http://localhost:5173` 또는 `5174`)
- [ ] 브라우저에서 AliaBot 로드 (로그인 가능)

**스크린샷:** `20260601_AliaBot_로컬서버_기동.png`

---

### Step 1. Gemini API 키 (BYOK)

- [ ] ⚙️ 설정 → Gemini API Key 입력 (localStorage 자동 저장)
- [ ] 키 없을 때: 앱은 동작, 태그/요약만 비활성

**스크린샷:** `20260601_AliaBot_설정_Gemini키.png`

---

### Step 2. AI 태깅/요약

테스트 메모 예시:
```
프리바 환경제어 야간 보온 SOP 작성 및 검토 필요
```

- [ ] [추가] 클릭 후 1~3초 내 `#태그` 칩 표시
- [ ] 한 줄 `summary` 표시
- [ ] F12 Console: `[Gemini] ✅ 파싱 성공` 로그

| 결과 | PASS / FAIL | 메모 |
|---|---|---|
| 태그 표시 | | |
| 요약 표시 | | |
| 콘솔 200 OK | | |

**스크린샷:** `20260601_AliaBot_AI태깅_성공.png` (메모 카드 + Console)

---

### Step 3. 최신순 정렬

- [ ] 새 메모 추가 시 **목록 최상단**에 표시

**스크린샷:** `20260601_AliaBot_최신순정렬.png`

---

### Step 4. 게시판식 번호 (seq)

- [ ] 새 메모에 **고정 번호** 부여 (정렬해도 번호 유지)
- [ ] 과거 메모(seq 없음): `·` 표시 또는 백필 후 번호 표시

**스크린샷:** `20260601_AliaBot_seq번호.png`

---

### Step 5. 수정(✏️)

- [ ] ✏️ 클릭 → 인라인 편집
- [ ] Enter 또는 ✓ 저장 → Firestore 반영
- [ ] Esc 취소

**스크린샷:** `20260601_AliaBot_수정기능.png`

---

### Step 6. 태그 필터

- [ ] 태그 칩 클릭 → 해당 태그 메모만 표시
- [ ] 상단 `#태그 필터 중` 배너 표시
- [ ] 다시 클릭 또는 해제 → 전체 목록

**스크린샷:** `20260601_AliaBot_태그필터.png`

---

### Step 7. STT (Web Speech API)

- [ ] 마이크 1회 발화 후 자동 종료 (`continuous: false`)
- [ ] [추가] 버튼 정상 동작 (이전 버그 재발 없음)

**스크린샷:** (선택) `20260601_AliaBot_STT.png`

---

## 4. 문제 발생 시 기록 템플릿

```markdown
### Issue #N: [한 줄 요약]
- **증상:**
- **재현 단계:**
- **Console 로그:** (전문 붙여넣기)
- **스크린샷:** Docs/Screenshots/202606/...
- **가설:**
- **시도한 해결:**
- **최종 원인:**
- **해결:**
- **학습/FAQ:**
```

---

## 5. Cursor 세션 기록 (이번 대화)

| 항목 | 경로/방법 |
|---|---|
| 대화 원본 (JSONL) | `C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts\<uuid>\<uuid>.jsonl` |
| UI에서 열기 | Cursor 좌측 **Chat History** |
| 프로젝트 지식 | `docs/`, `outputs/` (Git으로 버전 관리) |

> Cursor는 Antigravity의 `overview.txt`처럼 프로젝트 폴더에 대화를 자동 저장하지 않습니다.  
> **VTL/VSOP을 outputs에 두는 것이 장기 보존의 핵심**입니다.

---

## 6. 검증 결과 요약 (업데이트용)

| 구분 | 상태 | 날짜 | 비고 |
|---|---|---|---|
| 정적 코드 리뷰 | **PASS** | 2026-06-01 | Cursor Agent |
| 런타임 검증 | **PENDING** | | 사용자 `npm run dev` 후 체크리스트 실행 |

---

## 7. 다음 액션

1. VSOP 따라 로컬 검증 완료 → 본 문서 Section 6 PASS/FAIL 갱신
2. 전체 PASS 시: `feature-ai-routing` commit (배포 보류)
3. Phase 5.3 별도 VTL 생성 (Notion Export)
