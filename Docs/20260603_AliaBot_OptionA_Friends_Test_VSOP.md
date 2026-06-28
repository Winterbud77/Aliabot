---
title: "VSOP: AliaBot Option A — 지인 테스트 배포 (상세 절차)"
date: 2026-06-03
type: sop
category: AliaBot
subcategory: OptionA-Friends-Test
tags: [aliabot, sop, vsop, firebase, blaze, allowlist, deploy, non-developer]
created: 2026-06-03
ai_model: Cursor Agent (Composer)
related_vtl: Outputs/20260603_AliaBot_OptionA_Friends_Test_VTL.md
summary: "호스트 Gemini + 이메일 allowlist — Copy-Item .env, Secret, deploy (--set 없음), Vercel"
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# VSOP: AliaBot Option A — 지인 테스트 배포

> **대상:** 호스트 Gemini 1개로 지인 소수 테스트 (public 런칭 아님)  
> **소요:** 최초 30~45분 (Blaze 업그레이드 포함)  
> **준비물:** Google 계정, Gemini API 키(AI Studio), 초대할 지인 Google 이메일 목록

**관련 TechLog:** [20260603_AliaBot_OptionA_Friends_Test_VTL.md](./20260603_AliaBot_OptionA_Friends_Test_VTL.md)

---

## 0. Google 계정만 가능한 이유

AliaBot은 **Google 로그인만** 지원합니다.

| 계정 | allowlist 등록 |
|------|----------------|
| `you@gmail.com` | ✅ |
| `name@company.com` (Google Workspace) | ✅ |
| Kakao / Apple / 이메일·비밀번호 | ❌ (로그인 UI 없음) |

---

## Step 1. Firebase CLI · 프로젝트 (최초 1회)

**PowerShell** — 프로젝트 루트:

```powershell
cd C:\Users\eugene\Projects\Work01_Anti
npm install -g firebase-tools
firebase login
firebase use react-todo-d3fcc
```

- `firebase login` → 브라우저에서 Google 로그인
- `Now using project react-todo-d3fcc` 확인

---

## Step 2. Blaze 업그레이드 (Option A 필수, 최초 1회)

Cloud Functions + Secret Manager는 **Spark(무료) 불가**, **Blaze(종량제)** 필요.

1. 브라우저: https://console.firebase.google.com/project/react-todo-d3fcc/usage/details
2. **Upgrade** / **Modify plan** → **Blaze** 선택
3. **결제 수단(카드)** 등록

> Blaze = 무제한 과금이 아님. 지인 소수 테스트는 무료 할당량 안에서 **$0에 가까운 경우**가 많음.  
> Console → Usage and billing → 예산 알림 설정 권장.

---

## Step 3. allowlist — `functions/.env` 파일 만들기

### 3.1 파일 복사 (터미널 명령)

```powershell
cd C:\Users\eugene\Projects\Work01_Anti
Copy-Item functions\.env.example functions\.env
```

> **`functions/.env.example`는 터미널에 붙여넣는 명령이 아닙니다.**  
> 위 `Copy-Item`으로 **파일을 하나 만든 뒤** 내용을 편집합니다.

### 3.2 파일 내용 편집

```powershell
notepad functions\.env
```

**메모장에 아래처럼 작성** (지인 이메일을 실제 주소로 바꿈):

```env
ALLOWED_EMAILS=trekker6188@gmail.com,지인1@gmail.com,지인2@gmail.com
```

**규칙**

- 본인 + 초대할 지인 **전원** 포함
- **쉼표(,)** 로만 구분 — **띄어쓰기 없음**
- `GEMINI_API_KEY=` 줄은 **지워도 됨** (다음 Step에서 Secret으로 등록)

### 3.3 Git 주의

`functions/.env`는 **Git에 올리지 않음** (비밀·개인정보).

---

## Step 4. Gemini API 키 — Firebase Secret 등록

### 4.1 키 발급 위치

