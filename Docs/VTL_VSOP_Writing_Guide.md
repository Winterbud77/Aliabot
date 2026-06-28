---
title: "VTL/VSOP 작성 규칙 (Work01_Anti)"
date: 2026-06-02
type: guideline
category: Documentation
tags: [vtl, vsop, sop, guideline, aliabot, antigravity, cursor]
created: 2026-06-02
summary: "Work01_Anti에서 VTL(과정 기록)과 VSOP(따라하기 절차)를 일관되게 생성/보존하기 위한 규칙 모음"
related_docs:
  - Docs/Session_SOP_Guidelines.md
  - Docs/AI_Tool_Usage_SOP.md
  - Outputs/20260601_AliaBot_Phase52_LocalVerify_VTL.md
  - Outputs/20260601_AliaBot_Phase52_LocalVerify_VSOP.md
  - Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# VTL/VSOP 작성 규칙 (Work01_Anti)

> **목표:** Cursor/Antigravity 대화는 앱 내부에만 남기 쉬우므로, 중요한 작업 흐름과 검증 절차를 **Git에 남는 문서(VTL/VSOP)**로 “의도적으로” 보존합니다.

---

## 1) 용어 정의 (둘의 차이)

- **VTL (Visual Tech Log)**: 문제 해결/개선의 **과정 기록**
  - 왜 이런 가설을 세웠는지, 어떤 증거를 봤는지, 무엇을 시도했고 무엇이 해결됐는지를 남김
  - 스크린샷/로그/근거 링크를 포함
- **VSOP (Visual Standard Operating Procedure)**: 누구나 따라할 수 있는 **절차(레시피)**
  - “Step 1~N” 형태로 재현 가능한 실행 순서 + 실패 시 FAQ 포함
  - 비개발자도 따라할 수 있게 작성 (용어 최소화, 클릭/입력 위치 명확화)

---

## 2) 저장 위치 원칙 (Git 연동 일원화)

