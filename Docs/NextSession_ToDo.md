---
created_at: 2026-07-07
agent_model: Gemini 2.5 Flash (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 6.0: GitHub Project Chat Bridge"
session_id: "c5159d45-4b9e-41b0-8304-2260f261a4ba"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 🚀 AliaBot Conductor: Phase 6.0 Accomplishments & Handover
## 다중 프로젝트 브릿지(GitHub Project Chat Bridge) 구축 성공 및 차기 로드맵

본 문서는 Phase 5.9에서 계획된 Multi-Project Bridge 아키텍처를 "GitHub API + Gemini 2.5 Flash" 연동 방식의 전용 채팅 뷰(Project Chat View)로 재정의하여 구현 완료한 성과를 기록하고, 차기 세션인 'AliaBot Phase 6.1'의 개발 로드맵을 제시하는 Handover(인수인계) 마스터 백로그 문서입니다.

---

## ✅ 이번 세션 완료 사항 (Phase 6.0 Accomplishments)

### 1. 🔗 GitHub Project Chat Bridge (다중 프로젝트 브릿지) 구현 완료
* **개념**: 외부 Claude Code/Cursor 환경에서 진행하는 타 프로젝트(`Greenhouse-CropDataOps` 등)의 핵심 규칙 문서(`CLAUDE.md`, `README.md`)를 실시간으로 참조하여, AliaBot 내에서 Gemini AI 비서와 심층적인 프로젝트 맥락 기반 대화를 나눌 수 있는 양방향 통신로를 구축했습니다.
* **구현 세부**:
  * **GitHub API 연동 (`src/api/github.js`)**: Personal Access Token (PAT) 설정 기반으로 Private 저장소 및 Public 저장소의 주요 컨텍스트 마크다운 파일들을 raw 텍스트 포맷으로 직접 Fetch(가져오기)하는 비동기 브릿지 헬퍼를 추가했습니다.
  * **Gemini Chat API 통합 (`src/api/gemini.js` 및 Cloud Functions)**: 사용자의 개인 API 키(BYOK)가 있는 경우 브라우저 직접 호출(Direct Fetch), 없는 경우 Firebase Cloud Functions(`chatWithGeminiCloud`)로 호스트 API 키를 대리 호출하도록 이원화 구조를 정교하게 구현했습니다.
  * **Firestore 기반 Chat 히스토리 연동**: 모바일 PWA 환경에서 화면 새로고침 시에도 대화 내용이 완벽하게 영속(Persist)되도록 `users/${uid}/chatMessages` 컬렉션을 설계하고 실시간 동기화(`onSnapshot`) 및 [대화 비우기] 기능을 통합했습니다.

### 2. 💬 PWA 맞춤형 Project Chat UI 구축
* **인터페이스 통합**: 기존의 고정형 상단 입력창과 마이크 STT 인프라를 그대로 재활용하여 챗 입력창으로 활용하는 지능형 UX 구조를 완성했습니다.
* **뷰 렌더링 (`viewMode === 'chat'`)**: 
  * 마크다운 텍스트(코드 블록, 인라인 코드, 볼드체, 목록 등)를 Vanilla JS로 파싱하여 HTML로 안전하게 바인딩하는 `renderMarkdown` 헬퍼를 컴포넌트에 이식했습니다.
  * 세련된 HSL 컬러 기반의 챗 버블(User, Assistant, System 알림)과 AI 답변 대기 시 표시되는 타이핑 깜빡임 애니메이션(`typingDotAnim`)을 적용하여 Wow 효과를 끌어올렸습니다.

### 3. ⚙️ Conductor 설정창 개선
* 설정 모달에 `GitHub Repository` (owner/repo 포맷)와 `GitHub Personal Access Token` 입력 필드를 추가하고 `localStorage`에 자동 저장되도록 바인딩을 완료했습니다.

---

## 🎯 Phase 6.1 핵심 개발 목표 (Core Objectives)

이메일 수집 파이프라인(Inbound Email)이 잠정 보류됨에 따라, 차기 세션에서는 PWA 앱의 모바일 성능 극대화 및 미완결 백로그 안정화에 역량을 집중합니다.

### 1. 🛠️ Firestore 복합 인덱스 (Composite Indexes) 최적화
* **현상**: 할 일 목록(Todos)이 점진적으로 증가하면서, 생성 시점 역순 정렬(`createdAt desc`)과 특정 태그 필터링을 결합한 쿼리가 Firebase에서 최적의 속도를 내지 못할 수 있습니다.
* **구현 계획**: `firestore.indexes.json`에 복합 인덱스를 선언하고 CLI를 통해 배포하여 조회 쿼리 성능을 비약적으로 개선합니다.

### 2. 📶 PWA 오프라인 저장소 및 복구 싱크 (Offline Cache & Sync) 보완
* **현상**: 영농 시설(그린하우스 등) 내부의 네트워크 음영 지역에서 메모를 작성할 때 데이터가 소실되거나 전송 실패가 일어날 위험이 있습니다.
* **구현 계획**: Firestore Offline Persistence 설정을 재정점하고, 로컬 스토리지 임시 적재 메커니즘을 보강하여 온라인망 복귀 시 충돌 없이 병합(Merge)되는 메커니즘을 철저히 테스트합니다.

### 3. 🎙️ 연속 음성 인식 (Continuous STT) 모바일 수면 끊김 대책
* **현상**: 모바일 브라우저 환경에서 화면이 꺼지거나 백그라운드 모드로 진입할 때 브라우저 스레드가 중단되면서 Web Speech API 리스너가 끊기는 문제가 있습니다.
* **구현 계획**: 
  * **Web Wake Lock API**를 연동하여 화면 꺼짐 및 대기 모드 진입을 방지합니다.
  * `onend` 이벤트 내에서 정상적 종료(사용자 클릭)가 아닐 경우 비정상 종료로 판별해 250ms 내에 리스너를 자동 재기동하는 루프 메커니즘을 한 단계 더 강력하게 개량합니다.

---

## 🏁 새로운 세션 시작 가이드 (First Handover Prompt)

사용자님, 차기 **Phase 6.1** 대화 세션을 시작하실 때 아래의 프롬프트 스니펫을 복사해 전달하시면 즉시 에이전트가 문맥을 안전하게 이어받게 됩니다.

```markdown
AliaBot Phase 6.1: Composite Indexes & PWA Mobile Optimization

[System Instruction: 
Please set this session name format exactly as: "AliaBot Phase 6.1: Composite Indexes & PWA Mobile Optimization".
Extract the core topic and ensure the UI title is set exactly as specified in the first line.]

안녕! 우리는 지금 AliaBot (PWA 지휘자 비서 앱) 프로젝트 개발을 계속 진행하고 있어.
작업을 시작하기 전에 프로젝트 내부 핵심 문서인 `Docs/NextSession_ToDo.md`와 `Docs/Agent_Memory.md`를 먼저 파싱하여 직전 세션(Phase 6.0)에서 구현된 GitHub Project Chat Bridge의 작동 구조를 정확히 인지해 줘.
그다음, 오늘 작업할 1) Firestore 복합 인덱스 배포 방안과 2) 오프라인 싱크(Offline Sync) 엔진의 충돌 해결 원리, 3) Web Wake Lock API를 활용한 모바일 백그라운드 STT 중단 방지 기술에 대해 먼저 명확히 설명하고 구현에 착수해 줘!
```
