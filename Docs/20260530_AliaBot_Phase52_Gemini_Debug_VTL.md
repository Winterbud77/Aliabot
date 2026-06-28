---
title: "TechLog: AliaBot Phase 5.2 - Gemini API 연동 디버깅 VTL"
date: 2026-05-30
type: debug-log
category: AliaBot
subcategory: AI-Integration
tags: [aliabot, gemini, api, debugging, phase5.2, rpa]
created: 2026-05-30
ai_model: Claude Sonnet 4.6 (Antigravity)
workspace: Winterbud77/AliaBot
summary: "Gemini API 연동 후 AI 태깅/요약 기능이 작동하지 않아 디버깅한 전체 과정. 세 가지 복합 원인(모델 종료, 토큰 부족, JSON 파싱 오류)을 순차적으로 발견하고 해결함."
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# 🐛 [TechLog] AliaBot Phase 5.2 — Gemini AI 태깅 디버깅 기록

> [!NOTE]
> **문서 성격 (Debug Log):**
> 이 문서는 2026-05-30 세션에서 Gemini AI 태깅 기능이 작동하지 않는 문제를 
> 발견하고 해결하는 전 과정을 기록한 디버깅 VTL입니다.
> 서브에이전트(Antigravity 내부 브라우저 자동화)의 지시/응답 내용도 포함합니다.

---

## 🗂️ 1. 문제 상황 (Problem Statement)

**증상:** 메모 추가 후 AI 태그(`#태그`)와 한 줄 요약이 나타나지 않음
**발생 메모:** #32, #33, #34, #35, #36, #37번 (API 키 입력 후에도 동일)
**환경:** AliaBot v2.1, `feature-ai-routing` 브랜치, localhost:5174

---

## 🔍 2. 원인 분석 과정

### Step 1: API 키 형식 오인 (잘못된 방향)

**초기 진단 (오진):** `AQ.Ab8R...` 형식의 키가 OAuth 토큰이라고 판단하여
`AIzaSy...` 형식의 키를 찾으라고 안내함.

**실제 사실:**
> Google AI Studio가 2025년 하반기부터 새로운 형식의 API 키를 발급하기 시작.
> `AQ.Ab8R...` 형식도 유효한 Gemini API 키임.
> 두 개의 키가 AI Studio에 등록된 이유:
> - `...xIZA` (Gemini API Key): AI Studio에서 직접 생성 → 정상 키
> - `...aiuA` (AliaBot-Dev): Google Cloud Console 경유 생성 → 동일하게 유효한 키

**교훈:** API 키 형식이 변경되었어도 AI Studio 목록에 있는 키는 모두 유효하다.

---

### Step 2: 브라우저 콘솔 에러 확인

서브에이전트를 통해 F12 → Console 탭 내용 수집:

```
Failed to load resource: 404 ()
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...

Gemini 분석 실패: models/gemini-1.5-flash is not found for API version v1beta
```

**원인 #1 확정:** `gemini-1.5-flash` 모델이 **서비스 종료(Deprecated)**되어 404 반환

---

### Step 3: 모델명 교체

**변경 내용** (`src/api/gemini.js`):
```diff
- 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
+ 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
```

**Gemini 모델 현황 (2026년 5월 기준):**
| 모델 | 상태 | 추천 용도 |
|---|---|---|
| `gemini-1.5-flash` | ❌ 종료 | - |
| `gemini-2.0-flash` | ⚠️ 2026-06-01 종료 예정 | - |
| `gemini-2.5-flash` | ✅ 현재 권장 | 범용, 빠른 응답, 무료 티어 |
| `gemini-2.5-pro` | ✅ 안정적 | 고급 추론 |

---

### Step 4: 응답 잘림 문제 발견

모델 교체 후 새 에러:
```
[Gemini] AI 원문 응답: ```json   ← 여기서 잘림!
[Gemini] JSON 구조를 찾을 수 없음: ```json
```

**원인 #2 확정:** `maxOutputTokens: 150`이 너무 낮음
→ Gemini 2.5 Flash는 내부 Thinking 토큰을 추가로 소비하므로 출력이 잘림

