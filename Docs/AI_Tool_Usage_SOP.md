---
title: "AI 도구 사용량·역할 분리 SOP (Cursor Pro + 다중 구독)"
date: 2026-06-02
type: sop
category: Operations
tags: [cursor, claude-code, chatgpt, gemini, antigravity, usage, pro]
summary: "Cursor Pro 이중 사용량 풀과 ChatGPT·Claude Code·Gemini Pro를 BYOK 없이 역할 분리하는 운영 SOP"
related_docs:
  - Docs/Session_SOP_Guidelines.md
  - Docs/VTL_VSOP_Writing_Guide.md
  - Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# AI 도구 사용량·역할 분리 SOP

> **대상:** Cursor Pro + ChatGPT Pro + Claude Code(Pro) + Gemini Pro + (선택) Antigravity  
> **원칙:** API 키(BYOK) 없이 **작업 유형별 도구 분리**로 한도 소진 방지  
> **참고:** [Cursor Models & Pricing](https://cursor.com/docs/models-and-pricing) · [Usage limits](https://cursor.com/help/models-and-usage/usage-limits)

---

## 1. 기준선 기록 (1회, 약 15분) — baseline-dashboard

### 1.1 대시보드 열기

1. 브라우저에서 [https://cursor.com/dashboard](https://cursor.com/dashboard) 로그인
2. **Usage** (또는 **Settings → Usage**) 메뉴 이동
3. Cursor 에디터: `Ctrl + ,` → **Usage** 탭에서도 두 풀 확인 가능

### 1.2 기록할 항목 (아래 표를 VTL에 복사·갱신)

| 항목 | 기록값 (사용자가 채움) | 메모 |
|------|------------------------|------|
| 플랜 | Pro ($20/월) | |
| **Auto + Composer 풀** 사용량 / 한도 | % 또는 잔여 | Composer 편중 시 여기 소모 |
| **API 풀** 사용량 / 한도 ($20/월 상당) | % 또는 잔여 | Sonnet/Opus/GPT **수동 선택** 시 소모 |
| Billing reset date (다음 리셋일) | YYYY-MM-DD | Manage Subscription에서 확인 |
| **On-demand** (초과 과금) | 켜짐 / 꺼짐 / 월 상한 $ | **권장: 끔** 또는 상한 설정 |
| Privacy Mode | 켜짐 / 꺼짐 | 필요 시 |

### 1.3 스크린샷 (선택)

- `Docs/Screenshots/YYYYMM/YYYYMMDD_Cursor_Dashboard_Usage_기준선.png`

### 1.4 기록 저장 위치

- **해석·요약:** [Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md](../Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md) §3 **Baseline Record**
- **원본 CSV (대시보드 Export):** `Inputs/cursor_usage/usage-events-YYYY-MM-DD.csv`  
  - `Outputs/` = AI가 정리한 문서 · `Inputs/` = 외부에서 들어온 사용량 원본 (다운로드 폴더 대신 프로젝트에 보관)

---

## 2. Cursor Pro — 두 사용량 풀 (핵심)

| 풀 | 언제 소모 | AliaBot 일상 |
|----|-----------|--------------|
| **Auto + Composer** | Agent에서 **Auto** 또는 **Composer** 선택 | **주력** (코드, npm, git, VTL 초안) |
| **API** | **Sonnet / Opus / GPT / Gemini** 등 **드롭다운에서 명시 선택** | **절제** (주 1회 이하 권장) |

**주의:** Composer만 많이 써도 **API $20 풀과는 별개**입니다. 두 풀을 **분리**해서 모니터링하세요.

### 2.1 Agent 모델 설정 (operate-auto-primary)

| 규칙 | 내용 |
|------|------|
| 기본 | **Auto** 유지 |
| Sonnet/Opus | **주 1회 이하**, 긴 설계·막힌 디버깅만 |
| 일상 작업 | AliaBot, Obsidian 정리, Priva 연동 → **Cursor Auto** |
| 금지 패턴 | Cursor에서 Sonnet/Opus를 **기본 모델**로 두기 (API 풀 급속 소진) |

---

## 3. Claude Code — 무거운 작업 분리 (claude-code-heavy)

| Cursor Agent (Auto) | Claude Code (구독) |
|---------------------|-------------------|
| 파일 수정, Phase 구현, 로컬 검증 | 30분+ 아키텍처, PDCA 전체 |
| `npm run dev`, Firestore/Notion | bkit 1.5.4 훅·스킬 (Claude Code 네이티브) |
| VTL 초안 | 대규모 리팩터·갭 분석 |

**전환 방법:** 같은 폴더 `Work01_Anti`에서 Claude Code 확장 또는 터미널 `claude` 실행.

**BYOK 없이:** Claude Code 세션은 **Claude Code 구독 한도** 사용 — Cursor API $20 풀과 **별도**.

---

## 4. Antigravity — Gemini 위주 (antigravity-gemini-only)

| 권장 | 비권장 |
|------|--------|
| Gemini 모델로 문서·브레인스토밍 | Claude/GPT를 Antigravity **기본 모델** |
| bkit-gemini 실험 (Gemini CLI) | 2026 I/O 이후 타 모델 대량 사용 (토큰 급증 경험) |

**이유:** Antigravity에서 non-Gemini 사용 시 할당량이 빠르게 소진된 경험 → Cursor에서도 **API 풀 남용**과 동일 패턴 회피.

---

## 5. 주간 점검 (5분/주) — weekly-usage-check

**매주 같은 요일** (예: 월요일) 1회:

1. [cursor.com/dashboard](https://cursor.com/dashboard) → Usage
2. 아래 체크:

| 확인 | 정상 | 조치 |
|------|------|------|
| Auto+Composer % | 급격한 증가 없음 | Agent `@` 파일 최소화, 컨텍스트 줄이기 |
| API 풀 | **월 중순 전 80% 미만** | Cursor에서 Sonnet/Opus **중단** → Claude Code로 이전 |
| 한도 알림 | 없음 | On-demand **켜지 말고** Claude Code/Gemini 앱 사용 |
| Auto+Composer 한도 알림 | 발생 | Pro+ 검토 또는 호출 빈도 감소 |

3. (선택) VTL §4 **Weekly Log**에 한 줄 기록

---

## 6. 4도구 역할 매트릭스 (BYOK 0단계)

| 작업 유형 | 1순위 도구 |
|-----------|------------|
| AliaBot 코드·Phase 5.x·로컬 검증 | **Cursor + Auto** |
| 긴 설계·PDCA·bkit | **Claude Code** |
| 요구사항·VSOP 문장·기획 | **ChatGPT** 또는 **Gemini** 앱 |
| Gemini·bkit-gemini | **Gemini CLI** / Antigravity(Gemini만) |
| git·배포 비교 | **Cursor Agent** |

### 구독 ↔ Cursor 연동 (현실)

| 구독 | Cursor에 구독 할당량 직접 연결 |
|------|-------------------------------|
| ChatGPT Pro | 불가 → Codex 확장 또는 ChatGPT 앱 |
| Claude Code Pro | 불가 → Claude Code 확장/CLI (권장) |
| Gemini Pro | 불가 → Gemini CLI / Antigravity |
| Cursor Pro | Auto+Composer 풀 + API $20 |

---

## 7. 한도 임박 시 (Phase C)

| 신호 | 행동 |
|------|------|
| API 풀 80% | Cursor frontier 모델 금지; Claude Code/Gemini로 이전 |
| Auto+Composer 알림 | Pro+ 검토 또는 Agent 빈도·컨텍스트 축소 |
| 여전히 부족 | **그때만** Anthropic BYOK 검토 (API 키는 앱 Pro와 별도 과금인 경우 많음) |

---

## 8. AliaBot·Obsidian·Priva 판단

| 프로젝트 | Cursor Auto | API Sonnet 시점 |
|----------|-------------|-----------------|
| AliaBot | 높음 | Notion CORS·복잡 라우팅 막힐 때만 |
| Obsidian 정리 | 높음 | 거의 불필요 |
| Priva RPA | 중간 | 장기 자동화·좌표 설계 → Claude Code |

**배포:** `master`(Vercel) vs `feature-ai-routing` 차이는 **git push/merge** 문제 — Cursor 사용량과 무관.

---

## 9. 문서화 (doc-on-unit-complete)

**주제·단원·Phase가 완전히 끝났을 때** (시간·세션 종료 기준 아님):

- VTL: `Outputs/YYYYMMDD_*_VTL.md`
- VSOP: 절차 확정 시 `Outputs/YYYYMMDD_*_VSOP.md`
- 가이드: [VTL_VSOP_Writing_Guide.md](VTL_VSOP_Writing_Guide.md)

본 SOP 단원 완료 시: [Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md](../Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md)

---

## 10. FAQ

**Q. Auto만 쓰면 Composer만 써서 금방 막히나요?**  
A. **Auto+Composer 전용 풀**이 있습니다. API $20과 별도입니다. 대시보드에서 **두 풀**을 보세요.

**Q. Claude in Cursor (Sonnet 선택)는 Claude Pro랑 같나요?**  
A. **아닙니다.** BYOK 없이 Sonnet 선택 시 **Cursor API 풀**에서 차감됩니다. Claude Pro 활용은 **Claude Code**가 맞습니다.

**Q. ChatGPT Pro를 Cursor에 넣을 수 있나요?**  
A. ChatGPT **앱 구독**은 Cursor API와 자동 연동되지 않습니다. Codex 확장 또는 ChatGPT 앱을 쓰세요.
