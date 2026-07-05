# 📋 SOP: Antigravity 대화 세션 복원 및 임시 캐시 정화 표준 절차서 (VSOP)

---
title: "SOP: Antigravity 대화 세션 복원 및 임시 캐시 정화 표준 절차서 (VSOP)"
date: 2026-07-05
type: standard-procedure-log
category: Documentation
subcategory: Session-Recovery
tags: [sop, session-recovery, troubleshooting, antigravity, cache-flush, powershell]
session_name: "AliaBot Phase 5.8 restoring: Obsidian Deep Link"
session_id: "656e8400-19e4-4b38-aac4-56ea1d525f26"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
summary: "Antigravity IDE 1.32.2 버전에서 강제 재부팅이나 클라우드 동기화 불일치로 유실된 대화 세션을 완벽한 제목과 내용으로 복원하고, 복원 과정에서 발생하는 인덱스 오동작 및 백그라운드 캐시 고착 문제를 해결하기 위한 기술적 트러블슈팅 및 표준 스왑 절차서"
---

> **목적 (Purpose)**:
> 에디터 강제 재부팅이나 네트워크 세션 만료 등의 원인으로 Past Conversations (과거 대화 목록)에서 특정 중요 대화방이 소실되었을 때, 단순 파일 복사 수준을 넘어 **에디터 UI 제목의 정합성을 100% 확보하고 백그라운드 메모리 캐시를 강제 정화하여 완벽한 상태로 세션을 스위칭 및 스왑하는 영구 표준 절차**를 정의합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① Language Server Process (언어 서버 프로세스)
* **개념**: 에디터의 하위에서 백그라운드로 실행되며 실질적인 파일 구문 분석, 파이썬 스크립트 런타임 제어 및 세션 인덱스 데이터베이스 바인딩을 주도하는 실행 파일(`language_server_windows_x64.exe`)입니다.
* **원리**: VS Code의 화면만 새로고침하는 `Reload Window` 명령으로는 이 백그라운드 프로세스가 죽지 않고 이전 메모리 상태를 고수하므로, 에디터 자체를 완전히 물리적으로 종료(Physical Termination)해야만 캐시가 지워지고 디스크의 변경 사항이 정상 반영됩니다.

### ② Dynamic Title Recalculation (동적 대화명 재계산)
* **개념**: 첫 프롬프트 전송 시 생성된 임시 제목이 에이전트의 답변 턴(Step)이 **DONE (정상 완료)** 처리되는 시점에 전체 대화 맥락을 기반으로 최종 요약되어 영구 갱신(Overwrite)되는 작동 기법입니다.
* **원리**: 에이전트 답변이 완료되기 전에 실행 중인 Run 명령을 취소하거나 에러가 나면, 예외 처리 맥락이 발생해 요약기가 대화명을 엉뚱하게 리셋하므로 첫 턴은 무조건 분석 도구 없이 텍스트 응답으로만 안전하게 마감해야 대화명이 유지됩니다.

### ③ File Attributes Lock (파일 속성 잠금)
* **개념**: Windows NTFS 파일 시스템 속성인 `Read-Only (읽기 전용)` 플래그를 파일에 강제 체결하여 에디터가 종료 시점에 덮어쓰려 하는 메모리 플러시(Flush)를 강제 차단하는 우회 제어 기법입니다.
* **원리**: `attrib +r` 명령어로 세션 바이너리 파일(`.pb` 확장자)을 잠그면, 프로세스는 강제 덮어쓰기에 실패한 채 원본을 온전히 보존하게 됩니다.

### ④ Session Renaming Mechanism (세션명 수동 변경 메커니즘)
* **개념**: 첫 프롬프트의 정규식 패턴을 태워 제목을 유도하는 복잡한 우회로를 거치지 않고, 에디터의 **Agent Manager (에이전트 관리자)** 설정 인터페이스를 통해 직접 대화명을 편집하여 바인딩하는 정식 UI 기능입니다.
* **원리**: `Open Agent Manager`를 클릭하고, 변경하고자 하는 세션 항목 우측 끝의 `더보기(...)` 메뉴에서 `Rename` 버튼을 클릭하여 새 이름을 입력하면, 로컬 캐시 DB(`state.vscdb`)와 `.pb` 파일 헤더에 정식 대화명이 즉각 실시간 갱신(Real-Time Sync)됩니다.


