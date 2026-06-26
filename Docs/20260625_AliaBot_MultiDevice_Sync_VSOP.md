# 📋 SOP: 다중 기기(PC 2대 + 모바일) 옵시디언 동기화 표준 가이드라인 (VSOP)

---
title: "SOP: 다중 기기 옵시디언 동기화 표준 가이드라인 (VSOP)"
date: 2026-06-25
type: standard-procedure-log
category: Obsidian
subcategory: Sync
tags: [sop, obsidian, sync, onedrive, multi-device, backup]
---

> **목적 (Purpose)**:
> 랩탑, 데스크탑, 모바일 기기 간에 옵시디언(Obsidian) 노트를 실시간 동기화하여 사용할 때 발생할 수 있는 클라우드 파일 잠김 및 동기화 충돌(Sync Conflict) 현상을 완화하고, 안전하게 형상 관리를 동기화할 수 있는 기기 운영 절차를 정의합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① Cloud Sync Collision (클라우드 동기화 충돌)
원드라이브(OneDrive)와 같은 실시간 클라우드 업로더와 Git 버전 관리 엔진이 동일한 폴더 하위의 숨겨진 세부 조각 파일(`.git/` 내부 파일)들을 동시에 쓰고 읽으면서 기기 파일 시스템의 소유권(Lock)이 서로 충돌하는 현상입니다.

### ② Local Sandbox Isolation (로컬 샌드박스 격리)
모바일 운영체제(iOS/Android)가 애플리케이션의 보안을 위해 앱별로 할당한 격리된 안전한 저장 영역입니다. 원드라이브 전체 공유 폴더와 모바일 옵시디언이 직접 맞물리기 어려운 주된 시스템적 원인입니다.

---

## 2. 🗂️ 기기 구성별 표준 동작 시나리오 (Action Scenario)

### [시나리오 A] 현재의 OneDrive 환경을 유지하는 경우 (가장 간편)
현재 3대 기기(PC 2대 + 모바일)가 원드라이브를 통해 정상적으로 싱크가 맞춰지고 있다면 아래의 안전 수칙을 준수하여 운용합니다.

1. **Git 연동 배제**:
   - 원드라이브로 자동 동기화되고 있는 폴더 내부에서는 절대 Git 저장소(`git init`)를 생성하지 마십시오. 이중 백업 시스템이 충돌을 유발할 수 있습니다.
2. **동기화 지연 대기**:
   - 랩탑에서 메모를 편집한 뒤 컴퓨터를 덮기 전, 작업 표시줄의 원드라이브 아이콘에 **"동기화 완료"** 표시가 뜨는 것을 반드시 확인합니다.
   - 데스크탑을 켤 때는 원드라이브가 클라우드로부터 최신 메모를 다 다운로드할 때까지 10~20초 대기 후 옵시디언을 실행합니다.
3. **볼트 최상위 `.gitignore` 배치 (잠김 방지 필수 조치)**:
   - 원드라이브 내의 옵시디언 볼트에 대고 직접 또는 간접적으로 Git 버전 관리를 결합하여 사용하게 될 경우, 옵시디언이 실시간으로 갱신하는 임시 상태 파일들을 추적 목록에서 격리하기 위해 볼트 최상위(Root) 폴더에 반드시 `.gitignore` 파일을 배치합니다.
   - 외부 윈도우 메모장(Notepad)을 통해 규칙을 작성하고 저장 시 파일 형식을 `모든 파일 (*.*)`로 선택한 뒤 파일명을 `.gitignore`로 저장해 둡니다:
     ```text
     .obsidian/workspace.json
     .obsidian/workspace-mobile.json
     .obsidian/cache/
     .trash/
     ```
4. **미러링 폴더의 '100 Source' 하위 집중화**:
   - 옵시디언 파일 트리의 정돈을 위해 모든 미러링 문서 복사본들의 종착지를 `100 Source/` 폴더 아래로 이관합니다.
   - 랩탑 `sync-to-obsidian.ps1` `$Dst` 변수:
     `$Dst = "C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\AliaBot_Docs"`
   - 데스크탑 `sync-to-obsidian.ps1` `$Dst` 변수:
     `$Dst = "C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\Greenhouse_Docs"`

---

### [시나리오 B] OneDrive를 벗어나 로컬 폴더로 이전하는 경우 (가장 안전)
파일 손실을 차단하기 위해 순수 로컬 드라이브(예: `C:\Users\eugene\Obsidian_Vault`)로 폴더를 옮긴 후에는 아래 중 하나의 방식으로 다중 기기 싱크를 처리합니다.

#### Option 1. Obsidian Sync 공식 서비스 활용 (자동 방식)
* **절차**:
  1. 옵시디언 환경설정 ➡️ **"Core Plugins"** 에서 **Sync** 플러그인을 활성화합니다.
  2. 공식 유료 서비스 계정으로 로그인한 뒤, 리모트 볼트를 연결합니다.
  3. 모든 기기(랩탑, 데스크탑, 모바일)에 동일한 로컬 볼트를 셋팅하고 활성화해 두면 옵시디언이 켜질 때마다 종단간 암호화(End-to-End Encrypted) 상태로 실시간 동기화가 수행됩니다.

#### Option 2. GitHub 중앙 허브 방식 (수동/개발자 방식)
* **절차**:
  1. 랩탑과 데스크탑의 로컬 폴더에 각각 Git 저장소를 셋팅합니다.
  2. **컴퓨터 A (작업 종료 시)**:
     - VSCode의 '소스 제어' 탭을 열어 변경된 마크다운 메모들을 커밋한 후 **`git push`** (올리기)를 수행하고 PC를 종료합니다.
  3. **컴퓨터 B (작업 시작 시)**:
     - 에디터를 열고 코딩을 시작하기 전, 터미널 또는 Git 패널을 통해 **`git pull`** (내려받기)을 실행하여 최신 노트를 먼저 다운로드받고 편집을 시작합니다.
  4. **모바일 연동**:
     - 모바일 옵시디언 앱 내부에서 `Obsidian Git` 플러그인을 설치하여 깃허브와 API 키로 동기화 주기를 셋팅해 운용합니다.
