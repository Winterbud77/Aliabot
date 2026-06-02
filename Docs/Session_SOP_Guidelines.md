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

### 5.1 Cursor 대화(Conversation) 저장 위치

| 구분 | 저장 위치 | Git 포함? |
|---|---|---|
| **UI 대화 기록** | Cursor 앱 Chat History (프로젝트별) | ❌ |
| **Agent transcript (JSONL)** | `C:\Users\eugene\.cursor\projects\c-Users-eugene-Projects-Work01-Anti\agent-transcripts\<uuid>\` | ❌ |
| **프로젝트 지식/과정 문서** | `docs/`, `outputs/` (VTL, VSOP, SOP) | ✅ 권장 |

> **원칙:** Cursor 대화는 앱 내부에만 남습니다.  
> Antigravity `overview.txt`처럼 레포에 자동 저장되지 않으므로, **VTL/VSOP을 outputs에 의도적으로 저장**합니다.

### 5.2 VTL / VSOP 자동 저장 규칙 (Cursor 세션)

**사용자 요청(2026-06-01) 반영 — Agent가 매번 자동 수행:**

| 트리거 | 생성 문서 | 저장 위치 |
|---|---|---|
| **새 Phase 시작/완료** | VTL (과정·원인·해결·스크린샷) | `outputs/YYYYMMDD_AliaBot_PhaseXX_*.md` |
| **검증/설정/배포 절차** | VSOP (따라하기 절차) | `outputs/YYYYMMDD_*_VSOP.md` |
| **주제/기능 항목 변경** | VTL + VSOP (둘 다) | `outputs/` |
| **트러블슈팅 Issue** | VTL Issue 섹션 추가 | 해당 Phase VTL 내부 |

**VTL에 반드시 포함할 "과정" 요소 (thinking 대체):**
1. 증상 / 재현 단계
2. 가설 (왜 그럴까?)
3. 확인한 증거 (Console 로그, 파일명, 스크린샷)
4. 시도 → 실패/성공
5. 최종 원인 / 해결
6. 다음에 같은 문제 시 FAQ 한 줄

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

---

## 4.2 📸 Phase 5.2~5.3 스크린샷 체크리스트(요약)
### Phase 5.2 UX
- 최신순 정렬(`createdAt desc`) 적용 확인
- 인라인 수정(✏️) 후 저장 결과 화면
- 태그 필터 배너/칩 동작 화면
- `seq` 없는 과거 데이터에서 UI fallback 동작 확인

### Phase 5.3 Export & Notion
- Settings 모달: `Notion API Token`, `Database ID`, `Title/Content Property Name` 입력 화면
- Export 모달: 목적지(복수 체크) 선택 화면 + 태그 기반 추천 표시 상태
- Export 완료 후 상태 반영 화면(Firestore의 `destinations`, `category`가 갱신되는지 확인)

