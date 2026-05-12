---
title: "SOP: Vite+React PWA 필수 에셋(아이콘) 적용 및 설치 버튼 활성화 지침 - Gemini (Antigravity)"
date: 2026-04-28
type: note
category: 프론트엔드개발
subcategory: PWA관리
tags: [troubleshooting, pwa, react, format/tutorial]
created: 2026-04-28
ai_model: Gemini 3.1 Pro (Low) (Antigravity)
workspace: Winterbud-03MS
summary: "React 웹앱을 PWA로 만들 때 'Install' 버튼이 나타나지 않는 근본 원인(아이콘 누락)을 해결하고, 터미널 복사 에러를 우회하는 Node.js 스크립트 작성법을 안내합니다."
---

# 📋 [SOP] Vite+React PWA 필수 에셋 적용 및 설치 활성화 지침

웹 애플리케이션을 바탕화면 앱처럼 설치할 수 있게 해주는 PWA(Progressive Web App) 기능 적용 시, 코드(`manifest.json`, `sw.js`)가 완벽해도 화면에 설치 버튼이 뜨지 않을 때의 해결 지침입니다.

---

## 🔍 Step 1. 문제 증상 및 진단 (Diagnosis)

코드상 오류가 없는데도 PWA 설치 버튼이나 주소창 아이콘이 나타나지 않는다면, **100% 필수 아이콘 파일 누락** 때문입니다. Chrome 등 현대 브라우저는 정해진 사이즈의 아이콘 파일이 없으면 앱을 설치 가능한 상태로 인식하지 않습니다.

- 프로젝트의 `public` 폴더 안에 `logo192.png`와 `logo512.png` 파일이 존재하는지 직접 확인하세요.
- 크롬 브라우저 [개발자 도구(F12)] -> [Network] 탭에서 해당 이미지 파일이 404 에러를 뿜거나 `text/html` (HTML 문서)로 응답되고 있는지 체크합니다.

---

## 🚀 Step 2. 해결 방법: Node.js 파일 강제 복사 스크립트

터미널에서 `copy` 또는 `Copy-Item` 명령어가 버전에 따라 실패하거나 권한 문제로 무시되는 현상을 피하기 위해, Node.js의 강력한 파일 조작 기능을 활용합니다.

1.  프로젝트 최상위 폴더에 `copy_icons.js`라는 이름으로 파일을 만듭니다.
2.  아래의 코드를 복사해서 붙여넣습니다. (경로는 실제 상황에 맞게 수정합니다)

```javascript
const fs = require('fs');
const path = require('path');

// 원본 이미지 파일 경로 (이미지가 있는 곳)
const src = "C:\\원본_폴더_경로\\todo_app_icon.png";
// PWA 아이콘이 들어갈 실제 프로젝트 public 폴더 경로
const destDir = "C:\\Users\\eugene\\Projects\\Work01_Anti\\public";

const targets = ['logo192.png', 'logo512.png', 'favicon.ico'];

targets.forEach(target => {
  const dest = path.join(destDir, target);
  try {
    // 파일을 동기 방식으로 확실하게 복사
    fs.copyFileSync(src, dest);
    console.log(`성공: ${src} -> ${dest}`);
  } catch (err) {
    console.error(`복사 에러 ${dest}:`, err);
  }
});
```

3.  터미널을 열고 다음 명령어를 실행합니다.
```bash
node copy_icons.js
```

---

## ✅ Step 3. 최종 검증 및 적용 (Verification)

1. 스크립트 실행 후 `public` 폴더에 세 개의 파일(`logo192.png`, `logo512.png`, `favicon.ico`)이 정상적으로 생성되었는지 확인합니다.
2. 브라우저 창을 띄우고 **강력 새로고침(`Ctrl` + `F5`)**을 누릅니다.
3. 약 5~10초 정도 기다리면 PWA 서비스 워커가 아이콘을 백그라운드에서 다운로드하여 인식하고, 주소창에 앱 설치 아이콘이 정상적으로 활성화됩니다.

---

### 📌 향후 주의 사항
- Windows PowerShell 환경에서는 `&&` 같은 명령어 연결자나 단순 `copy` 명령어가 예기치 않게 실패하는 경우가 많습니다. 다중 파일 처리나 시스템 간 복사 시 Node.js 환경의 파일 시스템 모듈(`fs`)을 스크립트로 작성하여 사용하는 것이 가장 우회하기 좋고 확실한 방법입니다.

---

## 🤖 Step 4. [Conductor] 다중 AI 모델 및 세션 협업 가이드

Antigravity 인터페이스 내에서 여러 AI 모델(Gemini, ChatGPT, Claude)을 활용하여 복합적인 기능을 개발할 때 지켜야 할 표준 운영 절차입니다.

### 1. 모델 전환 및 세션 관리 (Session Management)
- **단일 세션 내 모델 전환:** 한 대화창 안에서 모델만 바꾸는 경우, Antigravity가 이전 대화 로그(`overview.txt`)를 새 모델에게 자동 주입하므로 맥락(Context)이 유지됩니다. (Master 브랜치 권장)
- **대화창(Session) 분리:** 주제별로 새로운 대화창을 생성하면, 각 세션의 대화 내용은 완벽하게 격리되지만 물리적 파일은 공유됩니다. (기능별 브랜치 필수)

### 2. 브랜치 전략 (Branching Strategy)
- **기능별 브랜치 할당:** 
  - 세션 A (Claude 담당) -> `feature-logic` 브랜치
  - 세션 B (ChatGPT 담당) -> `feature-ui` 브랜치
- **병합 및 통합:** 각 브랜치에서 작업 완료 후 Master 브랜치로 Merge하며, 최종 검토는 가장 고성능 모델(Pro High 등)을 사용하여 코드 충돌을 해결합니다.

### 3. 지식 공유 표준 (Knowledge Synchronization)
- 세션 간 대화는 단절되어 있으므로, 반드시 **Implementation Plan**과 **Walkthrough** 문서를 최신 상태로 유지하여 다른 세션의 모델이 현재 프로젝트의 '물리적 상태'를 이해하게 해야 합니다.

---

**최종 작성자:** AliaBot Conductor (Gemini Antigravity)  
**업데이트 일자:** 2026-05-12
