---
title: "TechLog: Cursor Pro + 다중 AI 구독 통합 사용 전략 VTL"
date: 2026-06-02
type: tech-log
category: Operations
subcategory: Cursor-Usage-Strategy
tags: [cursor, pro, auto, composer, claude-code, chatgpt, gemini, antigravity, usage]
created: 2026-06-02
ai_model: Cursor Agent (Auto)
workspace: Work01_Anti
session: Cursor_UserRules_And_Usage_Plan
summary: "Cursor Pro 이중 풀 이해, BYOK 없이 4도구 역할 분리, Antigravity 토큰 소진 패턴 회피 실행 계획"
related_docs:
  - Docs/AI_Tool_Usage_SOP.md
  - Docs/Session_SOP_Guidelines.md
  - Docs/VTL_VSOP_Writing_Guide.md
---

# VTL: Cursor Pro + 다중 AI 구독 통합 사용 전략

---

## 1. 배경 (Context)

| 항목 | 내용 |
|------|------|
| 우려 | Auto → Composer 편중 시 Cursor 사용 한도 소진 |
| 구독 | Cursor **Pro**, ChatGPT Pro, Claude Code(Pro), Gemini Pro, (과거) Antigravity |
| Antigravity 교훈 | Gemini 외 Claude/GPT 사용 시 토큰·할당량 급속 소진 (2026 I/O 이후) |
| 선호 | **BYOK 없이** 역할 분리로 통합; AliaBot·Obsidian·Priva는 중량 작업 아님 |
| 산출물 | [Docs/AI_Tool_Usage_SOP.md](../Docs/AI_Tool_Usage_SOP.md) (운영 SOP) |

---

## 2. 핵심 결론 (요약)

1. Cursor Pro는 **Auto+Composer 풀**과 **API $20 풀**이 **분리**됨.
2. Composer만 써도 **API $20이 즉시 소진되지는 않음** — 대시보드에서 두 풀을 따로 볼 것.
3. BYOK 없이 “네 구독을 Cursor에 합침”은 **불가** → **도구별 역할 분리**가 정답.
4. Cursor에서 Sonnet/Opus 수동 선택 = **API 풀 소모** (Claude Code 구독과 별도).
5. 일상: **Cursor Auto** / 무거움: **Claude Code** / 문서: **ChatGPT·Gemini 앱** / Antigravity: **Gemini만**.

---

## 3. Baseline Record (사용자 1회 기록)

> **파일 위치:** `Outputs/20260602_Cursor_Pro_Usage_Strategy_VTL.md` (확장자는 `.md`, VTL 문서 형식)  
> **적는 곳:** 아래 **§3 표** + (선택) **§3.3 스냅샷 로그** + 이후 **§4 Weekly Log**

| 항목 | 기록일 | 값 |
|------|--------|-----|
| 기록일 | 2026-06-02 | 2026-06-02 (캡처 기준) |
| 플랜 | | **Pro** |
| 대시보드 기간 (캡처) | | **7d** — 2026-05-28 ~ 2026-06-03 |
| **Total spend (Included)** | | **US$7.75** (On-demand 아님) |
| 요청 로그 Model | | **auto** (Jun 3 다수, Type: Included) |
| Auto + Composer 풀 (에디터 Usage 탭) | | _(Ctrl+, → Usage에서 % 확인 후 추가)_ |
| API 풀 (에디터 Usage 탭) | | _(동일 — $20 상당 풀 % 확인 후 추가)_ |
| 다음 리셋일 (Billing reset) | | _(Settings → Manage Subscription)_ |
| On-demand 과금 | | 캡처: **Included만** 표시 → 초과 과금 없음 (좋음) |
| Privacy Mode | | |

### 3.1 대시보드 화면 → 표에 옮기는 법 (상세)

