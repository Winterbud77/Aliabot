---
created_at: 2026-07-06
agent_model: Gemini 1.5 Pro (Antigravity Agent)
ide: Antigravity Code Editor
session_name: "AliaBot Phase 5.9: Multi-Project Bridge & Email Receiving Pipeline"
session_id: "bf344642-382f-4515-9b71-60b5ea124d9a"
session_path: "C:\Users\eugene\Projects\Work01_Anti"
---

# 🚀 AliaBot Conductor: Phase 5.9 Master Roadmap & Handover
## 다중 프로젝트 브릿지 및 인바운드 이메일 수신 파이프라인 수립 가이드

본 문서는 Phase 5.8의 4대 채널(Notion, Obsidian Deep Link, Google Calendar, Outbound Email)의 모바일 PWA 실기 검증 완수를 승계하고, 차기 세션인 'AliaBot Phase 5.9'에서 다룰 고유의 이월 백로그 및 다중 프로젝트 연동 아키텍처 설계를 정리한 마스터 로드맵입니다.

---

## 🎯 Phase 5.9 핵심 개발 목표 (Core Objectives)

### 1. 🔗 Multi-Project Bridge (타 프로젝트 연결성 강화)
* **개념**: Claude Code 및 Cursor 환경에서 개별적으로 빌드했거나 병행 추진 중인 타 프로젝트(예: 농업 마이스터 역량 조서 작성 프로젝트, 영농 환경 모니터링 대시보드 등)와 AliaBot의 데이터베이스를 상호 유기적으로 결합합니다.
* **구현 방안**: 
  * AliaBot 내 메모 데이터 및 AI 요약 결과를 외부 프로젝트가 쉽게 읽을 수 있도록 **REST API 엔드포인트(Cloud Functions)**를 설계하거나 JSON/CSV 포맷의 데이터 연계 브릿지를 개발합니다.
  * 농업 마이스터 조서 관련 기술적 정보(Priva 제어 및 식물 생리 등)를 AliaBot 비서에게 연계하여 스마트 브레인으로 활용하는 경로를 모색합니다.

### 2. ✉️ Inbound Email Receiving Pipeline (인바운드 이메일 수신 및 수집 파이프라인)
* **개념**: 기존의 비서 앱에서 외부로 이메일을 단순히 발송하는 아웃바운드 디스패치(Dispatch) 기능을 넘어, **외부에서 수신된 이메일을 AliaBot 비서가 역으로 수집하여 할 일 카드(Todo Card)로 자동 등록**해 주는 양방향 통신망입니다.
* **구현 방안**:
  * **Email Webhook 중계**: Resend 또는 SendGrid의 `Inbound Parse Webhook` 서비스를 활용하여, 특정 전용 메일 주소(예: `incoming@aliabot.com`)로 온 메일을 수집합니다.
  * **Firebase Functions Endpoint**: 수집된 이메일 원문(Raw Email)을 파싱하여 제목, 보낸 사람, 본문 텍스트를 추출한 후 Firestore 데이터베이스(`users/{uid}/todos/`)에 카드로 자동 인서트(Insert)하는 중계 함수를 배포합니다.
  * **AI Auto-Tagging**: 수집된 메일 카드를 백그라운드 Gemini API가 스캔하여 자동으로 `!메일` 태그를 주입하고 일정을 파싱하게 합니다.

### 3. 🛠️ 미완성 이월 백로그 및 최적화 과제 (Pending Backlog List)
* **Firestore 복합 인덱스 및 성능 최적화 (Query & Index Optimization)**:
  * 누적 데이터가 늘어남에 따라 생성 시점 역순 정렬(`createdAt desc`) 및 태그 필터 쿼리가 기하급수적으로 느려지는 현상을 사전 방지하기 위해 복합 인덱스(Composite Indexes) 설정을 최적화합니다.
* **PWA 오프라인 저장소 및 복구 싱크 (Offline Cache & Sync Engine)**:
  * 모바일 이동 중 음영 지역에서 메모를 등록했을 때 LocalStorage 또는 IndexedDB에 임시 적재한 뒤, 온라인망 복귀(Online Reconnect) 시 Firestore 서버와 데이터가 충돌 없이 자동 병합(Merge)되는 로직을 재점검하고 강화합니다.
* **음성 인식 (STT; Speech-to-Text) 기능 감도 보완**:
  * 모바일 PWA 환경에서 마이크 권한 연동 유지 및 연속 음성 인식(Continuous STT) 시 화면이 잠기거나 백그라운드로 진입할 때 음성 인식이 끊어지지 않는 모바일 최적화 대책을 보강합니다.

---

## ✅ 이번 세션 완료 사항 (Phase 5.8 Accomplishments)
* **모바일 실기 PWA 4대 채널 일괄 작동 검증 성공**:
  * 갤럭시 스마트폰 및 배포 서버 환경에서 Notion, Obsidian Deep Link, Google Calendar, 이메일 전송 기능이 완벽하게 우회 연동되는 실계측을 성공적으로 확인했습니다.
* **VTL & VSOP 기술 문서의 완전한 이원화 분리 및 YAML Frontmatter 규격 통일**:
  * 아키텍처 및 설계 원리를 다루는 VTL 문서와 따라 하기 방식의 단계별 캡처 맵핑 VSOP 가이드를 각 단독 파일로 분리하고, 생성일·AI모델·IDE 등의 표준 메타데이터를 상단에 YAML 형식으로 안전하게 규격화했습니다.
* **Localhost 시각적 뱃지 및 타이틀바 UX 개선**:
  * 로컬 기동 시 타이틀바 뒤쪽에 `[Localhost:5173]`이 오도록 배치하여 메인 명칭을 전면에 돋보이게 하고 헤더 로고 옆에 오렌지색 주소 식별 뱃지를 표기해 실서버와의 뷰 구분을 깔끔하게 완료했습니다.

---

## 🏁 새로운 세션 시작 가이드 (First Prompt Guide)

사용자님, 다음 **Phase 5.9** 대화 세션을 여신 후, 첫 프롬프트의 최상단에 아래 지시 스니펫을 그대로 복사하여 붙여넣으시면 에이전트가 완벽하게 Context(맥락)를 이어받아 착수하게 됩니다.

```markdown
AliaBot Phase 5.9: Multi-Project Bridge & Email Receiving Pipeline

[System Instruction: 
Please set this session name format exactly as: "AliaBot Phase 5.9: Multi-Project Bridge & Email Receiving Pipeline".
Extract the core topic and ensure the UI title is set exactly as specified in the first line.]

안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트 개발을 추진 중이야.
작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Docs/20260705_AliaBot_Phase58_Obsidian_DeepLink_Notion_Integration_VTL.md` 기술 로그를 최우선으로 정독(Parse)하여 오늘 개발할 아키텍처와 다음 단계인 [Phase 5.9: 다중 프로젝트 브릿지 및 이메일 수신 파이프라인] 목표를 안전하게 상속받아 줘.
그다음, 우리가 수립한 1) Multi-Project Bridge의 구체적 연동 계획과 2) Inbound Email 수신 웹훅 아키텍처에 대한 핵심 원리(Terminology)를 한글과 영어를 병기하여 설명해 준 뒤 개발을 이행해 줘!
```
