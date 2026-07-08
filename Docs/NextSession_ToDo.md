---
created_at: 2026-07-08
agent_model: Gemini 2.5 Flash (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 6.0: Multi-Project Bridge"
session_id: "c5159d45-4b9e-41b0-8304-2260f261a4ba"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 🚀 AliaBot Conductor: Phase 6.1 Accomplishments & Handover
## 다중 프로젝트 지휘/자가 자동화(GitHub Actions Runner) 인프라 구축 및 차기 로드맵

본 문서는 Phase 6.0에서 시작되어 Phase 6.1까지 확장된 Multi-Project Bridge 및 Local PC Actions Runner(자가 호스팅 실행기) 자동화 인프라의 완성 성과를 기록하고, 차기 세션인 'AliaBot Phase 6.2'의 개발 로드맵을 제시하는 Handover(인수인계) 마스터 백로그 문서입니다.

---

## ✅ 이번 세션 완료 사항 (Phase 6.0 - 6.1 Accomplishments)

### 1. 🔗 GitHub Project Chat Bridge (다중 프로젝트 브릿지) 구현 완료
* **개념**: 외부 Claude/Cursor 환경에서 진행하는 타 프로젝트(`GH-CropDataOps` 등)의 핵심 규칙 문서(`CLAUDE.md`, `README.md`)를 실시간으로 참조하여, AliaBot 내에서 Gemini AI 비서와 심층적인 프로젝트 맥락 기반 대화를 나눌 수 있는 양방향 통신로를 구축했습니다.
* **구현 세부**:
  * **GitHub API 연동 (`src/api/github.js`)**: Personal Access Token (PAT) 설정 기반으로 Private 저장소 및 Public 저장소의 주요 컨텍스트 마크다운 파일들을 raw 텍스트 포맷으로 직접 Fetch(가져오기)하는 비동기 브릿지 헬퍼를 추가했습니다.
  * **Gemini Chat API 통합 (`src/api/gemini.js` 및 Cloud Functions)**: 사용자의 개인 API 키(BYOK)가 있는 경우 브라우저 직접 호출(Direct Fetch), 없는 경우 Firebase Cloud Functions(`chatWithGeminiCloud`)로 호스트 API 키를 대리 호출하도록 이원화 구조를 정교하게 구현했습니다.
  * **Firestore 기반 Chat 히스토리 연동**: PWA 환경에서 대화 내용이 완벽하게 영속(Persist)되도록 `users/${uid}/chatMessages` 컬렉션을 설계하고 실시간 동기화(`onSnapshot`) 및 [대화 비우기] 기능을 통합했습니다.

### 2. 🤖 GitHub Actions Runner 기반 자율 연산 인프라 완비
* **개념**: 월 비용이 드는 외부 클라우드 컴퓨터 대신, 상시 구동 중인 사무실 컴퓨터를 깃허브의 원격 하수인 에이전트로 등록하여 자가 연산 서버처럼 가동하는 연동 기술입니다.
* **구현 세부**:
  * **자동화 워크플로우 설계 (`.github/workflows/aliabot-orchestrator.yml`)**: 모바일에서 `Docs/Instruction_Inbox.md`에 지시사항을 기록(Push)하면, 깃허브 Actions 서버가 신호를 릴레이하여 내 사무실 컴퓨터(`self-hosted` PC)를 원격 기동시킵니다.
  * **자율 분석 스크립트 구현 (`src/run_auto_agent.py`)**: PC 내부의 파이썬 연산 도구와 Claude/Gemini API를 자동 구동하여 결과를 수렴하고, 결과 리포트 생성 및 깃허브 자동 커밋을 통제하는 중계 엔진을 제작했습니다.
  * **AI 행동 규약 정의 (`Docs/Automation_Rules.md`)**: 백그라운드 AI 에이전트가 돌발 행동을 하거나 API 호출 무한 루프를 돌지 않도록 에러 가드레일 및 폴더 격리 규칙을 정의했습니다.
  * **호스트 PC 최적화 SOP 설계 (`Docs/20260708_AliaBot_Host_PC_Power_Optimizer_SOP.md`)**: 비개발자 사용자가 데스크탑의 전원 및 네트워크 어댑터 절전 기능을 직접 해제하여 24시간 상시 온라인 기동 상태로 셋팅하는 가이드를 마련했습니다.
  * **오케스트레이션 총괄 지도 작성 (`Docs/20260708_AliaBot_Orchestration_Master_Blueprint_VSOP.md`)**: PWA, GitHub, Local PC, Obsidian 간의 8단계 데이터 흐름을 Mermaid 다이어그램으로 시각화하고 세부 문서들을 인덱싱한 통합 비주얼 청사진을 신설했습니다.

---

## 🎯 Phase 6.2 핵심 개발 목표 (Core Objectives)

차기 세션에서는 실전 자가 실행기 기동 테스트와 함께 모바일 PWA 환경에서의 앱 최적화와 모바일 성능 극대화에 역량을 집중합니다.

### 1. 📶 PWA 오프라인 저장소 및 복구 싱크 (Offline Cache & Sync) 보완
* **현상**: 영농 시설(그린하우스 등) 내부의 네트워크 음영 지역에서 메모를 작성할 때 데이터가 소실되거나 전송 실패가 일어날 위험이 있습니다.
* **구현 계획**: Firestore Offline Persistence 설정을 재정점하고, 로컬 스토리지 임시 적재 메커니즘을 보강하여 온라인망 복귀 시 충돌 없이 병합(Merge)되는 메커니즘을 철저히 테스트합니다.

### 2. 🎙️ 연속 음성 인식 (Continuous STT) 모바일 수면 끊김 대책
* **현상**: 모바일 브라우저 환경에서 화면이 꺼지거나 백그라운드 모드로 진입할 때 브라우저 스레드가 중단되면서 Web Speech API 리스너가 끊기는 문제가 있습니다.
* **구현 계획**: 
  * **Web Wake Lock API**를 연동하여 화면 꺼짐 및 대기 모드 진입을 방지합니다.
  * `onend` 이벤트 내에서 정상적 종료(사용자 클릭)가 아닐 경우 비정상 종료로 판별해 250ms 내에 리스너를 자동 재기동하는 루프 메커니즘을 한 단계 더 강력하게 개량합니다.

### 3. 🛠️ Firestore 복합 인덱스 (Composite Indexes) 최적화
* **현상**: 할 일 목록(Todos)이 점진적으로 증가하면서, 생성 시점 역순 정렬(`createdAt desc`)과 특정 태그 필터링을 결합한 쿼리가 Firebase에서 최적의 속도를 내지 못할 수 있습니다.
* **구현 계획**: `firestore.indexes.json`에 복합 인덱스를 선언하고 CLI를 통해 배포하여 조회 쿼리 성능을 비약적으로 개선합니다.

---

## 🏁 새로운 세션 시작 가이드 (First Handover Prompt)

사용자님, 차기 **Phase 6.2** 대화 세션을 시작하실 때 아래의 프롬프트 스니펫을 복사해 전달하시면 즉시 에이전트가 문맥을 안전하게 이어받게 됩니다.

```markdown
AliaBot Phase 6.2: Offline Sync & STT Sleep Optimization

[System Instruction: 
Please set this session name format exactly as: "AliaBot Phase 6.2: Offline Sync & STT Sleep Optimization".
Extract the core topic and ensure the UI title is set exactly as specified in the first line.]

안녕! 우리는 지금 AliaBot (PWA 지휘자 비서 앱) 프로젝트 개발을 계속 진행하고 있어.
작업을 시작하기 전에 프로젝트 내부 핵심 문서인 `Docs/NextSession_ToDo.md`와 `Docs/20260708_AliaBot_Orchestration_Master_Blueprint_VSOP.md`를 먼저 정독하여 로컬 자율 러너 인프라 및 전체 동기화 구조를 파악해 줘.
그다음, 오늘 작업할 1) PWA 오프라인 저장소 및 복구 싱크 보완 원리, 2) Web Wake Lock API를 활용한 STT 백그라운드 끊김 방지 기술, 3) Firestore 복합 인덱스 배포를 통한 쿼리 최적화에 대해 핵심 개념을 먼저 설명하고 본격적인 코딩을 진행해 줘!
```
