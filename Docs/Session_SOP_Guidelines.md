# 📋 AliaBot 세션 운영 표준 지침 (Session SOP Guidelines)

> **문서 목적:** Antigravity 세션 중 발생하는 스크린샷, 설정 화면, 오류 화면 등을 체계적으로 수집하고,
> 차후 VTL(Visual Tech Log) 및 인포그래픽 매뉴얼 제작에 활용하기 위한 표준 운영 절차입니다.

---

## 1. 📸 스크린샷 수집 원칙

### 수집 대상 (반드시 캡처)
- 외부 서비스 **최초 설정 화면** (API 키 발급, 계정 연동 등)
- **오류 발생 화면** (에러 메시지, 콘솔 로그 포함)
- **성공 확인 화면** (기능 작동 결과, 완료 상태)
- **Before/After 비교** (UI 변경 전후)

### 파일명 규칙
```
YYYYMMDD_[서비스명]_[단계]_[상태].png

예시:
20260530_GeminiAPI_키발급_다이얼로그.png
20260530_AliaBot_AI태깅_성공화면.png
20260530_Firebase_Rules_설정완료.png
```

### 저장 위치
```
Work01_Anti/
  └─ Docs/
       └─ Screenshots/        ← 스크린샷 보관 폴더
            └─ [YYYYMM]/      ← 월별 하위 폴더
```

---

## 2. 📄 VTL 문서 연동 규칙

세션 중 스크린샷이 수집되면, 해당 VTL 문서에 아래 형식으로 삽입합니다.

```markdown
### 설정 화면 캡처
![설명 텍스트](../Docs/Screenshots/202605/20260530_GeminiAPI_키발급_다이얼로그.png)

> [!TIP]
> **트러블슈팅 기록:** 이 화면에서 '가져온 프로젝트'는 무료 티어 사용 시
> 선택하지 않아도 됩니다. '키 만들기'를 바로 클릭합니다.
```

---

## 3. 🗂️ 인포그래픽 매뉴얼 제작 지침

### 대상 독자
- 기술 비전공자도 따라할 수 있는 수준
- 동료 공유 및 온실 관리 팀 교육용

### 포함 요소
- [ ] 단계별 번호가 매겨진 화면 캡처 시퀀스
- [ ] 각 화면의 "클릭할 곳" 빨간 박스 표시
- [ ] 주의사항 및 자주 묻는 질문(FAQ) 섹션
- [ ] 완성된 결과 화면 (Before/After)

### 제작 시점
- Phase 하나가 완료될 때마다 해당 Phase의 VTL을 인포그래픽으로 정리
- 최종 Outputs 폴더에 PDF 또는 MD 형식으로 저장

---

## 4. 📌 현재까지 캡처된 주요 화면 목록

| 날짜 | 내용 | 세션 |
|---|---|---|
| 2026-05-30 | Google AI Studio — API 키 만들기 다이얼로그 | AliaBot_01 |
| 2026-05-30 | Google AI Studio — 지출 한도 설정 안내 팝업 | AliaBot_01 |

