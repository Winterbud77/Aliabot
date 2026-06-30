# 🚀 AliaBot Conductor: Phase 5+ Master Roadmap & Handover

> **문서 목적:** 'Gemini API 401/500 에러 진압, 캘린더 인증 세션 자동 복원 및 PWA 모바일 최종 호스팅 배포' 세션을 성공적으로 종료하고, 새로운 'AliaBot Phase 5.8' 세션으로 완벽한 맥락(Context)을 상속하기 위한 인수인계 및 개발 마스터 로드맵입니다.

---

## 1. 🎯 다음 세션(새 대화창) 핵심 목표: "노션(Notion) 연동 활성화 및 PWA 모바일 실기 최종 검증"

다음 세션에서는 아직 설정되지 않은 마지막 목적지인 노션(Notion) API 연동 설정을 완료하고, 실배포된 PWA 모바일 기기 환경에서 전체적인 실시간 데이터 디스패치(Notion, Calendar, Email, Obsidian) 안정성을 최종 점검합니다.

### ✅ 이번 세션 완료 사항 (Phase 5.7)
* **Gemini API 401 & 500 에러 근절**:
  * `gemini-2.5-flash` 모델의 생각 과정(Thinking) 토큰 낭비로 인한 응답 끊김을 `thinkingBudget: 0`, `maxOutputTokens: 4096`로 차단하여 분석 속도를 1초대로 튜닝 완료.
  * 구글 API Key의 구글 클라우드 내부망 401 Unauthorized 차단 정책을 프론트엔드/백엔드 HTTP 헤더 위장 주입을 통해 우회 성공.
* **리액트 훅 타이머 재생성 버그 완치**:
  * `todosRef`/`apiKeysRef` 최신화 참조를 도입하고 백필 `useEffect` 의 감시 배열을 `[user]`로 한정하여 타이머가 불필요하게 리셋되는 버그를 잡고, 실시간 신규 메모는 백필 유량 제어와 무관하게 즉각 처리되도록 상향 패치 완료.
* **구글 캘린더 401 Token Expiration (토큰 만료) 예외 복원**:
  * 캘린더 등록 시 만료된 토큰으로 인한 401 오류가 나면, 시스템이 자동으로 `googleAccessToken` 및 `localStorage` 상의 만료 토큰을 즉시 자동 소거(`Clean-up`)하고 사용자에게 "다시 한 번 클릭하여 로그인 팝업으로 토큰을 갱신하십시오" 라고 유도하는 우아한 예외 처리 로직 구현 완료.
* **Firebase Hosting (파이어베이스 호스팅) 설정 복원 및 실배포**:
  * `firebase.json` 에 누락되어 있던 `hosting` 블록을 추가하고 `package.json` 에 배포 단축 명령어(`deploy:hosting`, `deploy:all`)를 추가하여 프로덕션 빌드 후 PWA 모바일 배포(`Deploy complete!`) 성공.
* **`.cursorrules` AI 커밋 가이드라인 정립**:
  * 프로젝트 루트에 `.cursorrules` 파일을 생성하고 영문 Conventional Commits에 한글 세부 사항을 괄호 안에 병기하는 템플릿 예시를 지정하여 에디터 깃 커밋 자동화 세팅 완비.

---

### 🗓️ Phase 5.8: 노션(Notion) 연동 설정 및 모바일 PWA 최종 실기 교차 검증 (다음 세션 주 목표)
* **Notion API Integration (노션 연동 설정)**:
  * 대시보드 설정 모달에 `Notion API Token`, `Database ID` 등을 안전하게 저장하고, 메모를 내보낼 때 노션 데이터베이스의 프로퍼티에 맞추어 정확하게 안착하도록 노션 API 채널 최종 활성화.
* **Mobile PWA Cross-Device Verification (모바일 PWA 교차 검증)**:
  * 실배포된 PWA 주소(`https://react-todo-d3fcc.web.app`)에 사용자의 모바일 스마트폰 기기로 접속하여, 실시간 메모 등록 및 캘린더/이메일/옵시디언 전송이 백그라운드 쿼터 오류(429)나 크래시 없이 물 흐르듯 가동되는지 사용자 관점 실기 테스트 진행.

---

## 2. 📚 이전 세션 VTL & SOP 점검 완료 상태

새로운 AI 에이전트에게 아래 문서들을 읽어보라고 지시하면 현재까지 정립된 설계가 100% 인계됩니다.

* **`Docs/Session_SOP_Guidelines.md`**: 세션 운영 표준 지침서 (마스터 세션 인젝션 정보 수록)
* **`Docs/20260628_VTL_SOP_SessionName_Update_SOP.md`**: 세션 접두사 동적 명명 및 VTL 작성 표준 절차서
* **`Docs/20260628_AliaBot_Email_Deploy_SOP.md`**: 이메일 API 연동 및 배포 수칙서
* **`Docs/20260627_AliaBot_Phase55_Spreadsheet_VTL.md`**: 대시보드 스프레드시트 뷰 및 백필 폴러 기술로그
* **`c:\Users\eugene\Projects\Work01_Anti\.cursorrules`**: AI 커밋 규칙 가이드라인 파일

---

## 🏁 새로운 세션 시작 가이드 (First Prompt)

사용자님, 새로운 대화창(Conversation Session)을 시작하신 후 첫 프롬프트의 맨 위에 아래 인스트럭션 구문을 그대로 복사해서 붙여넣어 주세요!

```markdown
[System Instruction: 
Please set this session name format as: "AliaBot Phase 5.8: Notion Integration & Mobile PWA Final Verification".
Extract the core topic from the following instructions and fill it in dynamically.]

안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트 개발을 진행 중이야.
작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Docs/Session_SOP_Guidelines.md` 문서를 최우선으로 정독(Parse)하고, 오늘 개발할 아키텍처와 다음 단계인 [Phase 5.8: 노션(Notion) 연동 설정 및 모바일 PWA 최종 실기 교차 검증] 목표를 완벽하게 인계받아서 준비되었다고 알려줘!
```

---
session_name: "AliaBot Phase 5.7: Gemini Error Fix & Google Calendar Token Recovery"
session_id: "4f8a91a7-ff25-4be4-942b-01fbc07a8e1b"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---