**변경 내용:**
```diff
- maxOutputTokens: 150,
+ maxOutputTokens: 1024,
```

---

### Step 5: JSON 파싱 실패 문제 해결

응답이 완전히 왔지만 파싱 실패:

```
[Gemini] AI 원문 응답:
```json
{
  "tags": ["Priva", "SOP", "Thermal insulation"],
  "summary": "Priva 단열 SOP 작성 검토"
}
```
```

**원인 #3 확정:** Gemini 2.5 Flash는 응답을 마크다운 코드블록(` ```json ... ``` `)으로 감싸서 반환. 기존 정규식이 실제 백틱 문자를 제대로 매칭하지 못함.

**해결 방법 — 정규식 대신 JSON 위치 기반 추출:**
```javascript
// Before: 정규식 방식 (실패)
const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// After: { } 위치 기반 추출 (성공)
const firstBrace = rawText.indexOf('{');
const lastBrace = rawText.lastIndexOf('}');
const jsonText = rawText.substring(firstBrace, lastBrace + 1);
```

---

## ✅ 3. 최종 성공 결과

### 콘솔 로그 (성공 시)
```log
[Gemini] 분석 시작, API 키 시작: AQ.Ab8RN...
[Gemini] 요청 URL: .../gemini-2.5-flash:generateContent
[Gemini] 응답 상태: 200 OK
[Gemini] Content-Type: application/json; charset=UTF-8
[Gemini] AI 원문 응답: ```json { "tags": [...], "summary": "..." } ```
[Gemini] 추출된 JSON: { "tags": [...], "summary": "..." }
[Gemini] ✅ 파싱 성공: {tags: Array(3), summary: "..."}
```

### 화면 렌더링 확인
- **메모 #52:** `#노트 분류` `#노트 변환` `#작업 미완료` + 요약 ✅
- **메모 #53:** `#Priva` `#SOP` `#Thermal insulation` + `Priva 단열 SOP 작성 검토` ✅

---

## 📋 4. 변경된 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/api/gemini.js` | 모델명 교체, maxOutputTokens 증가, JSON 추출 방식 변경, 디버그 로그 추가 |

---

## 💡 5. 서브에이전트 운영 기록 (Subagent SOP)

> **문서 작성 이유:** Antigravity 내부 브라우저 서브에이전트가 사용자에게 직접 보이는
> 지시사항이 아닌, 내부 디버깅 절차를 수행한 내용도 VTL에 기록해 두면
> 향후 동일 작업 재현 시 참고할 수 있습니다.

### 서브에이전트 디버깅 절차 (재사용 가능한 SOP)

```
[브라우저 서브에이전트 디버깅 SOP]

1. http://localhost:5174 접속
2. F12 → Console 탭
3. 우클릭 → Clear console
4. 테스트 메모 입력 → 추가 버튼 클릭
5. 20초 대기
6. 다음 항목 확인 및 보고:
   - [Gemini] 로 시작하는 모든 로그
   - response.status 값 (200/404/401)
   - Content-Type 헤더
   - AI 원문 응답 전체
   - 파싱 성공/실패 여부
7. 메모 목록 맨 아래로 스크롤하여 태그/요약 렌더링 확인
8. 스크린샷 저장
```

### 주의사항
- 헤드리스 브라우저는 한글 IME 입력을 지원하지 않음 → 영문으로 대체 입력
- 서브에이전트 실행 시간: 평균 20~40분 (브라우저 자동화 작업 특성상)
- Quota 초과 시 자동 대기 후 재개 (Claude 일일 쿼터)

---

## 🗺️ 6. 향후 유의사항

1. **Gemini 모델 점검:** 모델명은 주기적으로 deprecated 될 수 있음. 404 에러 발생 시 가장 먼저 모델명 확인.
2. **maxOutputTokens:** 2.5 이상 모델은 최소 512 이상 설정 권장.
3. **JSON 파싱:** 정규식보다 `indexOf('{')` / `lastIndexOf('}')` 방식이 더 안정적.
4. **API 키 형식:** `AIzaSy...` (구형) 및 `AQ.Ab8R...` (신형) 모두 유효한 Gemini API 키.
