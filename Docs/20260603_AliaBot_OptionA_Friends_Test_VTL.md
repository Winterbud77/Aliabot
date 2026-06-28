---
title: "TechLog: AliaBot Option A — 지인 테스트 배포 (allowlist · Blaze · deploy 트러블슈팅)"
date: 2026-06-03
type: tech-log
category: AliaBot
subcategory: OptionA-Friends-Test
tags: [aliabot, firebase, blaze, allowlist, functions, secrets, vercel, deploy, cursor-session]
created: 2026-06-03
ai_model: Cursor Agent (Composer)
workspace: Work01_Anti
session: 433b6127-d081-4bf8-bc96-95c37d0f6df1
summary: "Option A 배포 중 allowlist .env 설정, --set CLI 오류, GEMINI Secret, Blaze 요금제 이슈 정리"
related_docs:
  - Outputs/20260603_AliaBot_OptionA_Friends_Test_VSOP.md
  - Docs/OptionA_Friends_Test_VSOP.md
  - Docs/Session_SOP_Guidelines.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# VTL: AliaBot Option A — 지인 테스트 배포

---

## 1. 배경 (Context)

| 항목 | 내용 |
|------|------|
| 목표 | **Option A**: 호스트 Gemini API 1개 + Google 이메일 allowlist로 지인 소수 테스트 |
| URL | `https://aliabot.vercel.app` |
| Firebase 프로젝트 | `react-todo-d3fcc` |
| 호스트 | `trekker6188@gmail.com` |
| 세션 | Cursor Agent 대화 — Firebase CLI deploy 진행 중 |

---

## 2. Cursor 대화 저장 위치 (탐색기에서 찾기)

> **원칙:** Cursor 대화는 **프로젝트 Git 폴더(`Work01_Anti`) 안에 자동 저장되지 않습니다.**  
> 장기 보존은 **`Outputs/` VTL·VSOP** + (선택) agent-transcripts 복사.

### 2.1 UI에서 보기

- Cursor 좌측 **Chat History** (프로젝트별 대화 목록)

### 2.2 Agent transcript (JSONL) — **탐색기 경로 (권장)**

**이번 세션 포함, Work01_Anti 프로젝트 Agent 대화 원본:**

```
C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts\
```

| 세션 UUID (폴더명) | 파일 |
|--------------------|------|
| `433b6127-d081-4bf8-bc96-95c37d0f6df1` | Option A deploy · allowlist · Blaze (본 세션) |
| `35b6e90b-79f5-4bc6-ab4f-d9d1a41191dc` | (이전 세션) |
| `6e985879-ab6a-4a4d-a2d0-83cd1ee08a40` | (이전 세션) |
| `c085931a-ed7f-41f2-a68d-4b4817f80e0b` | (이전 세션) |

**탐색기 열기 (PowerShell):**

```powershell
explorer "C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts"
```

각 폴더 안 `<uuid>.jsonl` — 한 줄당 JSON 이벤트 (Git 미포함).

### 2.3 Cursor 앱 데이터 (참고)

