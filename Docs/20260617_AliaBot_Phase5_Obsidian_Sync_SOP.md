---
title: "VSOP: Obsidian Sync — OneDrive 기반 다중 프로젝트 문서 동기화 표준 절차"
date: 2026-06-17
type: sop
category: AliaBot
subcategory: Phase5/ObsidianSync
tags: [sop, vsop, non-developer, obsidian, sync, powershell, file-hash, multi-project]
created: 2026-06-17
ai_model: Gemini (Antigravity)
related_vtl: Docs/20260617_AliaBot_Phase5_Obsidian_Sync_VTL.md
summary: "비개발자 사용자가 새로운 프로젝트(예: Tomato Product auto survey 등)를 진행할 때, 프로젝트의 Docs 폴더 내 문서들을 OneDrive Obsidian Vault로 안전하게 실시간 미러링 동기화하기 위한 파워쉘 스크립트 설정 및 실행 절차"
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# VSOP: Obsidian Sync — OneDrive 기반 다중 프로젝트 문서 동기화 표준 절차

> **적용 대상**: 비개발자 사용자 및 협업 에이전트  
> **소요 시간**: 최초 설정 5분 (이후 실행 시 원클릭 2초)  
> **준비물**: Windows PowerShell, OneDrive에 연동된 Obsidian Vault 경로  

---

## 1. 개요 및 목적 (Overview)
본 지침서는 로컬 개발 환경의 파일 잠금 충돌을 회피하면서, 프로젝트의 문서 산출물(`Docs/`)만 실시간으로 안전하게 OneDrive Obsidian Vault로 실시간 미러링(동기화)하는 절차를 정의합니다. 이 규칙은 현재 `AliaBot`뿐만 아니라 **Tomato Product auto survey** 등 향후 진행할 모든 신규 프로젝트에 동일하게 적용됩니다.

---

## 2. 신규 프로젝트 적용 Step-by-Step 절차 (Configuration)

### Step 1. 프로젝트 폴더 내 Docs 폴더 및 스크립트 준비
1. 신규 프로젝트 폴더(예: `C:\Users\eugene\Projects\Tomato_Survey`) 하위에 `Docs` 폴더를 생성합니다.
2. 기존 `AliaBot` 프로젝트에 있는 `Docs/sync-to-obsidian.ps1` 파일을 복사하여 신규 프로젝트의 `Docs` 폴더에 붙여넣습니다.

### Step 2. 스크립트 경로 변수 수정
복사한 `sync-to-obsidian.ps1` 파일을 메모장이나 VS Code로 열어 상단의 **원본 경로($Src)**와 **대상 경로($Dst)**를 해당 프로젝트에 맞게 수정합니다.

* **수정 전 (AliaBot 기준)**:
  ```powershell
  $Src = "C:\Users\eugene\Projects\Work01_Anti\Docs"
  $Dst = "C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\AliaBot_Docs"
  ```
* **수정 후 (Tomato Survey 기준 예시)**:
  ```powershell
  $Src = "C:\Users\eugene\Projects\Tomato_Survey\Docs"
  $Dst = "C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\Tomato_Docs"
  ```
  > [!IMPORTANT]
  > 대상 경로 `$Dst` 끝에 프로젝트별 전용 폴더명(예: `Tomato_Docs`)을 새롭게 지정해 주어야 옵시디언 금고 안에서 문서들이 섞이지 않고 질서 있게 분리됩니다.

