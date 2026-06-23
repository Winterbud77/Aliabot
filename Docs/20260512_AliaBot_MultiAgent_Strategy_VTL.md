# 🧠 AliaBot Conductor: Multi-Agent 협업 및 세션 관리 전략 (VTL)

> **문서 목적:** Antigravity라는 단일 인터페이스 환경에서 Gemini, ChatGPT, Claude 등 서로 다른 AI 모델을 교체하며 사용할 때 발생하는 데이터 저장 구조와 지식 공유 메커니즘을 심층 분석하고 기록합니다.

---

## 1. Antigravity 통합 로그 시스템 분석 (Unified Logging)

Antigravity 내에서 모델을 스위칭하거나 대화 세션을 분리할 때, 데이터가 물리적으로 어떻게 저장되는지에 대한 기술적 분석입니다.

### 📁 물리적 저장 경로 (Physical Storage Path)
모든 대화 기록(Logs)과 에이전트의 기억(Memory)은 다음의 공통 루트 하위에 저장됩니다.
- **Root Path:** `C:\Users\eugene\.gemini\antigravity\brain\`
- **구조:** `brain / [Session_ID] / .system_generated / logs / overview.txt`

### 🔄 모델 스위칭 시의 맥락 유지 (Context Switching)
- **메커니즘:** Antigravity 창 내부에서 모델만 변경(예: Gemini ↔ Claude)할 경우, **Session ID가 유지**됩니다.
- **결과:** 새 모델이 로드될 때 동일한 `overview.txt`를 읽어 들여 이전 모델과의 대화 내용을 학습하므로, **맥락(Context)이 완벽하게 승계**됩니다.

---

## 2. 세션(Session) 분리와 파일 공유 메커니즘

"대화창을 새로 만든다(New Conversation)"는 것은 기술적으로 새로운 Session ID를 생성함을 의미하며, 이는 다음과 같은 특징을 가집니다.

### 🧱 지식의 격리 (Knowledge Isolation)
- **상태:** 세션 A(ChatGPT)와 세션 B(Claude)는 각자의 `overview.txt`를 가집니다.
- **현상:** 세션 A에서 나눈 심오한 대화 내용을 세션 B는 알지 못합니다. (대화 수준의 격리)

### 🤝 데이터의 결합 (Data Integration)
- **공통 분모:** 모든 세션은 사용자님의 로컬 프로젝트 폴더(`Work01_Anti`)를 공유합니다.
- **결과:** 세션 A가 수정한 코드(`App.jsx`)나 문서(`implementation_plan.md`)를 세션 B가 읽어 들여 **현재 프로젝트의 물리적 상태**를 파악하는 방식으로 간접적인 지식 공유가 일어납니다.

---

## 3. 효율적인 업무 분장 (Orchestration Strategy)

지휘자(Conductor)로서 어떤 모델에게 어떤 악보(업무)를 줄 것인지에 대한 전략적 제언입니다.

| 구분 | 전략적 역할 | 추천 모델 | Git 브랜치 전략 |
| :--- | :--- | :--- | :--- |
| **정밀 설계** | 시스템 아키텍처, 보안 규칙, 복잡한 로직 설계 | Claude (Sonnet 3.5) | `master` 또는 `develop` |
| **UI/UX 구현** | CSS 스타일링, 리액트 컴포넌트 구조화 | ChatGPT (GPT-4o) | `feature-ui` |
| **실행 및 배포** | 터미널 명령 실행, Git Push, PWA 설정 | Gemini (Pro/Flash) | `master` |

---

## 4. 다중 모델 협업 시의 GitOps 표준

서로 다른 세션에서 여러 모델이 동시에 코드를 수정할 때 발생하는 충돌(Conflict)을 방지하기 위한 표준입니다.

1. **기능별 브랜치(Feature Branch):** 세션을 분리하여 서로 다른 모델에게 일을 시킬 때는 반드시 `feature-notes`, `feature-calendar` 등 기능별 브랜치를 생성하여 작업한다.
2. **단일 브랜치 운영:** 동일한 대화 세션 내에서 모델만 스위칭할 때는 `master` 브랜치에서 순차적으로 작업하는 것이 효율적이다.
3. **최종 통합(Merge):** 여러 모델의 작업물을 합칠 때는 가장 똑똑한 모델(Pro High 또는 Claude Sonnet)을 통해 코드 충돌을 해결하고 일관성(Consistency)을 검토한다.

---

> [!TIP]
> **Antigravity Conductor의 철학:** "대화는 세션별로 정교하게 격리하되, 결과물(파일)은 프로젝트 폴더 내에서 통합 관리함으로써 파편화되지 않은 하나의 완전한 제품을 완성한다."
