---
created_at: 2026-07-08
agent_model: Gemini 2.5 Flash (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 6.0: Multi-Project Bridge"
session_id: "c5159d45-4b9e-41b0-8304-2260f261a4ba"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 📋 AliaBot Multi-Project Hub & API Billing Architecture Plan
## 다중 프로젝트 통합 허브 아키텍처 및 단계별 API 빌링(BYOK) 전환 계획서

본 문서는 AliaBot이 다중 개발 프로젝트(Greenhouse Crop Data, Priva 환경 제어 RPA 등)의 지휘자(Conductor)로서 실질적인 기능을 수행하기 위한 **통합 디스패칭(Dispatching) 타당성 평가**와, **1단계 테스트(호스트 대리형)**에서 **2단계 정식 배포(BYOK 하이브리드형)**로 안전하게 아키텍처를 스케일업(Scale-up - 확장)하기 위한 비교 설계 계획서입니다.

---

## 1. 🏗️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① 디스패칭 (Dispatching - 분배 및 전달)
* **개념**: 사용자가 입력한 자연어(텍스트/음성)의 의도(Intent)를 분석하여 구글 캘린더, 이메일, 노션, 옵시디언 딥링크 또는 외부 프로젝트 컨텍스트 대화방 등 알맞은 목적지나 처리기(Handler)로 정확하게 분류 및 라우팅(Routing)해 주는 핵심 중계 메커니즘입니다.

### ② 컨덕터 아키텍처 (Conductor Architecture - 지휘자 설계)
* **개념**: 여러 인공지능 모델(Gemini, Claude, ChatGPT)이 개별 프로젝트에 분산되어 있을 때, 단일 진실 공급원(Single Source of Truth)인 **GitHub/Obsidian 지식 베이스**를 매개로 삼아 AliaBot(Gemini)이 모든 정보와 통제권을 쥐고 지휘하는 통합 아키텍처입니다.

### ③ BYOK 하이브리드 게이트웨이 (Bring Your Own Key Hybrid Gateway)
* **개념**: 서비스 개발 단계에서는 사용자가 비용을 지불하지 않도록 서버의 호스트 키로 처리하고, 배포 단계에서는 사용자 개인이 발급한 고유 API 키를 등록하여 인프라 비용 한계를 돌파하는 비용 분담형 게이트웨이 모델입니다.

---

## 2. 🎯 AliaBot의 디스패칭 허브 역량 및 타당성 솔직 평가

### ① Gemini 2.5 Flash 기반 단일 허브의 타당성 (매우 우수)
Claude Code나 ChatGPT(Codex) 등 여러 환경에서 파편화된 기술 자료들이 존재하더라도, 이들의 최종 산출물인 마크다운 지식 베이스(`CLAUDE.md`, `README.md`, `SOP` 등)가 **GitHub**에 업데이트되고 있다면, AliaBot은 최고의 효율을 발휘할 수 있습니다.
* **이유**: Gemini 2.5 Flash 모델은 **200만 토큰(Token)**에 달하는 광활한 **컨텍스트 윈도우(Context Window - 맥락 수용 크기)**를 제공합니다. 타사 API를 복잡하게 엮어 호출 비용을 낭비하는 대신, 깃허브에서 가져온 방대한 프로젝트 문서를 시스템 지침으로 실시간 결합하는 방식이 비용과 정확도 면에서 압도적으로 유리합니다.

### ② 솔직한 평가 및 한계점
* **가능 여부 (Yes)**: AliaBot은 사용자의 일상, 일정, 개발 프로젝트 메모를 종합 수집하여 다른 타겟 채널로 분배하는 **중앙 지휘자(Conductor) 역할에 최적화**되어 있습니다.
* **한계 극복 방안**: 다만, AI가 온실 제어 RPA와 같은 실제 코드를 실시간 컴파일하여 실행하는 단계는 보안 및 모바일 리소스 제약상 무리입니다. 따라서 **"AliaBot은 기획/의사결정/현황 모니터링/지식 탐색의 허브"**로 정의하고, **"실제 코드 실행 및 중대형 개발은 Claude Code/Codex"**가 수행하도록 역할을 이원화하는 것이 가장 실용적입니다.

---

## 3. 📊 API 운영 단계별 상세 설계 및 아키텍처 비교 (Test vs. Release)

```
[1단계: 테스트 단계 (Host-Managed)]
사용자 (PWA) ----(API Key 비어있음)----> Cloud Functions --(호스트 키)--> Gemini API (호스트 과금)

[2단계: 정식 배포 단계 (BYOK Hybrid)]
사용자 A (PWA) ----(개인 Key 등록완료)-------------------------------> Gemini API (사용자 본인 과금)
사용자 B (PWA) ----(API Key 비어있음)----> Cloud Functions --(제한적 대리)--> Gemini API (호스트 제한 과금)
```

### 📋 단계별 비교 일람표

| 항목 | 1단계: 테스트 단계 (현재) | 2단계: 정식 배포 단계 (향후) |
| :--- | :--- | :--- |
| **운영 목적** | 1인 실기 검증 및 지인 소수 테스트 | 일반 다수 사용자 배포 및 상용화 준비 |
| **핵심 구조** | **Host-managed Proxy (호스트 대리형)** | **BYOK Hybrid Gateway (개인 키 하이브리드)** |
| **과금 방식** | 호스트(개발자) 대표 API Key로 통합 비용 지불 | 사용자가 등록한 개인 API Key(BYOK)로 각자 지불 |
| **보안 메커니즘** | Firebase Secret Manager에 대표 키 안전 보존 | 브라우저 `localStorage`에 암호화하여 로컬 저장 |
| **CORS 및 프록시** | Cloud Functions를 통해 외부 API CORS 제한 회피 | 클라이언트 직접 fetch 혹은 서버 프록시 선택적 우회 |
| **사용자 이메일 검증** | Firestore 허용 계정(Allowlist) 검증 루프 적용 | 계정별 사용량 할당(Quota) 및 속도 제한(Rate Limit) 적용 |

---

## 4. 🚀 2단계(BYOK) 전면 전환을 위한 기술 구현 로드맵

정식 배포 단계에서 사용자들이 각자의 API 키를 통해 안정적으로 서비스를 누리게 하려면 다음과 같은 순서로 시스템을 점진적으로 전환해야 합니다.

### [Step 1] 클라이언트 BYOK 탐지 및 분기 처리 자동화 (현재 6.0 적용 완료)
* 클라이언트 코드에서 `apiKeys.gemini` 또는 `apiKeys.githubToken`의 존재 여부를 1차 판별합니다.
* 값이 있다면 서버 함수를 거치지 않고 직접 브라우저 단에서 `fetch` 요청을 전송하게 유도하여 서버 인프라 부하(Serverless Invocation Cost)를 0으로 수렴시킵니다.

### [Step 2] 로컬 스토리지 보안 강화 (Security Hardening)
* 현재 사용자의 API Key들은 로컬 스토리지(`localStorage`)에 평문으로 들어갑니다.
* 배포 단계에서는 간단한 브라우저 기기별 고유 해시 기반의 **AES-256 암호화 알고리즘**을 이식하여 키를 암호화 보관 처리함으로써 디바이스 탈취 시에도 보안 안전망을 확보합니다.

### [Step 3] 서버리스 게이트웨이의 사용량 제한 (Rate Limiting)
* BYOK 키를 발급받지 못했거나 키 입력이 번거로운 라이트(Light) 유저들을 위해 호스트 대리 프록시를 일부 열어두되, 악용(Abuse)을 방지하기 위해 사용자 계정(UID)당 **"하루 최대 AI 요청 30회"**와 같은 속도 제한 필터를 Firebase Functions 단에 주입합니다.
