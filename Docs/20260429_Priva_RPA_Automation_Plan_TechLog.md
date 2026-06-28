---
title: "TechLog: Priva Office Direct (POD) 무인 자동화(RPA) 아키텍처 기획안 - Gemini (Antigravity)"
date: 2026-04-29
type: ai-chat-note
category: 스마트팜
subcategory: 제어자동화
tags: [smartfarm, priva, rpa, automation, architecture, blueprint]
created: 2026-04-29
ai_model: Gemini 3.1 Pro (Low) (Antigravity)
workspace: Winterbud-03MS
summary: "API가 지원되지 않는 폐쇄형 온실 제어 시스템(Priva Maximizer / PODesktop)을 완전히 무인 자동화하기 위한 RPA(로보틱 프로세스 자동화) 기반의 시스템 아키텍처 및 실행 로드맵 기획안입니다."
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

# 🤖 [TechLog] Priva Office Direct (POD) 무인 자동화(RPA) 아키텍처 설계서

> [!NOTE]
> **문서 성격 (Architecture Blueprint):**
> 본 문서는 실제 코드를 작성하기에 앞서, API가 없는 구형/폐쇄형 윈도우 기반 스마트팜 제어 소프트웨어를 AI와 RPA를 이용해 어떻게 완전 자율화할 것인지 구조를 잡은 **'아키텍처 기획안'**입니다. 차후 실제 자동화 스크립트 개발 시 이 문서를 나침반(SOP)으로 활용합니다.

---

## 🗂️ 1. 시스템 환경 진단 (System Context)

사용자님과의 대화를 통해 파악된 현재 제어 시스템의 물리적 환경은 다음과 같습니다.

*   **타겟 프로그램:** Priva Office Direct (실행 파일명: `PODesktop.exe`)
*   **설치 경로:** `Priva\Priva Office\Client\` 폴더 내 (용량 약 450MB)
*   **네트워크 구조:** 본사 서버(Main Server) 또는 로컬 서버와 통신하는 **'클라이언트(Client)' 형태의 윈도우 데스크탑 프로그램**. (복수 클라이언트 접속 가능 확인됨)
*   **핵심 제약 사항:** 외부에서 프로그램 내부 수치에 접근할 수 있는 **API(Application Programming Interface) 미제공**. (일반적인 코딩 방식으로는 제어 불가)

---

## 🏗️ 2. 해결 아키텍처: 무인 RPA(Robotic Process Automation) 시스템

API가 없으므로 컴퓨터가 사람의 눈과 손을 100% 모방하는 RPA 시스템을 구축합니다. 이 시스템은 4가지 핵심 모듈로 구성됩니다.

### 🧠 1단계: 지식 베이스 (Think & Rules)
*   **도구:** Obsidian (마크다운 파일)
*   **역할:** "온도가 15도 이하일 때 난방 1단계를 켠다" 와 같은 시기별/날씨별 제어 로직(SOP)을 텍스트로 보관하는 두뇌.

### 👀 2단계: 시각 인지 모듈 (Sense)
*   **도구:** Python + `pyautogui` (화면 캡처) + `Tesseract OCR` (광학 문자 인식)
*   **역할:** 사람을 대신해 주기적으로 `PODesktop.exe` 화면을 스크린샷 찍고, 그 이미지 안에서 '현재 온도', '습도' 등의 숫자를 텍스트로 읽어냅니다.

### 🦾 3단계: 물리 제어 모듈 (Act)
*   **도구:** Python + `pyautogui` (마우스/키보드 제어)
*   **역할:** 인지 모듈이 읽은 온도를 바탕으로 지식 베이스의 규칙을 확인한 후, 조건에 맞으면 마우스 커서를 이동해 프로그램 화면의 특정 버튼(예: 난방 ON)을 클릭합니다.

### ⏰ 4단계: 무인 스케줄러 (Trigger)
*   **도구:** 윈도우 기본 기능인 '작업 스케줄러(Task Scheduler)'
*   **역할:** 사용자가 자고 있을 때도 10분, 혹은 1시간 단위로 위의 2~3단계 파이썬 스크립트를 몰래 실행시킵니다.

---

## 🚀 3. 차후 실행을 위한 로드맵 (Execution Roadmap)

실제 이 기획을 실행에 옮기실 때 (차후 세션에서), 다음의 순서대로 Antigravity에게 지시해 주시면 됩니다.

### Step 1. 화면 학습 (사용자 액션)
1. `PODesktop`을 화면의 항상 똑같은 위치(예: 전체 화면)에 띄웁니다.
2. 화면을 캡처해서 채팅창에 올립니다.
3. *"현재 온도가 표시된 곳과, 내가 누르고 싶은 '난방 버튼'이 어디인지 스크린샷으로 줄게. 이걸 바탕으로 파이썬 RPA 기초 코드를 짜줘."* 라고 지시합니다.

### Step 2. 파이썬 스크립트 작성 및 테스트 (Antigravity 액션)
1. Antigravity가 Python 코드를 작성합니다.
2. 터미널 요원(`run_command`)이 필요한 라이브러리(`pip install pyautogui` 등)를 로컬 컴퓨터에 자동 설치합니다.
3. 임시로 테스트 실행을 하여 마우스가 혼자 움직여 지정된 위치를 정확히 클릭하는지 검증합니다.

### Step 3. 룰(Rule) 연동 및 스케줄링 (통합)
1. 옵시디언에 작성해둔 로직 파일을 파이썬 코드가 읽도록 연결합니다.
2. 최종 완성된 스크립트를 윈도우 작업 스케줄러에 등록하여 **'완전 자율 주행 스마트팜'**을 완성합니다.

---

### 💡 AI 설계자의 코멘트
API가 없는 윈도우 클라이언트 환경(`PODesktop`)이라도, RPA 기술과 Antigravity의 코드 생성 능력을 결합하면 충분히 원격/자동화 제어가 가능합니다. 남는 여분의 노트북 등에 이 시스템을 구축해 두시면 훌륭한 24시간 무인 관제소가 될 것입니다!
