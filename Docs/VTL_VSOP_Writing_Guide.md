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

## 2) 저장 위치 원칙 (Git에 남게)

- **VTL/VSOP 저장 위치(원칙)**: `Outputs/`
  - 이유: Chat History/Transcript는 Git에 자동 포함되지 않음 → 장기 보존은 `Outputs/`가 핵심
- **스크린샷 저장 위치(권장)**: `Docs/Screenshots/YYYYMM/`
  - 파일명 규칙은 `Docs/Session_SOP_Guidelines.md` 참고

---

## 3) 생성 트리거(언제 문서를 추가하나)

**시간(세션 종료 시각)이 아니라, 주제·단원·Phase가 “완전히 끝났을 때”** 생성합니다.  
(사용자 확인 2026-06-02: 매 작업 종료마다가 아니라 **기능/주제 단위 완료** 기준)

`Docs/Session_SOP_Guidelines.md`의 운영 원칙을 따르되, 아래를 우선합니다.

| 트리거 | 생성 | 비고 |
|--------|------|------|
| **Phase·주제·기능 단위 완료** | VTL | 과정·원인·해결·스크린샷 |
| **검증·설정·배포 절차가 확정됨** | VSOP | 재현 가능한 Step-by-Step |
| **주제 변경 + 이전 주제 마무리** | VTL (+ 필요 시 VSOP) | 이전 주제 VTL을 먼저 닫고 새 주제 시작 |
| **트러블슈팅 해결** | 해당 주제 VTL에 Issue 섹션 | 별도 “시간” 트리거 없음 |

**하지 않는 것:** 채팅만 닫았다고 VTL/VSOP 자동 생성 (맥락 없는 시간 기준 X)

---

## 4) 파일명 규칙 (Outputs)

아래 패턴을 권장합니다(레포에 이미 존재하는 패턴 기준).

- **VTL**: `Outputs/YYYYMMDD_프로젝트_주제(or Phase)_..._VTL.md`
  - 예: `Outputs/20260601_AliaBot_Phase52_LocalVerify_VTL.md`
- **VSOP**: `Outputs/YYYYMMDD_프로젝트_주제(or Phase)_..._VSOP.md`
  - 예: `Outputs/20260601_AliaBot_Phase52_LocalVerify_VSOP.md`

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

