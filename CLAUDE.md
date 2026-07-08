# CLAUDE.md - Developer Agent Guidelines

This file defines the build/test commands and project-wide guidelines that every agent (e.g., Claude, Cursor) must follow when working on the **AliaBot** codebase.

## 1. Commands & Terminal Run Rules

* **Development Server (로컬 개발 서버 기동)**: `npm run dev`
* **Production Build (상용 묶음 빌드)**: `npm run build`
* **Preview Production Build (빌드 결과 임시 확인)**: `npm run preview`
* **Backend Functions Deploy (백엔드 함수 배포)**: `firebase deploy --only functions`
* **Local Data Sync (로컬 옵시디언 단방향 전파 스크립트 실행)**: `powershell -File Docs/sync-to-obsidian.ps1`

---

## 2. Crucial Guidelines & Core Principles (필수 행동 강령)

### ① Terminology & Mechanism First (개념과 원리 우선 설명)
* 어떠한 해결책이나 패치 코드를 바로 제시하지 마십시오. 
* 반드시 **1) 관련된 컴퓨터 핵심 기술 개념과 작동 원리를 유려한 한글(괄호 안 영어 병기)로 먼저 명확히 설명**한 후에, **2) 구체적인 조치 파일과 코드를 제안**하십시오.

### ② Vibe-Coding Manual Compilation (바이브코딩 백과사전 자산화 의무)
* 본 프로젝트는 **"비개발자 아키텍트도 쉽게 소프트웨어를 기획하고 동기화할 수 있는 초보자용 바이브코딩 백과사전(VSOP & VTL Collection)"**의 완성을 최종 목표로 합니다.
* 개발 과정에서 트러블슈팅(예: Open VSX 플러그인 누락, 렌더러 이슈, 인코딩 에러 대책 등)이 완료되면, 반드시 그 문제와 해결 방법을 텍스트와 Mermaid 도식으로 정리하여 **`Docs/` 내부에 날짜별 VSOP/VTL 문서로 보완 및 등록**하십시오.

### ③ Decimal Session Naming & Rollover Rules (세션 이름 세분화 규칙)
* 대화 세션의 컨텍스트(Token Limit)가 가득 차서 다른 세션으로 교체하여 문맥을 이어갈 때는 에이전트 매니저에서 **`Phase 6.2`**와 같이 메이저 소수점 번호를 갱신해 세션을 개설(Rollover)하십시오.
* 한 세션 내에서 자잘하게 흐름을 분화시킬 때는 **`Phase 6.11`**, **`Phase 6.13`** 형태로 홀수 단위 소수점 명칭을 사용해 보존하십시오.