---

## 2. 🚨 트러블슈팅 및 오늘 겪은 실패 원인 분석 (Troubleshooting & Failures)

### [실패 1] 첫 프롬프트의 맨 앞에 설명글을 배치함 (정규식 패턴 매칭 실패)
* **현상**: `[System Instruction: ...]` 지시문을 적었음에도 요약기가 이를 인지하지 못하고 `Restoring Obsidian...`으로 제목을 요약함.
* **원인**: 파서 엔진(Parser Engine)은 완벽한 맨 앞 시작 지점에 지시문 대괄호 패턴이 오는지를 정규식으로 감지합니다. 앞에 큰따옴표나 다른 한글 서술어가 한 글자라도 오면 패턴 매칭에 실패하여 일반 요약 모드로 자동 강제 폴백(Fallback)됩니다.

### [실패 2] 첫 턴 실행 중 Run 명령 취소 (대화명 덮어쓰기 오작동)
* **현상**: 임시로 지시문 제목이 박혀 가동되던 중, 에이전트가 도구를 호출할 때 실행을 취소하자 제목이 `Restoring Aliabot Integration`으로 리셋됨.
* **원인**: 턴이 정상 완료되지 않고 실패 상태로 마감되면서 동적 대화명 재계산 알고리즘이 가동되어, 예외 상황에 맞춘 임시 제목으로 캐시를 덮어써서 굳어졌습니다.

### [실패 3] 단순 Reload Window 수행 (메모리 캐시 고착)
* **현상**: 디스크에서 파일 스왑 후 잠금을 걸고 리로드를 시도했으나 계속 새 껍데기 세션의 텍스트가 노출됨.
* **원인**: 백그라운드 언어 서버 프로세스가 여전히 메모리 상에 구형 껍데기 세션 캐시를 쥐고 있어 디스크 파일을 다시 읽지 않았기 때문입니다. 에디터 완전 종료를 해야만 캐시가 플러시(Flush)됩니다.

### [실패 4] 수동 이름 변경 (Rename) UI 옵션의 미인지
* **현상**: 세션 대화명을 정밀 정의하기 위해 수차례 세션을 재생성하고 스왑하는 불필요한 리소스 낭비가 발생함.
* **원인**: Antigravity의 대화명 요약 알고리즘을 속이기 위한 간접적 우회법(System Instruction)만 연구하였으나, 실제로는 **Agent Manager (에이전트 관리자)** 설정 UI에 정식 **Rename (이름 바꾸기)** 기능이 내장되어 있었습니다. 이 정식 UI의 부가 옵션 위치를 사전에 인지하지 못해 수많은 시간 소모(Time Leak)가 일어났습니다.

---

## 3. 📝 검증된 최적의 6단계 복원 절차 (Step-by-Step SOP)

이 절차는 오늘 하루 동안의 시행착오와 발견을 모두 종합하여, **향후 유실 사건 발생 시 즉각 대처할 수 있는 궁극적인 최적 프로토콜**입니다.

### Step 1: 껍데기용 초간단 세션 생성 (도구 구동 우회)
1. VS Code에서 `New Chat`을 누릅니다.
2. 입력 칸에 아래와 같이 **도구 실행을 차단하는 정제된 지시문**을 맨 앞에 붙여 전송합니다:
   ```text
   [System Instruction: Please set this session name format as: "AliaBot Phase 5.8 restoring: Obsidian Deep Link"]
   반가워! 이 세션은 복구용 껍데기 세션이야. 분석 도구를 실행하지 말고 가볍게 인사말만 하나 건네줘!
   ```
3. 에이전트가 즉시 텍스트로만 첫 대답을 마감하여 대화명이 정상 영속 바인딩(Persistent Binding)되는 것을 확인합니다.
*(팁: 지시문이 깨지더라도 나중에 Step 6에서 수동으로 Rename할 수 있으므로, 대화방을 안전하게 확보하는 것을 우선합니다.)*

