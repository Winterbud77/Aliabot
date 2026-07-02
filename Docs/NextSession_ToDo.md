# 🚀 AliaBot Conductor: Phase 5+ Master Roadmap & Handover

> **문서 목적:** 'Gemini API 에러 진압, 모바일 PWA 반응형 헤더 패치, 실배포 서버 적용 및 옵시디언 딥링크(Deep Link) 전환 기획' 세션을 성공적으로 종료하고, 차기 'AliaBot Phase 5.8' 세션으로 완벽한 맥락(Context)을 상속하기 위한 개발 로드맵입니다.

---

## 🎯 다음 세션(새 대화창) 핵심 목표: "옵시디언 딥링크(Obsidian URI) 구현 및 노션(Notion) 연동 완성"

다음 세션에서는 HTTPS 모바일 PWA 환경과 외부 기기에서도 별도의 로컬 개발 서버나 터널 설정 없이 100% 동작하는 **옵시디언 딥링크(Obsidian URI)** 연동 모듈을 새롭게 구현하고, 마지막 남은 채널인 **노션(Notion) API** 연동을 최종 완성합니다.

### ✅ 이번 세션 완료 사항 (Phase 5.7)
* **모바일 PWA 헤더 버튼 찌그러짐 수정**:
  * 모바일 기기(갤럭시 S23 등)에서 상단 헤더 버튼들이 세로로 길어지며 찌그러지는 플래그 정렬 오작동을 해결하기 위해, 모든 버튼의 높이를 `height: 38px`로 통일하고 가로 비율을 정교하게 쪼갠 반응형 CSS 패치 완료.
  * Firebase Hosting 및 Vercel 실배포 완료 확인.
* **Vercel SPA 404 Routing Redirect 해결**:
  * Vercel 배포 주소에서 서브 경로 새로고침 시 404 에러가 발생하던 문제를 해결하기 위해, 모든 서브 트래픽을 `index.html`로 리라이트해 주는 `vercel.json` 파일을 추가하고 배포 완료.
* **PWA 중복 앱 설치 감지(WebAPK) 트러블슈팅**:
  * 크롬 브라우저 캐시 및 시스템 애플리케이션 완전 삭제를 유도하여, 중복 기설치 오류로 주소창에서 PWA 설치 버튼이 뜨지 않던 문제를 해결하는 수동 설치 절차서 확립.
* **옵시디언 PWA 네트워크 차단 원인 정밀 규명**:
  * 외부 HTTPS 도메인에서 로컬 HTTP 포트로 데이터 전송 시 브라우저가 통신을 차단하는 혼합 콘텐츠(Mixed Content) 정책 및 루프백 주소 도달 불가능성 원인 분석 완료.
  * 기술 로그([Docs/20260702_AliaBot_Phase57_Obsidian_Network_Block_VTL.md](file:///c:/Users/eugene/Projects/Work01_Anti/Docs/20260702_AliaBot_Phase57_Obsidian_Network_Block_VTL.md))로 문서 보존 완료.

---

### 🗓️ Phase 5.8: 옵시디언 딥링크 모듈 도입 및 노션 연동 (다음 세션 주 목표)
* **PWA 호환 Obsidian URI (딥링크) 구현**:
  * [src/api/obsidian.js](file:///c:/Users/eugene/Projects/Work01_Anti/src/api/obsidian.js) 모듈 내에 `obsidian://new` 커스텀 스키마 링크를 생성하는 로직 구현.
  * 사용자가 모바일/외부 기기 PWA 대시보드에서 Obsidian 내보내기를 누르면, 시스템 딥링크가 기기 내의 네이티브 옵시디언 앱을 즉각 기동하며 새 노트 마크다운 파일을 로컬 보관소에 생성하게 하여, 아무런 사전 세팅 없이도 대중적으로 사용 가능한 연동 완성.
* **설정 모달 내 연동 모드 토글 도입**:
  * 설정창에서 `[기본 딥링크 모드 (추천)]`과 `[고급 Local REST API 모드]`를 선택할 수 있는 UX 흐름 구축.
* **노션(Notion) 연동 설정 및 검증**:
  * 대시보드 설정 모달에 노션 토큰 및 데이터베이스 ID 저장 플로우를 완성하고, 메모 발송 시 노션 API 파이프라인 실시간 데이터 적재 최종 확인.

---

## 📚 세션 관련 VTL & SOP 문서 보관 현황
* **`Docs/20260702_AliaBot_Phase57_Obsidian_Network_Block_VTL.md`**: 옵시디언 PWA 네트워크 차단 현상 규명 및 딥링크 설계 기술로그
* **`Docs/Session_SOP_Guidelines.md`**: 세션 운영 표준 지침서 (마스터 세션 인젝션 정보 수록)
* **`Docs/20260628_VTL_SOP_SessionName_Update_SOP.md`**: 세션 접두사 동적 명명 및 VTL 작성 표준 절차서

---

## 🏁 새로운 세션 시작 가이드 (First Prompt)

사용자님, 새로운 대화창(Conversation Session)을 시작하신 후 첫 프롬프트의 맨 위에 아래 인스트럭션 구문을 그대로 복사해서 붙여넣어 주세요!

```markdown
[System Instruction: 
Please set this session name format as: "AliaBot Phase 5.8: Obsidian Deep Link & Notion Integration".
Extract the core topic from the following instructions and fill it in dynamically.]

안녕! 우리는 지금 AliaBot(PWA 지휘자 앱) 프로젝트 개발을 진행 중이야.
작업을 시작하기 전에 프로젝트 폴더 내 `Docs/NextSession_ToDo.md` 파일과 `Docs/20260702_AliaBot_Phase57_Obsidian_Network_Block_VTL.md` 기술 로그를 최우선으로 정독(Parse)하고, 오늘 개발할 아키텍처와 다음 단계인 [Phase 5.8: 옵시디언 딥링크(Obsidian URI) 구현 및 노션 연동] 목표를 완벽하게 인계받아서 준비되었다고 알려줘!
```

---
session_name: "AliaBot Phase 5.7: Obsidian PWA Network Block Analysis & Transition VTL"
session_id: "4f8a91a7-ff25-4be4-942b-01fbc07a8e1b"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\Projects\Work01_Anti\Docs"
---