**어디를 연다:** 브라우저 [cursor.com/dashboard/usage](https://cursor.com/dashboard/usage) (또는 `cursor.com/cn/dashboard/usage`)

| 화면에 보이는 것 | VTL에 적는 곳 | 의미 |
|------------------|---------------|------|
| **Total spend** 카드 (예: US$7.75) | §3 표 `Total spend (Included)` | 이 기간 **플랜 포함 사용분**을 달러로 환산한 누적 |
| **Included** (같은 금액) | 위와 동일 | **추가 청구(On-demand)가 아님** — 구독 한도 안에서 쓴 것 |
| **On-demand** 카드 (있다면) | `On-demand 과금` | 0이거나 비어 있으면 **초과 과금 없음** |
| 기간 **7d / 30d** | `대시보드 기간` | 비교할 때 **같은 기간**으로 맞출 것 |
| 그래프 **Group by: Model** | §3.3 `주 사용 모델` | **auto** = Agent에서 Auto 라우터 사용 |
| 아래 표 **Date / Type / Model** | §3.3 스냅샷 로그 | Type **Included** + Model **auto** → 일상 Auto 사용 패턴 |
| (에디터) `Ctrl+,` → **Usage** | §3 `Auto+Composer 풀` / `API 풀` | 웹 대시보드와 **두 풀 %**가 따로 보일 수 있음 — **둘 다 기록** |

**$7.75 ≈ 40%의 의미 (해석 주의):**

- Pro에 **월 $20 상당 API 풀**이 있으므로, **만약** 이 $7.75가 전부 API 풀만 잡아먹는다면 → 7.75 ÷ 20 ≈ **39%** (말씀하신 “거의 40%”와 비슷).
- 실제로는 **Auto 사용**이면 **Auto+Composer 풀**에서 소모되는 경우가 많고, 대시보드 **Total spend**는 **포함 사용 전체를 달러로 보여 주는 요약**일 수 있습니다.
- **정확한 %**는 에디터 **Settings → Usage**에서 **두 풀을 각각** 확인하는 것이 가장 좋습니다.

### 3.2 기록 절차 (체크리스트)

- [x] dashboard Usage 화면 확인 (2026-06-02 캡처)
- [x] §3 표 상단 항목 작성 (7.75 / auto / Included)
- [ ] 에디터 `Ctrl+,` → Usage에서 **Auto+Composer %**, **API %** 추가 기입
- [ ] Manage Subscription에서 **다음 리셋일** 기입
- [x] Usage Events CSV → `Inputs/cursor_usage/usage-events-2026-06-03.csv` (2026-06-03 확인)
- [x] 대시보드 수치는 §3·§3.3 텍스트로 기록 (**이미지 파일 불필요**)
- [ ] 주간 점검 시 §4 Weekly Log에 누적

### 3.3 Dashboard 스냅샷 로그 (2026-06-02 캡처)

| 날짜 | Type | Model | 비고 |
|------|------|-------|------|
| Jun 3, 11:47 AM | Included | auto | |
| Jun 3, 11:41 AM | Included | auto | |
| Jun 3, 11:34 AM | Included | auto | |
| Jun 3, 11:27 AM | Included | auto | Agent 집중 사용일 |

> 그래프: 5/28~6/3 누적 **Included spend → $7.75**, Model **default/auto** 위주.

### 3.4 Usage Events CSV (2026-06-03보내기)

> **보관 경로 (외부 유입 → Inputs):** [`Inputs/cursor_usage/usage-events-2026-06-03.csv`](../Inputs/cursor_usage/usage-events-2026-06-03.csv)  
> `Outputs/` = AI가 정리한 VTL·VSOP · `Inputs/` = 대시보드 Export 등 **원본**. 파일명은 Export 그대로. **이미지 불필요** — §3.3·§3.4 요약으로 충분.

| 항목 | CSV에서 확인된 값 |
|------|-------------------|
| 행 수 | **64건** (헤더 제외) |
| Model | **전부 `auto`** (Sonnet/Opus/GPT 수동 선택 **없음**) |
| Kind | **`Included` 46건** + **`free` 18건** (6/1 초반) |
| Max Mode | 전부 **No** |
| Cost 열 | Included 행 → `Included` / free 행 → **$0.03~$0.26** (소액, 6/1) |

**해석:**

- **Included** = Pro 포함 한도 안 (대시보드 $7.75와 동일 계열).
- **free** (6/1 새벽) = 전환·체험 구간으로 보이며, 달러 Cost 합계는 **약 $2~3 수준** (행별 소액).
- **토큰 집중:** 6/2 02:13~02:34, 6/3 02:34~03:02 등 **Cache Read·Input이 큰 Agent 세션** (예: Cache Read **300만+** 토큰/건) → 짧은 기간에 $7.75까지 오른 **주된 원인**.
- **API 풀(Sonnet) 직접 사용 흔적 없음** → 역할 분리 SOP대로 **Auto만** 쓴 기록과 일치.

**VTL에 적을 때:** §3 표 + 이 §3.4 요약 + (선택) CSV 파일 경로만 남기면 **충분**. 매주은 동일 CSV 재-export 후 §4에 **Included 건수·대표 Model**만 한 줄 추가.

---

## 4. Weekly Log (주 5분 점검)

| 주차 (YYYY-MM-DD) | Auto+Composer % | API % | 조치 |
|------------------|-----------------|-------|------|
| _(예: 2026-06-09)_ | | | |
| | | | |

---

## 5. 실행 Phase 요약

| Phase | 기간 | 내용 |
|-------|------|------|
| A | 이번 주 | Baseline 표 §3 작성 |
| B | 2~4주 | Auto 주력, Sonnet 주 1회 이하, Claude Code 설계 주 1~2회 |
| C | 트리거 시 | API 80% → frontier 중단; Auto 풀 알림 → Pro+ 또는 빈도 축소 |
| D | 단원 완료 | 본 VTL §4 갱신 + SOP 준수 여부 점검 |

---

## 6. 구현 산출물 (이번 Agent 작업)

| 파일 | 역할 |
|------|------|
| [Docs/AI_Tool_Usage_SOP.md](../Docs/AI_Tool_Usage_SOP.md) | 일상·주간·도구 분리 **실행 SOP** |
| [Docs/Session_SOP_Guidelines.md](../Docs/Session_SOP_Guidelines.md) §5.4 | SOP 링크 |
| 본 VTL | 전략·Baseline·Weekly Log 템플릿 |

---

## 7. FAQ

| 질문 | 답 |
|------|-----|
| Composer만 쓰면 API $20 다 쓰나? | **아니요** — 별도 풀 (에디터 Usage에서 각각 확인) |
| Claude in Cursor = Claude Pro? | **아니요** — Sonnet 수동 선택 시 **Cursor API 풀**; Claude **Code 구독**은 별도 |
| ChatGPT Pro를 Cursor에? | **불가**(앱 구독 ≠ Cursor) — ChatGPT 앱 또는 Codex 확장 |
| Antigravity에서 뭘 쓰나? | **Gemini 위주**; 2.0 이후 타 모델 제한과 유사한 방향 |
| 2~3일에 $7.75면 너무 빠른가? | Cursor 전환·Agent 집중 기간이면 가능; **Sonnet 남용 중단**, `@`·긴 세션 줄이기 |

---

## 8. 사용자 확인 (2026-06-02) — Antigravity vs Cursor

| | Antigravity 2.0+ | Cursor Pro |
|--|------------------|------------|
| 타 모델(Claude/GPT) | 예전보다 **엄격** (토큰/할당량) | Cursor에서 고르면 **Cursor 쪽 과금**(API 풀), 외부 Pro와 **미연동** |
| BYOK 없이 “내 구독 합치기” | 어려움 | **어려움** → 역할 분리 SOP |
| 권장 | Gemini 위주 | **Auto** 일상 + Claude Code 무거운 작업 |
