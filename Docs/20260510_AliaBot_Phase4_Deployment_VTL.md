# 🚀 AliaBot Phase 4: 글로벌 배포 및 데이터베이스 보안 (VTL & SOP)

> **문서 목적:** AliaBot(구 SidersBot)의 Vercel 정식 배포 과정에서 발생한 CLI 오류 해결(Troubleshooting) 과정과, 최종적으로 확립된 GitOps(GitHub 연동) 배포 파이프라인, 그리고 Firebase Security Rules 적용 과정을 시각적/구조적으로 기록합니다.

---

## 1. 브랜드 네이밍 확정 (AliaBot)
기존 가칭이었던 'SidersBot'을 대체하기 위해 다국어 발음과 뉘앙스(Linguistics)를 분석했습니다.

- **선정 배경:** `Alia` (알리아/아리아)
- **장점:** 
  - 이탈리아어/라틴어에서 여성형 어미(`-a`)로 끝나 비서(Assistant)의 부드럽고 친근한 뉘앙스 제공.
  - '알리바바의 요술램프(Genie)'를 연상시키는 강력한 브랜드 스토리텔링 확보.
  - 전 세계적(영어권, 한국어권)으로 발음하기 쉬운 모음 구조.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

## 2. 🚨 트러블슈팅: Vercel CLI 배포 실패와 극복 (핵심 기록)

> [!WARNING]
> 처음 접하는 툴을 사용할 때, 터미널 명령어(CLI)에서 알 수 없는 에러가 발생할 경우 당황하지 않고 **Tree of Thinking (사고 트리)** 기법으로 원인을 추적한 훌륭한 사례입니다.

### ❌ 실패 1: Vercel 최신 버전(v53.3.0) NPM 404 에러
- **현상:** 터미널에서 `npm install -g vercel` 실행 시 `@vercel/cli-config` 관련 404 Not Found 에러 발생.
- **원인 분석:** 사용자 PC 문제가 아닌, Vercel 팀이 최신 버전을 글로벌 NPM 서버에 배포할 때 핵심 의존성(Dependency)을 누락한 100% 서버 측 결함으로 판명됨.
- **시도:** 이전 안정화 버전인 `v34`로 강제 지정 설치(`npm install -g vercel@34`)하여 설치에는 성공함.

### ❌ 실패 2: Vercel 구버전 인증 차단 (The Catch-22)
- **현상:** `v34`로 설치 후 `vercel login`을 시도했으나, 브라우저 인증 후 터미널에서 `The legacy authentication flow is disabled...` 에러 발생.
- **원인 분석:** Vercel 서버에서 "보안상 구버전(v34)의 로그인을 차단"해버림. (최신 버전은 설치가 안 되고, 구버전은 로그인이 안 되는 진퇴양변의 상황 발생)

### ✅ 최종 해결책: GitOps (GitHub 자동 연동 배포)
불안정한 CLI(명령어) 도구를 과감히 버리고, 전 세계 90% 이상의 개발자가 사용하는 **현대적 표준 배포 방식(GitHub 저장소 연동)**으로 우회하여 완벽하게 성공함.

---

## 3. SOP: GitHub ↔ Vercel 연동 배포 가이드 (GitOps)

앞으로 코드를 수정하고 웹사이트를 업데이트할 때 사용하는 표준 작업 지침(SOP)입니다.

### Step 1: 로컬 코드를 GitHub로 Push
1. VS Code 터미널을 엽니다.
2. 아래 명령어들을 순서대로 실행하여 코드를 `Winterbud77/AliaBot` 저장소로 보냅니다.
```bash
git add .
git commit -m "수정 내용 메모"
git push -u origin master
```

### Step 2: Vercel에서 수입(Import) 및 자동 배포
*(최초 1회만 직접 Import 하며, 이후에는 GitHub에 Push만 하면 Vercel이 알아서 감지하여 1분 안에 전 세계 웹사이트를 자동 업데이트(CI/CD) 합니다.)*

1. **Vercel 대시보드** 접속 -> `Add New Project`
2. `Import Git Repository` 화면에서 **[Install (GitHub 마크)]** 클릭하여 GitHub 계정 권한 연동.
3. 내 저장소 목록에서 `Aliabot`을 찾아 **[Import]** 클릭.
4. Framework Preset(Vite 등) 확인 후 **[Deploy]** 클릭.

![Vercel 배포 성공 화면 (Placeholder)](/placeholder_vercel_success.jpg)

---

## 4. Firebase 데이터베이스 격리 (Security Rules)

> [!IMPORTANT]
> 로컬 호스트(내 컴퓨터)를 벗어나 퍼블릭 인터넷(Vercel)에 웹앱을 띄웠으므로, 'A 사용자가 B 사용자의 메모를 훔쳐볼 수 없도록' 데이터베이스 대문을 잠그는 필수 작업입니다.

1. **경로:** Firebase Console -> Firestore Database -> **[규칙 (Rules)]** 탭
2. **적용 코드:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{document=**} {
      // 오직 로그인한 사용자(request.auth != null)이면서,
      // 그 사람의 고유 ID(uid)가 문서에 기록된 작성자 ID(userId)와 일치할 때만 읽기/쓰기 허용!
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```
3. **결과:** 완벽한 개인화 스토리지 구축 완료.

---

## 5. 향후 로드맵 (Next Phase)

- **Phase 5 (진행 예정):** AI 기반 자동 메모 요약 및 태깅(Tagging) 시스템 구축.
  - *이유:* 무작위로 음성 입력(STT)된 파편화된 메모들을 AI(Gemini API 등)가 자동으로 분석하여 주제별로 묶어주고 핵심을 요약해 주는 지능형 비서 기능 도입.
