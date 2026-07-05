---
title: "SOP: 에이전트 대화 세션 로그 손상 진단 및 복구 절차서"
date: 2026-07-05
type: standard-procedure-log
category: AliaBot
subcategory: Session-Management
tags: [aliabot, session-recovery, ndjson, parser-bug, backup]
session_name: "Session Recovery and Logging Sanity"
session_id: "4f8a91a7-ff25-4be4-942b-01fbc07a8e1b"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# 📘 에이전트 대화 세션 로그 손상 진단 및 복구 절차서 (SOP)

> **문서 목적:** Antigravity(제미나이) 대화 세션이 VS Code의 "Past conversations" 목록에 노출되지 않거나, 내부 `.system_generated/logs` 경로에서 동기화가 지연될 때의 기술적 원인을 명시하고, 비개발자 사용자도 쉽게 실행할 수 있는 대본(Markdown) 복구 및 세션 스와핑 절차를 표준화합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Principles)

### 1-1. NDJSON (Newline Delimited JSON) 로그 저장 방식
- **개념:** 에이전트가 한 단계(Step)씩 동작하거나 사용자와 대화할 때마다, 매 스텝의 상태 데이터를 JSON 한 줄 단위로 `overview.txt` 파일에 한 줄씩 누적(Append)하여 저장하는 파일 포맷입니다.
- **작동 원리:** 파일 전체가 하나의 거대한 JSON 객체인 경우 비정상 종료 시 파일이 완전히 깨지므로, 안전을 위해 각 라인이 독립된 JSON 객체 구조를 띱니다. VS Code 확장 UI는 이 파일을 첫 줄부터 순서대로 파싱하여 세션 타이틀과 대화 히스토리를 렌더링합니다.

### 1-2. Escape Character Collision (이스케이프 문자 충돌)
- **개념:** JSON 문자열 데이터 내부에 큰따옴표(`"`)나 역슬래시(`\`) 같은 특수 문자가 들어갈 때, 이를 단순 텍스트로 인식하게 하도록 역슬래시를 덧붙여 우회(`\"`)시키는 처리입니다.
- **오류 기전:** `browser_subagent`가 웹 페이지 내의 문자열을 캡처하거나, 터미널 빌드 로그의 특수 이모지 문자 등을 수집할 때, 이스케이프가 이중/삼중으로 중첩되거나 줄바꿈(`\n`)이 훼손되면서 불완전한 JSON 라인이 파일에 기록되는 현상입니다. 이로 인해 파싱 엔진에서 문법 오류(Syntax Error)가 일어나 목록 노출이 거부됩니다.

---

## 2. 🛠️ 단계별 세션 복구 절차 (SOP)

### [1단계] 로그 파일 인코딩 및 JSON 정합성 검증
만약 세션이 목록에서 사라졌다면, PowerShell을 실행하여 UTF-8 인코딩 기준으로 실제 NDJSON 구문 오류가 있는지 검사합니다.
```powershell
Get-Content -Path "C:\Users\eugene\.gemini\antigravity\brain\<session-id>\.system_generated\logs\overview.txt" -Encoding UTF8 | ForEach-Object {
    try {
        $null = $_ | ConvertFrom-Json
    } catch {
        Write-Host "[Error Line] $_"
    }
}
```

### [2단계] 파이썬을 이용한 대본 마크다운 복원 (추출기 가동)
목록 복구가 지연될 때, 어제 나눈 대화 데이터를 안전하게 사람이 읽기 편한 마크다운 문서로 백업하기 위해 아래의 `extract_chat.py` 스크립트를 가동합니다.
- **스크립트 경로:** `Docs/extract_chat.py`
- **구동 명령:** `python Docs/extract_chat.py`
- **산출물:** `Docs/20260704_AliaBot_Phase58_Conversation_History_Backup.md` (대화록 마크다운)

### [3단계] 세션 강제 스와핑 (Swapping) 우회 기법
현재 정상적으로 감지되는 세션이 있는 경우, 구 세션 폴더의 데이터(`overview.txt`, `browser/`, `media_*`)를 백업한 후, 활성화된 신규 세션 폴더 내부로 덮어쓰기(Swapping)하여 VS Code UI 상의 대화 맥락을 물리적으로 인계받는 방식입니다.

---

## 3. 📝 금일 세션 이력 관리 요약
- **발견된 세션 ID:** `bf344642-382f-4515-9b71-60b5ea124d9a` (어제 Phase 5.8 진행 세션)
- **조치 사항:**
  - `overview.txt` 파일 내부의 NDJSON은 구조상 UTF-8 기준으로 100% 정상이나, Windows 파일 시스템의 인코딩 불일치로 인해 VS Code UI 확장이 이를 읽을 때 생략되었음을 규명함.
  - 대본 추출기(`extract_chat.py`)를 통해 어제 대화 기록을 `Docs/20260704_AliaBot_Phase58_Conversation_History_Backup.md`로 완벽 복원하여 로컬 파일 자산화 완료.
