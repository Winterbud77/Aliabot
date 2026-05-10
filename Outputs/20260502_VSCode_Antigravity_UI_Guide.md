---
title: "TechLog: VS Code 및 Antigravity UI 구조 이해와 레이아웃 관리 완벽 가이드"
date: 2026-05-02
type: ai-chat-note
category: 개발환경
subcategory: VSCode
tags: [vscode, ui, antigravity, terminal, layout, split-screen, architecture]
created: 2026-05-02
ai_model: Gemini 3.1 Pro (Low) (Antigravity)
workspace: Winterbud-03MS
summary: "단편적인 해결책을 넘어, VS Code의 5대 핵심 화면 영역(Activity Bar, Primary/Secondary Sidebar 등)의 명칭과 원리를 이해하고, 다중 AI 에이전트 관제탑을 스스로 세팅할 수 있도록 시각화하여 정리한 심층 가이드입니다."
---

# 🖥️ [TechLog] VS Code 및 Antigravity UI 구조 이해와 레이아웃 관리 가이드

> [!TIP]
> **문서 목적 및 작성 배경:**
> 당장의 에러 해결(Quick-fix)보다는 근본적인 '원리'와 '개념'을 이해했을 때 훨씬 더 높은 응용력을 발휘하시는 사용자님의 성향에 맞추어, 이전의 단편적인 가이드를 **구조적이고 시각적인 심층 가이드**로 전면 개편했습니다.

---

## 📐 1. VS Code 화면 구조의 핵심 개념 (Terminology)

창이 꼬였을 때 스스로 복구하려면 각 영역의 정확한 명칭과 역할을 아는 것이 필수입니다. VS Code 화면은 크게 **5가지 블록**으로 조립되어 있습니다.

```mermaid
graph TD
    A[Activity Bar<br>(아이콘 얇은 줄)] -->|클릭 시 펼쳐짐| B[Primary Side Bar<br>(메인 파일/메뉴 창)]
    B --> C[Editor Area<br>(중앙 메인 작업창)]
    C --> D[Secondary Side Bar<br>(우측 보조: AI 관제탑)]
    C --> E[Panel<br>(하단: 터미널 및 로그)]
```

1. **Activity Bar (액티비티 바):** 메인 메뉴 아이콘(문서 2개 겹친 모양, 확장 프로그램 등)만 모여 있는 얇은 기둥입니다.
2. **Primary Side Bar (기본 사이드바):** 액티비티 바의 아이콘을 누르면 펼쳐지는 넓은 창입니다. (예: `Explorer(탐색기)`)
3. **Editor Area (편집기 영역):** 코드를 작성하고 `.md` 문서를 읽는 중앙의 가장 넓은 화면입니다.
4. **Secondary Side Bar (보조 사이드바):** 화면 우측에 위치하며, 주로 **Antigravity (안경 쓴 에이전트)** 같은 AI 챗봇의 본거지로 사용됩니다.
5. **Panel (패널):** 화면 맨 아래에 위치하며 명령어(CLI)를 치는 `Terminal(터미널)`이 상주하는 곳입니다.

---

## 🚑 2. 상황별 레이아웃 복구 원리 및 해결책

### 🚨 상황 A: 액티비티 바(얇은 줄)가 엉뚱한 곳에 붙어있을 때
최신 VS Code는 공간 절약을 위해 액티비티 바를 기본 사이드바 위/아래로 합쳐버리는 기능이 있습니다.
*   **원리:** 액티비티 바의 '위치(Position)' 속성이 변경된 것입니다.
*   **해결책:** 
    1. 아이콘들이 모여있는 곳 빈 공간에 **마우스 우클릭**
    2. **`Activity Bar Position (액티비티 바 위치)`** 선택
    3. **`Default`** 또는 **`Side (측면)`**으로 변경하여 맨 왼쪽 얇은 기둥 형태로 복구.

### 🚨 상황 B: 탐색기(Explorer)나 터미널이 엉뚱한 패널로 이사 갔을 때
*   **원리:** 각 창의 이름표(탭)를 드래그 앤 드롭하거나, 'Move to(이동)' 기능으로 블록의 위치가 섞인 것입니다.
*   **해결책 (우클릭 이동):** 잘못된 곳에 있는 이름표(예: 터미널) 우클릭 -> **`Move to Panel (패널로 이동)`** 선택.
*   **최후의 수단 (공장 초기화):** 창이 너무 꼬여서 도저히 못 찾겠다면, 
    1. `F1` (또는 `Ctrl` + `Shift` + `P`) 키 누름
    2. **`View: Reset View Locations (보기: 뷰 위치 재설정)`** 검색 후 엔터. 1초 만에 위에서 배운 5가지 기본 구조로 완벽히 리셋됩니다.

---

## 🚀 3. 고수들의 '다중 AI 에이전트' 관제탑 세팅법

개념을 이해했으니, 터미널 블록을 떼어내어 메인 에디터 영역으로 조립해 보겠습니다.

> [!IMPORTANT]
> **작업 목표:** 우측 보조 사이드바에는 Antigravity(UI)를 띄우고, 중앙 메인 영역에는 Claude Code(터미널)를 띄워 **동시 병렬 지휘소** 구축하기.

1.  **터미널 확보:** `Ctrl` + `~` 를 눌러 하단 `Panel`에 터미널을 엽니다.
2.  **블록 분리 및 이동:** 하단 터미널 이름표(탭) 위에서 마우스 우클릭 후 **`Move into Editor Area (편집기 영역으로 이동)`**를 클릭합니다.
3.  **화면 분할:** 중앙 화면으로 올라온 터미널 창을 마우스로 드래그하여 좌/우로 분할(Split)합니다.
4.  **완성:** 왼쪽 눈으로는 터미널(Claude CLI)을 감시하고, 오른쪽 눈으로는 보조 사이드바의 Antigravity와 대화하는 완벽한 아키텍처가 완성됩니다.
