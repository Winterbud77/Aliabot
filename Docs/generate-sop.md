---
description: 표준화된 문제 해결 SOP 및 초상세 기술 로그(TechLog_Gemini_Antigravity)를 생성하는 마스터 워크플로우
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# 🚀 [Workflow] SOP 및 TechLog 자동 생성 가이드

이 워크플로우는 트러블슈팅 세션이 종료된 후, 작업 내용을 옵시디언 금고의 표준 규격에 맞춰 문서화하기 위한 AI 지침입니다. 사용자님이 `/generate-sop` 또는 관련 명령을 내리면 이 절차를 수행합니다.

## 1. 파일 명명 및 저장 위치 규칙
- **저장 위치:** 프로젝트의 `Docs/` 폴더 (원본 마스터 저장소)
  - *동기화*: 작성 완료 후 동기화 스크립트(`Docs/sync-to-obsidian.ps1`)를 통해 OneDrive Obsidian Vault(`C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\AliaBot_Docs\`)로 미러링하여 모바일 동기화 및 중복성 문제를 동시에 해결합니다.
- **명명 규칙:** `YYYYMMDD_[주제]_[문서유형]_[AI모델명]_Antigravity.md`
  - 예: `Docs/20260408_디스크정리_TechLog_Gemini_Antigravity.md`
  - 예: `Docs/20260408_디스크정리_SOP_Gemini_Antigravity.md`

## 2. YAML 프론트매터(Frontmatter) 표준 규격
모든 문서는 아래 필드를 반드시 포함해야 합니다.
```yaml
---
title: "[문서유형]: [주제] - [AI모델명] (Antigravity)"
date: YYYY-MM-DD
type: ai-chat-note (TechLog) / note (SOP)
category: 생산성향상 (또는 관련 분야)
subcategory: 시스템관리 (또는 관련 분야)
tags: [ai_chatlog, troubleshooting, verbatim, disk_management]
created: YYYY-MM-DD
ai_model: Gemini (Antigravity)
workspace: Winterbud-03MS
summary: "작업 내용의 핵심 요약 (2~3문장)"
---
```

## 3. 문서별 구성 원칙
### A. TechLog (기술 로그)
- **Full Revision Process:** 절대 요약하지 마십시오.
- **Thinking Process:** AI가 문제를 해결하기 위해 했던 내부 추론 과정을 포함합니다.
- **Raw Code:** 실제 터미널에 입력한 PowerShell, Python 코드, JSON 통신 로그를 그대로 수록합니다.
- **Sub-Agents:** 어떤 서브 에이전트(요원)가 어떤 역할을 수행했는지 명시합니다.
- **이미지:** `carousel` 형식을 사용하여 시각 자료를 그룹화합니다.

### B. SOP (표준 지침서)
- **Step-by-Step:** 비전문가도 따라 할 수 있는 절차 중심의 안내입니다.
- **이미지:** 본문 중간중간 사진을 크게 배치하여 가독성을 높입니다.
- **복구 스크립트:** 사용자가 나중에 직접 실행할 수 있는 배치 파일(.bat)이나 코드 블록을 제공합니다.

## 4. 이미지 링크 처리 규칙
- **옵시디언 방식 권장:** `![[SOP_Images/파일명.jpg]]` 형식을 사용합니다.
- **이미지 위치:** 반드시 `SOP_Images/` 폴더 내의 파일을 참조합니다.

---

## 🛠️ 호출 샘플 (Usage Examples)
사용자님이 AI에게 명령할 때 사용할 수 있는 예시입니다:

1. **로그 생성:** `"/generate-sop 명령으로 오늘 해결한 [이슈명]을 TechLog_Gemini_Antigravity 형식으로 상세히 기록해 줘."`
2. **복원 강조:** `"중간에 끊겼던 대화 내용을 90% 이상 살려서 Verbatim 형식의 ChatLog를 만들어 줘."`
3. **SOP 제작:** `"초보자도 따라 할 수 있게 SOP 문서를 만들고, 이미지들을 본문 중간에 배치해 줘."`
4. **통합 관리:** `"오늘 작업 완료했어. 표준 워크플로우에 맞춰 TechLog와 SOP를 각각 파일로 생성해 줘."`