### Step 3. 스크립트 실행 권한 허용 (최초 1회)
Windows 보안 정책상 파워쉘 스크립트 실행이 차단되어 있을 수 있습니다.
1. Windows 검색창에 `PowerShell`을 입력한 뒤 **관리자 권한으로 실행**합니다.
2. 아래 명령어를 입력하고 실행하여 로컬 스크립트 실행 권한을 해제합니다:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   ```

### Step 4. 문서 작성 및 원클릭 동기화 실행
1. 프로젝트의 `Docs/` 폴더 내에 마크다운 문서(VTL, SOP 등)를 자유롭게 작성합니다.
2. 작업이 종료되는 시점에 `sync-to-obsidian.ps1` 파일에 마우스 우클릭을 하고 **[PowerShell에서 실행]**을 선택합니다.
3. 스크립트가 실행되면서 새로 작성되거나 수정된 파일만 해시(Hash) 비교를 통해 옵시디언으로 초고속 미러링됩니다.

---

## 3. 🚨 동기화 운영 가이드라인 & 문제 대처 (FAQ)

| 증상 | 원인 | 해결 및 예방 조치 |
|---|---|---|
| **옵시디언 내에서 문서 링크가 깨집니다.** | 문서 이름을 변경하여 백링크 주소가 어긋남 | 문서 최상단 프론트메터(Frontmatter) 영역에 `aliases: [구문서명]` 혹은 고유 ID를 추가하여 옵시디언의 자동 추적을 유지합니다. |
| **스크립트가 즉시 닫히고 복사가 안 됩니다.** | 파워쉘 실행 정책(Execution Policy) 제한 | 스크립트를 마우스 우클릭으로 실행하지 말고, 터미널에서 `powershell -ExecutionPolicy Bypass -File .\sync-to-obsidian.ps1` 명령어로 우회 실행합니다. |
| **코드 파일(.py, .js)도 복사해야 하나요?** | 옵시디언 볼트 오염 우려 | 옵시디언은 순수 지식 저장소(PKM)이므로 코드 파일은 복사하지 않습니다. 코드 공유는 **GitHub 웹 링크**를 본문에 참조 형식으로 남기는 것이 원칙입니다. |
| **중복 파일이 또 생겼습니다.** | 과거 수동으로 복사해 둔 루트 경로 파일 잔재 | 본 문서의 정리 스크립트를 참고하거나 수동으로 최상위 루트 폴더 내 동일 파일명을 청소하여 `AliaBot_Docs/` 내부의 본문만 참조되도록 단일화합니다. |

---

## 4. 🤖 다중 AI 에이전트 및 Codex/Copilot 환경 메모리 승계 지침 (Multi-Agent & Codex Memory Inheritance)

새로운 프로젝트(예: Tomato Product auto survey)를 진행할 때 Antigravity뿐만 아니라 OpenAI Codex, GitHub Copilot, Claude Code 등 타사 에이전트를 혼용하더라도, 마크다운 문서에 기반한 규칙 상속이 가능하도록 아래와 같이 설정해 줍니다.

### 4.1 에이전트별 브릿지 파일(Bridge File) 구성
각 개발 도구가 프로젝트 진입 시 최우선으로 읽는 설정 파일에 `Docs/Agent_Memory.md`를 링크 연동합니다.

1. **OpenAI Codex / GitHub Copilot**
   - **조치**: 프로젝트 최상위 루트에 `.github/` 폴더를 생성하고, 그 안에 **`copilot-instructions.md`** 파일을 작성합니다.
   - **내용**: `Please read and follow the instructions in Docs/Agent_Memory.md and Docs/Session_SOP_Guidelines.md before modifying any files.`
2. **Claude Code**
   - **조치**: 프로젝트 최상위 루트에 **`CLAUDE.md`** 파일을 생성합니다.
   - **내용**: 동일하게 `Docs/Agent_Memory.md`를 가장 먼저 읽고 해당 지침에 명시된 규칙을 따르도록 지정합니다.
3. **Cursor (Composer)**
   - **조치**: 프로젝트 최상위 루트에 **`.cursorrules`** 파일을 생성합니다.
   - **내용**: `Docs/Agent_Memory.md`를 마스터 컨텍스트 소스로 설정하고 파일 변경 및 분석 시 이를 반영하게 합니다.

### 4.2 새 세션 시작 시 프라이밍(Priming) 프롬프트 실행
새로운 대화 세션을 열 때는 에이전트의 메모리가 비어 있으므로, 첫 대화 프롬프트에 명시적으로 아래 키워드를 입력해 주어야 합니다.

> **"프로젝트 마스터 메모리인 `Docs/Agent_Memory.md`와 `Docs/Session_SOP_Guidelines.md`를 최우선으로 정독(Parse)하고, 오늘 개발할 아키텍처와 전역 룰(한글 병기 규칙)을 승계받아 시작해 줘."**
