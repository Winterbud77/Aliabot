# Option A: 지인 테스트 배포 VSOP

> 호스트 Gemini API 1개 + Google 이메일 allowlist  
> Functions와 Vercel 환경변수 설정 후 배포합니다.

---

## 0. Google 계정만? — 이유

AliaBot은 **Google 로그인만** 구현되어 있습니다 (`GoogleAuthProvider`).

allowlist는 **「@gmail.com만」** 이 아니라, **Google 로그인 시 Firebase가 받는 `email` 주소**를 검사합니다.

| 계정 예시 | allowlist 등록 |
|-----------|----------------|
| `you@gmail.com` | ✅ |
| `name@company.com` (Google Workspace) | ✅ |
| Kakao / Apple / 이메일·비밀번호 | ❌ (로그인 UI 자체 없음) |

---

## 1. Firebase Blaze 업그레이드 (최초 1회)

Cloud Functions + Secrets 사용을 위해 **Blaze(종량제)** 필요.  
무료 할당량 내 사용 시 청구 없이 운영 가능.

Firebase Console → 프로젝트 `react-todo-d3fcc` → Upgrade

---

## 2. Secrets · Allowlist 설정

PowerShell (프로젝트 루트):

```powershell
cd c:\Users\eugene\Projects\Work01_Anti
npm install -g firebase-tools
firebase login
firebase use react-todo-d3fcc
```

Gemini API 키 (호스트 1개):

```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

`functions/.env.example`를 복사해 `functions/.env` 작성 (로컬 deploy용):

```
ALLOWED_EMAILS=your@gmail.com,friend1@gmail.com,friend2@gmail.com
```

---

## 3. Functions · Firestore Rules 배포

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

배포 시 allowlist (Functions 쪽):

```powershell
firebase deploy --only functions --set ALLOWED_EMAILS="your@gmail.com,friend@gmail.com"
```

---

## 4. Blocking Function 등록 (allowlist 서버 차단)

1. Firebase Console → **Authentication** → **Settings** → **Blocking functions**
2. **Before sign-in** → `gateFriendSignIn` 선택·저장

---

## 5. Vercel 환경변수 (클라이언트 allowlist)

Vercel Dashboard → Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `VITE_ALLOWED_EMAILS` | `your@gmail.com,friend@gmail.com` (Functions와 동일) |

저장 후 **Redeploy**.

---

## 6. 지인 안내

1. `https://aliabot.vercel.app` 접속
2. **초대된 Google 계정**으로 로그인
3. Settings에 Gemini 키 **입력 불필요** (AI 자동)
4. PWA 업데이트 시: 기존 아이콘 삭제 → 재설치

---

## 7. 지인 이메일 추가 방법

1. `ALLOWED_EMAILS`에 이메일 추가
2. `firebase deploy --only functions --set ALLOWED_EMAILS="..."`
3. Vercel `VITE_ALLOWED_EMAILS` 동일하게 수정 → Redeploy

---

## 8. 검증 체크리스트

- [ ] allowlist **밖** Google 계정 → 로그인 거부
- [ ] allowlist **안** 계정 → 로그인 성공
- [ ] 메모 추가 → Gemini 키 없이 태그/요약 표시
- [ ] Firestore `users/{uid}/todos` 본인 데이터만 접근