### Step 2: 디스크 상의 데이터 핫 스와핑 (Data Swapping)
1. 현재 활성화된 세션의 UUID를 최근 수정 시간대를 기준으로 파악합니다.
2. 어제 완성된 백업 세션 파일(`bf344642-....pb`)을 신규로 만든 세션 파일명(`신규UUID.pb`)으로 강제 덮어씁니다.
3. `brain/<신규UUID>` 폴더의 내용물도 어제 백업의 브레인 로그 디렉터리 내용물로 일체 교체합니다.

### Step 3: 쓰기 금지 잠금 (Write-Protection Lock) 체결
1. 윈도우 PowerShell 터미널을 열고 덮어쓴 파일에 읽기 전용 속성을 강제 부여합니다:
   ```powershell
   attrib +r "C:\Users\eugene\.gemini\antigravity\conversations\<신규UUID>.pb"
   ```

### Step 4: 에디터 완전 종료 (Exit) 및 메모리 정화
1. 켜져 있는 VS Code 창을 우측 상단 `X` 버튼을 눌러 **완전히 종료**합니다.
2. 백그라운드 프로세스가 소멸할 수 있도록 약 5초간 대기합니다.
3. VS Code를 다시 켜고 과거 대화 목록에서 복원된 방을 클릭하여 **어제의 400여 줄 대본 히스토리가 100% 복구된 것을 확인**합니다.

### Step 5: 최종 잠금 해제 및 활성화
1. 로드가 완벽히 끝났다면 대화를 영구 누적할 수 있도록 읽기 전용 잠금을 해제합니다:
   ```powershell
   attrib -r "C:\Users\eugene\.gemini\antigravity\conversations\<신규UUID>.pb"
   ```

### Step 6: Agent Manager를 통한 대화명 최종 변경 (Rename)
1. 에디터 좌측의 Antigravity 탭 메뉴 혹은 Command Palette를 통해 **`Open Agent Manager`**를 실행합니다.
2. 세션 리스트 목록에서 복구한 대상 세션을 탐색합니다.
3. 세션 항목의 가장 오른쪽 끝에 위치한 **점 세 개(...) 아이콘**을 클릭합니다.
4. 컨텍스트 메뉴에서 **`Rename`**을 선택하고, 복원을 원하셨던 정확한 정식 제목(예: `AliaBot Phase 5.8: Obsidian Deep Link & Notion Integration`)을 입력하여 마감합니다.

---


## 4. 🏁 아직 완결되지 않은 미해결 과제 및 복구 흔적 정리 (Pending Items)

### ① 로컬 인덱스 캐시 DB에 남은 찌꺼기 잔상 정리
* **미결 사항**: 복구 도중 중단되거나 명칭 변경에 실패해 버려진 임시 세션 껍데기들은 디스크 상에서는 파일 청소 스크립트(`clean_temp_sessions.py`)를 통해 완전히 지워졌으나, VS Code 로컬 글로벌 데이터베이스(`state.vscdb`)의 캐싱 테이블에 여전히 껍데기 제목(예: `Restoring Obsidian And Notion...`)이 잔상으로 남아있을 수 있습니다.
* **조치 계획**: 에디터 구동에 기술적인 문제는 없으나, UI 뷰가 영구적으로 깔끔하게 유지될 수 있도록 향후 쉘 클리너를 통해 `state.vscdb` 내부의 쓰레기 세션 인덱스를 정밀 파이프하는 자동 쿼리 보완이 필요합니다.

### ② Phase 5.8 미완료 복원 개발 업무 재개
* **미결 사항**: 오늘 소실 복원 조치로 인해 지연된 [Phase 5.8: 옵시디언 딥링크 구현 및 노션 연동] 실기 검증을 본격 진행해야 합니다. 
* **다음 단계**: `src/api/obsidian.js`와 `src/api/notion.js`에 복원 완료된 소스 코드의 로컬 동작 성능을 교차 체크하고, 모바일 실기 환경에서의 Mixed Content Policy 우회 통신 검증을 시작합니다.
