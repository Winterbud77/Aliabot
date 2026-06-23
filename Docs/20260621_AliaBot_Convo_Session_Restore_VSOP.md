# 📋 SOP: Antigravity 대화 세션 유실 시 수동 복원 표준 절차서 (VSOP)

---
title: "SOP: Antigravity 대화 세션 유실 시 수동 복원 표준 절차서 (VSOP)"
date: 2026-06-21
type: standard-procedure-log
category: AliaBot
session: 복원용_Test09
---

> **목적 (Purpose)**:
> Antigravity IDE 업데이트 또는 예기치 않은 시스템 종료/재부팅 시 발생하는 로컬 단독 대화 세션의 UI 목록 유실 현상을 복구하기 위한 표준 절차서(VSOP)입니다. 본 문서는 비개발자도 각 물리 폴더를 직접 확인하여 안전하게 수동 복원을 완수할 수 있도록 상세 경로와 명령어를 기술합니다.

---

## 📂 복원 전 필수 사전 지식 (Prerequisite Paths)

수동 복원 작업을 시작하기 전에 아래 경로가 내 컴퓨터 상에 어디에 있는지 탐색기(Explorer)로 먼저 확인해야 합니다.

1. **대화방 파일 보관소**:
   `C:\Users\eugene\.gemini\antigravity\conversations\`
   * *설명*: 대화방 하나당 하나의 `.pb` 파일(바이너리)이 매핑되어 있는 곳입니다.
2. **에이전트 로그 보관소**:
   `C:\Users\eugene\.gemini\antigravity\brain\`
   * *설명*: 대화 내용의 원본 텍스트 및 에이전트의 내부 실행 로그가 보관되는 폴더입니다.

---

## 🛠️ 상세 수동 복원 7단계 절차 (Detailed Step-by-Step Procedure)

### 1단계: 임시 껍데기 대화방(Container) 생성
1. Antigravity IDE의 우측 또는 AI 대화 패널 상단에서 **새로운 대화방(New Chat/Conversation)**을 하나 생성합니다.
2. 첫 질문으로 아무 단어나 입력하여 대화방을 시작합니다. (예: `임시 복구용 세션`)
   * *이유*: 이 입력을 통해 디스크에 고유 식별자(UUID)를 가진 새 세션 파일이 써지기 시작합니다.

### 2단계: 신규 대화방의 식별자(UUID) 및 파일 확인
1. 파일 탐색기를 열고 `C:\Users\eugene\.gemini\antigravity\conversations\` 폴더로 이동합니다.
2. 마우스 우클릭 -> **정렬 기준(Sort by) -> 수정된 날짜(Date Modified) -> 내림차순(Newest first)**으로 설정합니다.
3. 가장 상단에 방금 생성되어 수십 KB 크기를 가진 `.pb` 파일명을 확인하고 복사해 둡니다. 이것이 **신규 대화방의 UUID**입니다.
   * *예: `77a6e830-8cbd-4bbc-9694-2546b86a715d`*

### 3단계: 유실된 과거 대화방의 백업 데이터 찾기
1. 복구하고자 하는 어제의 유실 대화방 UUID를 확인합니다.
   * *예: `4a121658-e924-48e9-9455-497feba68766`*
2. 만약 해당 대화방의 UUID를 모른다면, 아래 경로에 진입하여 가장 용량이 크거나 수정된 날짜가 유실 시점과 일치하는 폴더 내부의 `overview.txt` 파일을 메모장으로 열어 대화 내용을 읽고 확인합니다.
   * 확인 경로: `C:\Users\eugene\.gemini\antigravity\brain\<과거-UUID>\.system_generated\logs\overview.txt`

### 4단계: 물리 데이터 강제 덮어쓰기 (Data Swap)
* **주의: 이 작업은 Antigravity IDE가 켜져 있는 상태에서 진행합니다.**
1. **대화 파일 덮어쓰기**:
   * 복구 대상 백업 파일(`C:\Users\eugene\.gemini\antigravity\conversations\4a121658-e924-48e9-9455-497feba68766.pb`)을 복사합니다.
   * 복사한 파일의 이름을 2단계에서 확인한 신규 UUID 파일명(`77a6e830-8cbd-4bbc-9694-2546b86a715d.pb`)으로 변경한 뒤 덮어씁니다.
2. **브레인 로그 폴더 덮어쓰기**:
   * 신규 세션의 브레인 폴더(`C:\Users\eugene\.gemini\antigravity\brain\77a6e830-8cbd-4bbc-9694-2546b86a715d`)를 삭제합니다.
   * 과거 세션의 브레인 폴더(`C:\Users\eugene\.gemini\antigravity\brain\4a121658-e924-48e9-9455-497feba68766`)를 복사한 뒤, 폴더 이름을 신규 UUID(`77a6e830-8cbd-4bbc-9694-2546b86a715d`)로 변경하여 붙여넣습니다.

### 5단계: 읽기 전용(Read-Only) 잠금 걸기 (가장 중요)
* 덮어쓴 파일이 IDE 종료 시 원래 메모리의 빈 메시지로 초기화되는 것을 막기 위해 강제 잠금을 걸어야 합니다.
1. Windows 검색창에 `PowerShell`을 검색하여 실행하거나 IDE의 터미널 창을 엽니다.
2. 아래 명령어를 복사하여 붙여넣고 엔터(Enter)를 누릅니다.
   ```powershell
   attrib +r "C:\Users\eugene\.gemini\antigravity\conversations\77a6e830-8cbd-4bbc-9694-2546b86a715d.pb"
   ```
   * *이 작업을 하지 않고 에디터를 종료하면 복원된 데이터가 모두 덮어씌워져 소실되므로 반드시 수행해야 합니다.*

### 6단계: 에디터 재부팅 및 복원 상태 확인
1. **Antigravity IDE 창을 완전히 종료(Exit)합니다.**
2. 5초 정도 대기한 뒤, **IDE를 다시 실행**합니다.
3. 좌측 또는 AI 패널의 과거 대화록 목록에 있는 임시 대화방("Restoring Session Test09" 등)을 클릭하여 진입합니다.
4. 어제 대화 히스토리 및 개발 맥락이 온전히 화면에 렌더링되는지 확인합니다.

### 7단계: 읽기 전용 잠금 해제 (Writable 전환)
* 대화가 성공적으로 복원되었음을 확인했다면, 앞으로 대화를 계속 이어나가고 신규 데이터가 정상 저장되도록 잠금을 반드시 해제해야 합니다.
1. 복구된 대화방 내의 터미널(PowerShell)을 엽니다.
2. 아래 명령어를 복사하여 붙여넣고 엔터(Enter)를 누릅니다.
   ```powershell
   attrib -r "C:\Users\eugene\.gemini\antigravity\conversations\77a6e830-8cbd-4bbc-9694-2546b86a715d.pb"
   ```
3. 잠금 해제가 완료되었습니다. 이제 자유롭게 추가 질문을 하셔도 대화가 정상적으로 영속 저장됩니다.
