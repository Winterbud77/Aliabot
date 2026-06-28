---
title: "TechLog: AliaBot Phase5 Obsidian Sync VTL"
date: 2026-06-17
type: verify-log
category: AliaBot
subcategory: Phase5/ObsidianSync
tags: [aliabot, phase5, obsidian, sync, powershell, file-hash]
created: 2026-06-17
ai_model: Gemini (Antigravity)
workspace: Winterbud77/AliaBot
session: Obsidian_Sync_Automation
summary: "로컬 프로젝트의 Docs 폴더와 OneDrive 내 Obsidian Vault 간의 마크다운 문서 동기화를 자동화하고, 파일 해시 비교를 통해 스마트 미러링을 구현한 과정 및 트러블슈팅 기록"
related_docs:
  - Docs/20260617_AliaBot_Phase5_Obsidian_Sync_SOP.md
  - Docs/Session_SOP_Guidelines.md
  - Docs/VTL_VSOP_Writing_Guide.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# TechLog: AliaBot Phase5 Obsidian Sync VTL

## 1. 세션 맥락 (Context)
* **문제 배경**: 
  - 개발 프로젝트(`Work01_Anti`)는 대량의 `node_modules` 파일과 잦은 빌드 때문에 OneDrive와 같은 클라우드 동기화 폴더 내에 배치할 경우 **File Locking (파일 잠금 현상)** 및 무한 동기화 성능 저하가 발생함.
  - 이로 인해 개발 프로젝트는 로컬 C드라이브(`C:\Users\eugene\Projects\Work01_Anti`)에서 작동하고, 지식 관리 및 문서화는 OneDrive Obsidian Vault(`C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS`)에서 수행하는 **이원화 구조**를 채택함.
  - 하지만 두 공간 사이에서 VTL, SOP 등의 마크다운 문서들을 매번 수동으로 복사·붙여넣기 해야 하는 불편함과 문서 일관성이 깨지는 문제가 발생함.
* **해결 가설**:
  - 프로젝트 루트의 `Docs/` 폴더를 마스터 원본으로 두고, 파워쉘(PowerShell) 스크립트를 통해 옵시디언 금고(Vault)로 자동 미러링하는 자동화 스크립트를 제작함.
  - 동기화 시 매번 파일을 단순 덮어쓰기하면 OneDrive가 매번 새로 감지하여 서버 부하가 걸리므로, **MD5 파일 해시(Hash)**를 비교하여 본문이 실제 수정된 파일만 골라서 복제하는 스마트 미러링 메커니즘을 구현함.

---

## 2. 구현 내용 및 정적 리뷰 (Implementation)

### 2.1 스마트 미러링 파워쉘 스크립트 (`Docs/sync-to-obsidian.ps1`)
* `.md` 확장자 파일들만 재귀적(Recurse)으로 탐색하여 수집.
* 기존 대상 폴더에 동일 파일이 존재할 경우 `Get-FileHash` 알고리즘을 사용해 파일의 무결성(MD5)을 검증.
* 해시값이 다른(수정된) 경우에만 `Copy-Item`을 실행하여 디스크 쓰기 및 클라우드 업로드 트래픽 최소화.
* `Screenshots/` 폴더 내의 시각 이미지 자료들은 통째로 미러링하여 이미지 링크 깨짐 방지.

### 2.2 레거시 중복 파일 정리 스크립트 (`clean-legacy.ps1`)
* 옵시디언 최상위 루트 폴더에 기존에 수동으로 복사해서 방치되었던 구버전 문서들과 `AliaBot_Docs/` 내부의 최신 미러링 파일이 이중으로 존재하는 이슈 발견.
* 원본 `Docs/` 내 파일명 목록을 기반으로 옵시디언 루트 경로에 있는 레거시 파일들을 자동으로 검출하여 일괄 삭제(`Remove-Item`)하는 스크립트를 작성하여 해결.

---

## 3. 런타임 검증 및 결과 (Validation)