- **VTL/VSOP 저장 위치(원칙)**: `Docs/`
  - 이유: 모든 문서는 Git 버전 관리와 완벽하게 추적되는 `Docs/` 폴더 내에 일원화하여 보존합니다.
  - OneDrive Obsidian 연동: `Docs/`에 작성된 마스터 파일들은 동기화 스크립트(`Docs/sync-to-obsidian.ps1`)를 통해 OneDrive Obsidian Vault(`C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\AliaBot_Docs\`)로 미러링하여 관리합니다.
- **스크린샷 저장 위치(권장)**: `Docs/Screenshots/YYYYMM/`
  - 파일명 규칙은 `Docs/Session_SOP_Guidelines.md` 참고

---

## 3) 생성 트리거(언제 문서를 추가하나)

**시간(세션 종료 시각)이 아니라, 주제·단원·Phase가 “완전히 끝났을 때”** 생성합니다.  
또한, **기존 작업의 최종 종결 및 확인 시점에는 발견된 모든 개선사항이나 보완사항을 반영한 VTL 및 SOP를 신규 생성하거나 기존 문서를 완전하게 보완**하는 작업을 필수적으로 수행합니다.
(사용자 확인 2026-06-02/2026-06-14: 매 작업 종료마다가 아니라 **기능/주제 단위 완료 및 최종 보완 종결** 기준)

`Docs/Session_SOP_Guidelines.md`의 운영 원칙을 따르되, 아래를 우선합니다.

| 트리거 | 생성 | 비고 |
|--------|------|------|
| **Phase·주제·기능 단위 완료** | VTL | 과정·원인·해결·스크린샷 |
| **검증·설정·배포 절차가 확정됨** | VSOP | 재현 가능한 Step-by-Step |
| **주제 변경 + 이전 주제 마무리** | VTL (+ 필요 시 VSOP) | 이전 주제 VTL을 먼저 닫고 새 주제 시작 |
| **최종 검증 및 트러블슈팅 종결** | VTL/SOP 보완 및 신규 반영 | 오늘 세션의 최종 개선사항 보완 |
| **트러블슈팅 해결** | 해당 주제 VTL에 Issue 섹션 | 별도 “시간” 트리거 없음 |

**하지 않는 것:** 채팅만 닫았다고 VTL/VSOP 자동 생성 (맥락 없는 시간 기준 X)

---

## 4) 파일명 규칙 (Docs)

아래 패턴을 권장합니다(레포에 이미 존재하는 패턴 기준).

- **VTL**: `Docs/YYYYMMDD_프로젝트_주제(or Phase)_..._VTL.md`
  - 예: `Docs/20260614_AliaBot_Phase5_Serverless_Gemini_Debug_VTL.md`
- **VSOP**: `Docs/YYYYMMDD_프로젝트_주제(or Phase)_..._VSOP.md`
  - 예: `Docs/20260614_AliaBot_Phase5_Serverless_Gemini_Setup_SOP.md`

---

## 5) Frontmatter(YAML) 최소 표준

### 5.1 VTL 템플릿

```yaml
---
title: "TechLog: {프로젝트} {주제/Phase} {짧은 설명} VTL"
date: YYYY-MM-DD
type: verify-log | tech-log
category: {프로젝트명}
subcategory: {Phase/주제}
tags: [프로젝트, phase, 키워드...]
created: YYYY-MM-DD
ai_model: Cursor Agent (Auto)  # 또는 고정 모델명
workspace: {레포/워크스페이스}
session: {세션명}
summary: "한 줄 요약"
related_docs:
  - outputs/다른VTL.md
  - outputs/관련VSOP.md
  - docs/Session_SOP_Guidelines.md
---
```

### 5.2 VSOP 템플릿

```yaml
---
title: "VSOP: {프로젝트} {주제/Phase} — {절차명}"
date: YYYY-MM-DD
type: sop
category: {프로젝트명}
subcategory: {Phase/주제}
tags: [sop, vsop, non-developer, 키워드...]
created: YYYY-MM-DD
ai_model: Cursor Agent (Auto)
related_vtl: outputs/관련VTL.md
summary: "비개발자도 따라할 수 있는 절차 요약"
---
```

---

## 6) VTL 본문 섹션 표준 (권장)

아래 구조를 기본으로 하고, 필요에 따라 섹션을 추가/축소합니다.

1. **세션 맥락(Context)**: “왜/무엇을/어디서” 했는지 한 눈에
2. **정적 코드 리뷰(선택)**: 실행 전 체크(리스크/가설) — 런타임 검증과 구분
3. **런타임 검증 체크리스트**: PASS/FAIL 갱신 가능한 표 형태(사용자 실행)
4. **문제 발생 시 기록 템플릿**: Issue #N 형태(아래 템플릿 재사용)
5. **세션 기록 위치**: transcript/Chat History는 Git이 아니라는 경고 포함
6. **결과 요약(PASS/FAIL)**: 최종 결론 표(업데이트 대상)
7. **다음 액션**: 다음 세션에 할 일(짧게)

### Issue 기록 템플릿(복붙용)

```markdown
### Issue #N: [한 줄 요약]
- **증상:**
- **재현 단계:**
- **Console 로그:** (전문 붙여넣기)
- **스크린샷:** `Docs/Screenshots/YYYYMM/...png`
- **가설:**
- **시도한 해결:**
- **최종 원인:**
- **해결:**
- **학습/FAQ(다음에 한 줄):**
```

---

## 7) VSOP 본문 섹션 표준 (권장)

- 상단에 **대상/소요시간/준비물**을 먼저 고정
- Step은 **번호로 끊고**, 각 Step마다 **“무엇을 확인해야 성공인지”**를 명시
- 실패 시 FAQ는 **표**로 짧게(증상 → 확인/조치)
- 스크린샷은 Step마다 **1장 권장**(최소: 핵심 설정/성공 화면/에러 화면)

---

## 8) 스크린샷/링크 삽입 규칙

`Docs/Session_SOP_Guidelines.md`의 형식을 그대로 사용합니다.

```markdown
### 설정 화면 캡처
![설명 텍스트](../Docs/Screenshots/202605/20260530_GeminiAPI_키발급_다이얼로그.png)

> [!TIP]
> 여기서 무료 티어는 {주의사항}...
```

---

## 9) 운영 팁 (Cursor 기준)

- **Chat as editor tabs**를 켜면 대화가 에디터 탭으로 열려 관리가 편하지만, 문서 보존은 별개입니다.
- 중요한 결론/절차는 반드시 **VTL/VSOP로 outputs에 남기기**(이 문서의 핵심 원칙).

---

## 10) 상세화 및 가시성 원칙 (Detailing & Visibility Principle)

비개발자나 처음 접하는 작업자가 보더라도 프로젝트의 원리를 파악하고 절차를 정상 재현할 수 있도록 다음과 같은 상세 기준을 준수하여 작성해야 합니다.

### 10.1 물리 절대 경로의 의도적 명시
- 유실 복구나 설정 변경의 대상이 되는 파일과 폴더의 윈도우 파일 시스템 실제 절대 경로를 생략 없이 기술합니다.
- 예시:
  - `.pb` 대화 파일: `C:\Users\eugene\.gemini\antigravity\conversations\<Session-UUID>.pb`
  - 에이전트 대화 로그: `C:\Users\eugene\.gemini\antigravity\brain\<Session-UUID>\.system_generated\logs\overview.txt`

### 10.2 트러블슈팅 실패 내역의 원리 서술
- 단순히 "백그라운드 스크립트 실행에 실패함"과 같이 요약하지 말고, 왜 실패했는지 윈도우 OS 수준의 원리(예: `Job Object`에 의한 하위 프로세스 강제 종료 메커니즘)를 상세하게 설명하여 실패의 구조적 필연성을 밝힙니다.

### 10.3 원문 명령어 스니펫(Snippet) 제공
- 따라 해야 하는 터미널 명령어는 생략이나 축약 없이 비개발자가 복사-붙여넣기(`Copy & Paste`)하여 바로 쓸 수 있는 원문 형태로 포함합니다.
- 예시: `attrib +r "C:\Users\eugene\.gemini\antigravity\conversations\<UUID>.pb"`

### 10.4 시각적 도식화 (Mermaid 활용)
- 데이터의 이동 경로, 프로세스의 순서, 혹은 복원 아키텍처 흐름을 파악하기 쉽도록 마크다운 내에 Mermaid 시퀀스 다이어그램이나 플로우차트를 포함하여 시각적 직관성을 제공합니다.

