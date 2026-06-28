---
title: "TechLog: AliaBot Phase 5.2 UX 보강 VTL"
date: 2026-06-01
type: ux-log
category: AliaBot
subcategory: UI-UX
tags: [aliabot, phase5.2, ux, sorting, editing, filtering, seq]
created: 2026-06-01
summary: "최신순 정렬, seq 표시(기존 데이터용 fallback), 인라인 수정/저장, 태그 필터 배너/칩 UX를 보강했습니다."
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# 🧩 AliaBot Phase 5.2 UX 보강 기록 (5/31~6/1)

이번 세션 말미에 `feature-ai-routing` 브랜치 기준으로, 메모 목록 UX를 다음 방향으로 정리했습니다.

---

## 1. 최신순 정렬
- Firestore 구독 쿼리를 `orderBy('createdAt', 'desc')`로 고정했습니다.
- 결과적으로 목록은 “최신 → 과거” 흐름을 유지합니다.

---

## 2. seq 표시 안정화 (기존 데이터 대응)
- 과거 저장된 메모 중 `seq` 필드가 없는 경우가 있어, UI에서 다음 fallback을 적용했습니다.
  - `todo.seq ?? (index + 1)`
- 사용자는 목록을 자연스럽게 “1번부터” 흐름으로 확인할 수 있습니다.

---

## 3. 인라인 수정(✏️) UX
- 각 항목에서 수정 버튼 → 텍스트 인라인 편집 → Enter/버튼으로 저장 흐름을 유지했습니다.
- 저장 후에는 즉시 목록이 반영되도록 기존 `saveTodo()` 업데이트 로직을 사용합니다.

---

## 4. 태그 필터 배너/칩
- 태그 클릭 시 `activeTag`가 갱신되며 목록 필터링이 동작합니다.
- 상단에는 `#{activeTag} 태그 필터 중` 배너가 노출되고, `✕ 전체 보기`로 해제할 수 있습니다.

---

## 5. 리스크/주의
- 현재 신규 생성 seq는 `todos.length + 1` 방식이라, 동시성(빠른 연속 입력/삭제) 상황에서는 충돌 가능성이 있습니다.
  - 장기적으로는 `max(seq)+1` 또는 트랜잭션 기반 보정이 필요합니다.

---

## 6. 다음 단계 연결 (Phase 5.3)
- Export 모달의 다중 목적지(Obsidian/Notion/Clipboard)와 태그 기반 추천은 Phase 5.3에서 확장했습니다.
- Notion 연동은 `Notion API Token + Database ID + Title/Content Property Name` 설정이 필요합니다.