- **Firebase Console이 아님**
- [Google AI Studio → API keys](https://aistudio.google.com/apikey) → Create API key → `AIza...` 복사

(AliaBot Settings에 이미 넣은 키가 있으면 **동일 키** 사용 가능)

### 4.2 Secret 등록 (터미널)

```powershell
cd C:\Users\eugene\Projects\Work01_Anti
firebase functions:secrets:set GEMINI_API_KEY
```

- 실행 후 **입력 프롬프트**가 뜸 → `AIza...` 키 **붙여넣기** → Enter
- **`GEMINI_API_KEY`는 Secret 이름(라벨)** — 명령줄에 키 전체를 쓰지 않음

### 4.3 등록 확인 (선택)

```powershell
firebase functions:secrets:access GEMINI_API_KEY
```

값이 출력되면 등록 성공.

### 4.4 Blaze 미업그레이드 시 오류

```
Your project react-todo-d3fcc must be on the Blaze (pay-as-you-go) plan
```

→ **Step 2** Blaze 완료 후 **Step 4.2** 다시 실행.

---

## Step 5. Functions 배포 (`--set` 사용하지 않음)

```powershell
cd C:\Users\eugene\Projects\Work01_Anti
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

**중요**

- allowlist는 **Step 3**의 `functions/.env`에서 읽음
- **`--set ALLOWED_EMAILS=...` 붙이지 않음** (CLI 오류: `unknown option '--set'`)
- `npm warn EBADENGINE` (Node 22 vs 20) → **경고만**, deploy 계속 가능

배포 성공 시 Functions 목록에 `analyzeMemoWithGemini`, `gateFriendSignIn` 표시.

---

## Step 6. Blocking Function 등록 (Console, deploy 후 1회)

1. [Firebase Console](https://console.firebase.google.com/project/react-todo-d3fcc/authentication/settings) → **Authentication**
2. **Settings** → **Blocking functions**
3. **Before sign-in** → **`gateFriendSignIn`** 선택 → **Save**

→ allowlist **밖** Google 계정 로그인 **서버에서 차단**.

---

## Step 7. Vercel 환경변수 (클라이언트 allowlist)

1. [Vercel Dashboard](https://vercel.com) → AliaBot 프로젝트 → **Settings** → **Environment Variables**
2. 추가:

| Name | Value |
|------|--------|
| `VITE_ALLOWED_EMAILS` | `trekker6188@gmail.com,지인1@gmail.com,...` (**Step 3과 동일**) |

3. **Save** → **Deployments** → 최신 배포 **Redeploy**

---

## Step 8. 지인 안내

1. `https://aliabot.vercel.app` 접속
2. **초대된 Google 계정**으로 로그인
3. Settings에 Gemini 키 **입력 불필요** (호스트 AI 자동)
4. PWA 업데이트 시: 홈 화면 아이콘 삭제 → 재설치

---

## Step 9. 지인 이메일 추가 (이후)

1. `functions/.env` → `ALLOWED_EMAILS`에 이메일 추가
2. `notepad functions\.env` 저장
3. 재배포:

```powershell
cd C:\Users\eugene\Projects\Work01_Anti
firebase deploy --only functions
```

4. Vercel `VITE_ALLOWED_EMAILS`도 **동일하게** 수정 → **Redeploy**

---

## Step 10. 검증 체크리스트

- [ ] allowlist **밖** Google 계정 → 로그인 거부
- [ ] allowlist **안** 계정 → 로그인 성공
- [ ] 메모 추가 → Gemini 키 없이 태그/요약 표시
- [ ] Firestore `users/{uid}/todos` — 본인 데이터만 접근

---

## 부록 A. Cursor 대화 저장 위치 (탐색기)

| 구분 | 경로 |
|------|------|
| **Agent transcript (JSONL)** | `C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts\<uuid>\<uuid>.jsonl` |
| **탐색기로 폴더 열기** | `explorer "C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts"` |
| **UI** | Cursor 좌측 Chat History |
| **장기 보존 (Git)** | `Outputs/` VTL·VSOP (본 문서) |

---

## 부록 B. Spark vs Blaze (한눈에)

| 기능 | Spark | Blaze |
|------|-------|-------|
| Google 로그인 + Firestore | ✅ | ✅ |
| Cloud Functions | ❌ | ✅ |
| Secret (`GEMINI_API_KEY`) | ❌ | ✅ |
| **Option A** | ❌ | ✅ |
| **Option B (각자 API 키)** | ✅ | ✅ |