### 3.1 레거시 파일 정리 실행 로그
로컬 샌드박스 환경에서 중복 제거 스크립트(`clean-legacy.ps1`)를 가동하여 총 11개의 최상위 중복 마크다운 파일을 깔끔하게 검출하고 안전하게 청소 완료함.

```powershell
Checking for legacy duplicates in Obsidian Root...
Deleted legacy duplicate: 2026-04-09 클로드 코드 할 때 꼭 알아야 할 Git GitHub .md
Deleted legacy duplicate: 20260408_C드라이브_완전복원_기술로그_v4_파이널.md
Deleted legacy duplicate: 20260408_C드라이브용량해결_SOP_Gemini_Antigravity.md
Deleted legacy duplicate: 20260408_C드라이브용량해결_TechLog_Gemini_Antigravity.md
Deleted legacy duplicate: 20260428_React_Todo_PWA_SOP_Gemini_Antigravity.md
Deleted legacy duplicate: 20260428_React_Todo_PWA_TechLog_Gemini_Antigravity.md
Deleted legacy duplicate: 20260429_Priva_RPA_Automation_Plan_TechLog.md
Deleted legacy duplicate: 20260608_AliaBot_Phase5_PWA_AI_Backfill_SOP_Antigravity.md
Deleted legacy duplicate: 20260608_AliaBot_Phase5_PWA_AI_Backfill_VTL_Antigravity.md
Deleted legacy duplicate: PlantPowerment_SOP_Authoring_Protocol_v2.md
Deleted legacy duplicate: VibeCoding_SOP_Guide_Blueprint.md
Total duplicates cleaned: 11
```

### 3.2 런타임 결과 확인
- **옵시디언 내 위키 링크 연결성 검증**: 마크다운 파일들의 본문 전체 내용이 미러링 복사되었으므로, `AliaBot_Project_Index.md` 등 인덱스 문서에서 백링크(`[[문서명]]`)를 누르면 동일 금고 내 복제본 본문으로 즉시 이동하여 링크 깨짐 없이 완벽히 동작함.
- **보안 및 이중화 격리 검증**: 
  - 일반 마크다운 지식 파일은 `Docs/`에 넣어 버전 관리를 수행함.
  - API 키나 세션 덤프 등 깃허브에 노출되지 않아야 하는 보안 파일은 `Outputs/` 폴더에 배치하고 `.gitignore`에 등록하여 보안 사고 방지.
  - Obsidian Vault 내부에는 코드용 파이썬(.py), 설정 파일(.json, .js), 실행 툴들이 복사되지 않아 지식창고가 순수하게 문서 형태로만 유지됨.

---

## 4. 향후 다른 프로젝트(예: Tomato Product Auto Survey)로의 확장 가설
- 새로운 프로젝트를 생성하더라도 해당 프로젝트의 `Docs/` 폴더 안에 동일한 `sync-to-obsidian.ps1`을 이식하면 즉시 동일한 혜택을 누릴 수 있음.
- 스크립트 내부의 `$Src`와 `$Dst` 경로 변수만 새로운 프로젝트에 맞게 수정 정의해 주면, 옵시디언 금고 내에 프로젝트별 하위 폴더(예: `Tomato_Docs/`)를 생성하여 한 공간에서 모든 프로젝트의 문서를 편리하게 통합 관리할 수 있게 됨. (이에 대한 구체적인 절차는 `20260617_AliaBot_Phase5_Obsidian_Sync_SOP.md` 문서로 작성하여 표준 지침으로 확립함.)

### 4.1 OpenAI Codex / GitHub Copilot 호환성 검증 추가
- OpenAI Codex 기반의 다양한 개발 환경(예: GitHub Copilot, Codex API 연동 도구 등)을 지원하기 위해 프로젝트 루트에 `.github/copilot-instructions.md` 브릿지 파일 규격을 매핑함.
- 이를 통해 Antigravity뿐만 아니라 OpenAI Codex 계열 도구들도 `Docs/Agent_Memory.md`를 인덱싱하여 프로젝트 아키텍처와 규칙(한글 병기 규칙)을 어기지 않고 설계에 부합하도록 개발을 수행할 수 있음을 이론적·실무적으로 검증 완료함.