> **참고:** Antigravity 채팅 중 공유된 스크린샷은
> `C:\Users\eugene\.gemini\antigravity\brain\[세션ID]\` 경로에 자동 저장됩니다.
> VTL 작성 시 해당 경로에서 이미지를 참조하거나 `Screenshots` 폴더로 복사해서 사용하세요.

---

## 5. 🤖 AI 에이전트 지시 원칙 (Antigravity + Cursor 공통)

- 세션 중 중요한 화면이 공유되면 **파일명 규칙에 맞게 명칭을 제안**할 것
- VTL 문서 작성 시 해당 스크린샷 참조 코드를 **자동으로 포함**할 것
- Phase 완료 시 **인포그래픽 매뉴얼 초안 작성을 제안**할 것

### 5.1 문서 산출물 저장 위치 및 보안 격리 원칙

| 구분 | 저장 위치 | Git 버전 관리? | 목적 및 관리 규칙 |
|---|---|---|---|
| **일반 문서 산출물** | `Docs/` | ✅ **포함 (Tracking)** | VTL, SOP, VSOP 등 모든 일반 기술 지식 문서를 일원화 보관 |
| **보안 민감 파일** | `Outputs/` | ❌ **제외 (.gitignore)** | API Key, 개인 자격 증명 등 GitHub에 업로드되면 안 되는 파일 격리 보관 |
| **개인 지식 관리** | `Obsidian Vault` | ❌ **제외** | OneDrive 동기화 영역에 미러링 링크 폴더를 두어 중복 최소화 및 모바일 동기화 유지 |

> **원칙:** 모든 `.md`, `.doc` 형식의 지식 및 절차 산출물은 로컬 Git 버전 관리와 완벽히 통합되도록 **`Docs/` 폴더 내에 일원화하여 생성**합니다. `Outputs/` 폴더는 보안 유출 위험이 있는 임시 크레덴셜(Credentials) 파일 보관용으로만 제한합니다.

### 5.2 VTL / VSOP 자동 저장 및 Obsidian 미러링 규칙

**사용자 요청 반영 — Agent가 매번 자동 수행:**

| 트리거 | 생성 문서 | 최종 마스터 저장 위치 |
|---|---|---|
| **새 Phase 시작/완료** | VTL (과정·원인·해결·스크린샷) | `Docs/YYYYMMDD_AliaBot_PhaseXX_*.md` |
| **검증/설정/배포 절차** | VSOP (따라하기 절차) | `Docs/YYYYMMDD_*_VSOP.md` |
| **주제/기능 항목 변경** | VTL + VSOP (둘 다) | `Docs/` |
| **트러블슈팅 Issue** | VTL Issue 섹션 추가 | 해당 Phase VTL 내부 |

#### 📝 문서 상세화 및 가시성 원칙 (Detailing & Visibility Principle)
비개발자나 처음 접하는 작업자가 보더라도 쉽게 내용을 파악하고 그대로 재현할 수 있도록, VTL 및 VSOP 문서 작성 시 요약본 형태의 축약을 지양하고 다음 세부사항을 명시합니다:
1. **영속성 데이터 및 로그 파일의 실제 물리 절대 경로**: 복구나 조작의 대상이 되는 파일(`.pb`, `.db`, `.json` 등) 및 텍스트 로그 파일(`overview.txt` 등)의 윈도우 로컬 절대 경로를 정확히 기재합니다.
2. **트러블슈팅 실패 원인의 상세 원리**: 시도했으나 실패한 과정들에 대해 런타임/OS 수준의 원인(예: Windows Job Object에 의한 자식 프로세스 강제 종료 등)을 자세히 서술하여 문제 해결의 정당성을 뒷받침합니다.
3. **재사용 가능한 명령어 및 스크립트 스니펫**: 검증 및 복구에 가동되는 쉘 명령어(`attrib` 등)와 Node.js/Python 스크립트 실행 경로를 생략 없이 기재하여 비개발자도 그대로 복사-붙여넣기 할 수 있게 합니다.
4. **시각적 구조 및 흐름 제시**: 프로세스나 아키텍처 구조를 한눈에 볼 수 있도록 Mermaid 다이어그램 등을 통해 데이터 흐름과 단계별 전후 관계를 표현합니다.

#### 📂 OneDrive Obsidian Vault 하이브리드 미러링 동기화 구조
로컬 C드라이브(`C:\Users\eugene\Projects\Work01_Anti\Docs`)와 OneDrive 동기화 영역(`C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS`)의 동기화 불일치 및 모바일 공백 문제를 해결하기 위해 아래 구조를 유지합니다:
1. **마스터 원본**: 로컬 프로젝트의 `Docs/` 폴더가 원본 마스터입니다. 모든 작성 및 1차 수정은 이곳에서 일어납니다.
2. **자동 미러링**: 세션 종료 시 또는 산출물 생성 시, 원클릭 동기화 스크립트(`Docs/sync-to-obsidian.ps1`)를 실행하여 `Docs/` 내부의 마크다운 파일을 Obsidian Vault 하위의 `AliaBot_Docs/` 폴더로 자동 복사 미러링합니다.
3. **모바일 동기화**: 물리적 복사본이 OneDrive 영역 내에 존재하므로, 모바일 및 태블릿의 Obsidian 앱에서도 정상적으로 문서 조회가 가능합니다.
4. **Rename 대책**: 문서 최상단 Frontmatter에 고유 식별 명칭(aliases 또는 uuid)을 포함하여 이름 변경 시의 링크 깨짐을 방지합니다.

### 5.3 Cursor 스크린샷 — 자동 vs 수동

| 방식 | Antigravity | Cursor |
|---|---|---|
| **브라우저 자동 캡처** | browser_subagent가 스크린샷 저장 | **기본 없음** (Browser MCP/확장 설정 시 일부 가능) |
| **OS 전체 화면 캡처** | 없음 | **기본 없음** |
| **사용자 업로드** | 채팅에 이미지 첨부 | **채팅에 이미지 첨부** (권장) |
| **수동 캡처 (Windows)** | — | `Win + Shift + S` |

**권장 워크플로:**
1. 사용자: `Win+Shift+S` → `docs/Screenshots/YYYYMM/` 저장 (파일명 규칙 준수)
2. Cursor 채팅에 스크린샷 드래그&드롭
3. Agent: VTL/VSOP에 `![설명](../Docs/Screenshots/...)` 링크 자동 삽입
4. (선택) Browser MCP 연결 시 웹앱(`localhost`) 화면만 Agent가 확인 가능 — **데스크톱 전체 캡처는 아님**

> Cursor는 Antigravity처럼 "컴퓨터 화면 전체를 Agent가 자동 캡처"하지 않습니다.  
> **사용자 스크린샷 + Console 로그 + VTL 기록** 조합이 가장 안정적입니다.

### 5.4 에이전트 메모리 상속 및 도구별 호환성 가이드 (Agent Memory Inheritance & Cross-Tool Compatibility)

새 세션(New Session)을 시작하거나 타사 AI 개발 도구를 활용할 때, 프로젝트의 고유 아키텍처와 전역 룰(Rule)을 안전하게 승계하기 위한 지침입니다.

#### 🧠 세션 전환 시 명시적 컨텍스트 활성화 (Context Activation)
대화창을 전환하면 에이전트의 이전 대화 기억이 초기화(Context Reset)되므로, 첫 프롬프트 입력 시 아래 키워드를 입력하여 에이전트의 두뇌를 강제 로딩(Priming; 사전 지식 주입)합니다:
> **"프로젝트 마스터 메모리인 `Docs/Agent_Memory.md`와 `Docs/Session_SOP_Guidelines.md`를 최우선으로 정독(Parse)하고, 오늘 개발할 아키텍처와 전역 룰(한글 병기 규칙)을 승계받아 시작해 줘."**

#### 🤖 타사 AI 코딩 도구별 호환성 연결 (Bridge) 설정
타사 에이전트를 가동할 때 프로젝트 루트의 전용 진입점 파일을 추가 가이드로 연결하여 문서 인식을 보장합니다.

| 도구명 | 연결 파일 (Bridge) | 추가 조치 사항 |
|---|---|---|
| **Claude Code** | `CLAUDE.md` (루트) | 루트에 `CLAUDE.md` 생성 후, `Docs/Agent_Memory.md` 및 `Session_SOP_Guidelines.md`를 먼저 정독하여 규정을 준수하라고 지시 |
| **Cursor (Composer)** | `.cursorrules` (루트) | 루트에 `.cursorrules` 생성 후, `Docs/Agent_Memory.md`를 최우선 인덱싱(Indexing) 파일로 링크 연결 |
| **OpenAI Codex / ChatGPT / Copilot** | `.github/copilot-instructions.md` 또는 수동 업로드 | Copilot/Codex 환경은 루트에 `.github/copilot-instructions.md` 파일을 배치하여 지침을 연계하고, Web UI 구동 시 `Docs/Agent_Memory.md`를 업로드창에 인풋(Input)으로 첨부하여 프라이밍(Priming; 사전 지식 주입)을 적용 |

---

## 4.2 📸 Phase 5.2~5.4 스크린샷 체크리스트(요약)
### Phase 5.2 UX
- 최신순 정렬(`createdAt desc`) 적용 확인
- 인라인 수정(✏️) 후 저장 결과 화면
- 태그 필터 배너/칩 동작 화면
- `seq` 없는 과거 데이터에서 UI fallback 동작 확인

### Phase 5.3 Export & Notion
- Settings 모달: `Notion API Token`, `Database ID`, `Title/Content Property Name` 입력 화면
- Export 모달: 목적지(복수 체크) 선택 화면 + 태그 기반 추천 표시 상태
- Export 완료 후 상태 반영 화면(Firestore의 `destinations`, `category`가 갱신되는지 확인)

### Phase 5.4 Google Calendar & Serverless Email
- Google OAuth 로그인 권한 동의 팝업 창 (calendar.events 스코프 추가 동의 화면)
- Export 모달: 목적지 체크박스에 "📅 Google Calendar", "✉️ Email"이 추가된 화면
- "!일정" 태그가 포함된 메모 등록 후 AI 요약/태깅이 이루어진 Firestore metadata의 `parsedEvent` JSON 데이터 화면
- 구글 캘린더 연동 성공 시 캘린더에 일정이 동기화 등록된 화면
- 이메일 연동 성공 시 메일이 정상적으로 수신 완료된 수신함 화면
- 리액트 빌드 시 컴파일 경고/오류가 없는 터미널 최종 화면