| 경로 | 용도 |
|------|------|
| `C:\Users\eugene\AppData\Roaming\Cursor\` | 앱 설정·캐시·Local Storage (UI 대화 일부) |
| `C:\Users\eugene\.cursor\projects\` | **프로젝트별** agent-transcripts, terminals, MCP |
| `C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\terminals\` | 터미널 출력 스냅샷 (`3.txt` 등) |

### 2.4 프로젝트 지식 (Git 보존)

| 경로 | 용도 |
|------|------|
| `Outputs/` | **VTL, VSOP** — 이번 문서 |
| `Docs/` | 설계·가이드 (Option A VSOP 등) |

---

## 3. 핵심 결론 (요약)

1. **allowlist는 2곳** — `functions/.env`의 `ALLOWED_EMAILS` + Vercel `VITE_ALLOWED_EMAILS` (동일 목록).
2. **`firebase deploy --set ALLOWED_EMAILS=...` 는 현재 CLI에서 불가** → `error: unknown option '--set'`.
3. **`.env.example`는 터미널 명령이 아님** — `Copy-Item`으로 `.env` 파일 생성 후 편집.
4. **`GEMINI_API_KEY`는 Secret 이름** — 값은 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급, `firebase functions:secrets:set` 프롬프트에 붙여넣기.
5. **Secret + Functions = Blaze 필수** — Spark에서 `secrets:set` 시 Blaze 업그레이드 오류 발생.

---

## 4. Issue 기록

### Issue #1: `error: unknown option '--set'`

| 항목 | 내용 |
|------|------|
| **증상** | `firebase deploy --only functions,firestore:rules --set ALLOWED_EMAILS="..."` 실행 시 `--set` 미지원 |
| **원인** | VSOP/초기 안내의 `--set` 플래그는 **현재 Firebase CLI 버전과 불일치** |
| **해결** | `functions/.env`에 `ALLOWED_EMAILS=...` 작성 후 **`--set` 없이** deploy |
| **FAQ** | allowlist 바꿀 때 → `.env` 수정 → `firebase deploy --only functions` |

### Issue #2: `.env.example`를 터미널에 붙여넣으려 함

| 항목 | 내용 |
|------|------|
| **증상** | `functions/.env.example` 문자열을 PowerShell에 입력하려 함 |
| **원인** | "복사해 `.env` 작성"을 **파일 생성 절차**로 이해하지 못함 |
| **해결** | 아래 명령 + notepad 편집 (VSOP Step 2 참고) |
| **FAQ** | 템플릿 = 파일 경로; 터미널에 넣는 건 `Copy-Item`, `firebase deploy` 등 **명령만** |

```powershell
Copy-Item functions\.env.example functions\.env
notepad functions\.env
```

### Issue #3: `GEMINI_API_KEY` — 이름 vs 실제 키

| 항목 | 내용 |
|------|------|
| **증상** | `secrets:access GEMINI_API_KEY`에 키 문자열을 넣어야 하는지 혼동 |
| **원인** | Secret **변수명**과 **값** 구분 필요 |
| **해결** | `secrets:set GEMINI_API_KEY` → 프롬프트에 `AIza...` 붙여넣기; 키는 **AI Studio**에서 발급 (Firebase Console 아님) |
| **FAQ** | `secrets:access` = 등록 여부 **확인**용 |

### Issue #4: Blaze 업그레이드 필요

| 항목 | 내용 |
|------|------|
| **증상** | `firebase functions:secrets:set GEMINI_API_KEY` → Blaze plan required |
| **터미널** | `Required API secretmanager.googleapis.com can't be enabled until the upgrade is complete` |
| **원인** | Spark(무료)는 Cloud Functions · Secret Manager **미지원** |
| **해결** | [Usage and billing](https://console.firebase.google.com/project/react-todo-d3fcc/usage/details) → **Blaze** + 결제 수단 → `secrets:set` 재시도 |
| **FAQ** | Blaze = 무제한 과금 아님; 무료 할당량 내 지인 테스트는 **$0에 가까운 경우 많음** |

---

## 5. Spark vs Blaze (AliaBot 관점)

| | Spark | Blaze |
|---|-------|-------|
| Auth + Firestore | ✅ | ✅ |
| Cloud Functions | ❌ | ✅ |
| Secret Manager | ❌ | ✅ |
| Option A (호스트 Gemini + allowlist) | ❌ | ✅ |
| Option B (각자 BYOK, Functions 없음) | ✅ | ✅ |

---

## 6. allowlist · Secret · env 역할 분리

| 저장소 | 변수/이름 | 넣는 값 | 역할 |
|--------|-----------|---------|------|
| `functions/.env` | `ALLOWED_EMAILS` | `you@gmail.com,friend@gmail.com` | Functions deploy 시 allowlist |
| Firebase Secret | `GEMINI_API_KEY` | `AIza...` (AI Studio) | 서버 Gemini 호출 |
| Vercel Env | `VITE_ALLOWED_EMAILS` | 위와 **동일** | 클라이언트 1차 검사 |

**규칙:** 쉼표 구분, **띄어쓰기 없음**. Google 로그인 **email** (Gmail·Workspace 모두 가능).

---

## 7. 진행 상태 (2026-06-03)

| 단계 | 상태 | 비고 |
|------|------|------|
| `functions/.env` (ALLOWED_EMAILS) | ✅ | 사용자 생성 |
| Firebase Blaze 업그레이드 | ⏸ | 사용자 결정/진행 대기 |
| `secrets:set GEMINI_API_KEY` | ❌ | Blaze 후 재시도 |
| `firebase deploy --only functions,firestore:rules` | ⏸ | Secret + Blaze 후 |
| Blocking fn `gateFriendSignIn` (Console) | ⏸ | deploy 후 |
| Vercel `VITE_ALLOWED_EMAILS` + Redeploy | ⏸ | |
| git push Option A 코드 | ⏸ | 로컬 변경 가능 |

---

## 8. 다음 액션

1. Blaze 업그레이드
2. VSOP **§3~§5** 순서대로 Secret → deploy → Console → Vercel
3. 검증 체크리스트 (VSOP §8)
4. `Docs/OptionA_Friends_Test_VSOP.md`의 잘못된 `--set` 문구는 **Outputs VSOP** 기준으로 대체 권장

---

## 9. 학습 FAQ (한 줄)

- **Q:** allowlist 어디? → **A:** `functions/.env` + Vercel `VITE_ALLOWED_EMAILS`.
- **Q:** `--set` 오류? → **A:** `.env` 쓰고 deploy만.
- **Q:** Gemini 키 어디서? → **A:** AI Studio; Firebase Secret에 저장.
- **Q:** Cursor 대화 어디? → **A:** `%USERPROFILE%\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts\`.
