---
created_at: 2026-07-08
agent_model: Gemini 2.5 Flash (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 6.1: GitHub Actions Runner Automation"
session_id: "c5159d45-4b9e-41b0-8304-2260f261a4ba"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 📖 Rules: AI 자율 실행 통제를 위한 행동 규약 문서 (Automation Rules)
## 백그라운드 에이전트(Background Agent)의 자율 조작 범위 및 행동 제약 가이드라인

본 문서는 사무실 컴퓨터(데스크탑 1) 내부의 백그라운드 자율 러너 프로그램이 모바일 지시를 수신하여 연산을 수행할 때, 시스템 안전을 유지하고 돌발 행동을 방지하기 위해 반드시 준수해야 하는 **AI 행동 규약(AI Safety Guardrails)**입니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① 자율 에이전트 샌드박스 (Autonomous Agent Sandbox)
* **개념**: AI가 코드를 직접 빌드하고 실행할 때, 컴퓨터의 시스템 핵심 영역(예: 운영체제 윈도우 부팅 드라이브 등)을 임의로 삭제하거나 오염시키지 못하도록 **조작 가능한 폴더 및 권한 범위를 명시적으로 차단 및 격리**해 둔 상태를 의미합니다.

### ② 예외 제약 조건 (Exception Constraints - 에러 가드레일)
* **개념**: AI 연산 중 무한 루프가 돌거나 컴파일 에러가 연이어 발생할 경우, API 요금이 무한 청구되는 참사를 방지하기 위해 최대 재시도 횟수나 중지 타이머를 걸어두는 안전 제약입니다.

---

## 2. 🚦 AI 백그라운드 러너 필수 준수 규칙 (Standard Constraints)

사무실 컴퓨터의 셀프 호스티드 러너(Self-hosted Runner)를 가동하는 모든 AI 에이전트(Claude 등)는 아래 지침을 1초의 타협도 없이 절대적으로 준수해야 합니다.

### ① 연산 작업 및 폴더 격리 규칙
1. **허용 폴더**: 오직 `c:\Users\eugene\Projects\Work01_Anti\` 및 지정된 영농 데이터 로컬 작업 폴더 내부에서만 코드 읽기 및 실행이 허용됩니다. 이 외의 윈도우 드라이브나 외부 디렉토리를 조작하는 명령은 즉시 실행이 거부(Access Denied)되어야 합니다.
2. **연산 대상 지정**: `Docs/Instruction_Inbox.md` 파일 맨 밑에 추가된 가장 최근의 지시사항 1건만 파싱하여 한 번에 1개의 태스크만 실행합니다.

### ② 자동 갱신 및 Git 회귀(Return Path) 규칙
1. **산출물 서식화**: 결과 보고서는 반드시 마크다운(`.md`) 파일로 생성하고, 파일 경로는 `Outputs/Crop_Report_YYYYMMDD.md` 양식을 따르십시오.
2. **단방향 복제 연동**: 분석 보고서가 생성되면, 백그라운드 파워쉘 스크립트(`sync-to-obsidian.ps1`)를 자동으로 트리거하여 OneDrive 옵시디언 영역(`100 Source`)으로 전송되도록 하십시오.
3. **깃허브 자동 커밋**: 깃허브에 최종 push할 때의 커밋 메시지는 반드시 `[Auto-Run] Crop analysis result updated by AliaBot Executor` 라는 헤더를 명시하여, 사람이 수동으로 커밋한 내역과 시스템 자동 연산 내역을 완벽히 분리하십시오.

### ③ 요금 폭탄 방지(Anti-Billing-Spam) 안전 규칙
1. **API 재시도 제한**: 분석 실행 중 에러가 발생하여 코드를 자동 수정하는 작업은 **최대 3회**로 제한합니다. 3회 초과 시 작업을 즉각 중단(Force Halt)하고 에러 보고서를 `Outputs/` 폴더에 생성한 뒤 대기 모드로 복귀하십시오.
2. **서버 호출 타임아웃**: 개별 연산의 총 가동 시간은 **최대 5분**을 넘길 수 없습니다.
