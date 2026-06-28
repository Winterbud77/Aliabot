---
title: "SOP: C드라이브 용량 확보 및 캐시(VM) 관리 지침 - Gemini (Antigravity)"
date: 2026-04-08
type: note
category: 생산성향상
subcategory: 시스템관리
tags:
  - troubleshooting
  - disk_management
  - format/tutorial
created: 2026-04-08
ai_model: Gemini (Antigravity)
workspace: Winterbud-03MS
summary: "C드라이브 용량 널뛰기 현상 해결을 위해 윈도우 기본 정리부터 AI 앱 가상 환경(VM) 캐시를 D드라이브로 이사시키는 과정까지를 수록한 통합 표준 매뉴얼입니다."
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
---

# 📋 [SOP] C드라이브 용량 확보 및 캐시(VM) 이관 지침 - Gemini (Antigravity)

본 문서는 C드라이브 용량이 부족할 때, 특히 로컬 AI 도구(Claude 등)를 사용할 때 발생하는 대용량 캐시 문제를 해결하기 위한 단계별 행동 지침서입니다.

---

## 🔍 Step 1. 문제 증상 및 진단 (Diagnosis)

가장 먼저 용량이 어디서 사라지고 있는지 확인해야 합니다.

![C드라이브 여유 공간 부족 확인](SOP_Images/media__1775455802555.jpg)
*▲ 시스템 알림이나 탐색기에서 C드라이브가 붉은색으로 표시되거나 5GB 미만인 경우 본 가이드를 적용합니다.*

![동기화 충돌 파일 누적 확인](SOP_Images/media__1775455802575.jpg)
*▲ 옵시디언 금고 내에 `Spaces (conflict...).mdb` 처럼 긴 이름의 파일들이 수백 개씩 생겼다면, 용량 이전에 동기화 문제를 먼저 해결해야 합니다.*

---

## 🧹 Step 2. 1단계 조치: 윈도우 시스템 파일 정리

운영체제가 업데이트를 하고 남긴 찌꺼기 파일들(약 20~50GB)을 먼저 청소합니다.

![디스크 정리 실행 및 스캔](SOP_Images/media__1775460627859.jpg)
*▲ 탐색기에서 C드라이브 우클릭 -> [속성] -> [디스크 정리]를 실행합니다.*

![시스템 파일 정리 옵션 선택](SOP_Images/media__1775460627926.jpg)
*▲ 반드시 **[시스템 파일 정리(S)]**를 눌러 '이전 Windows 설치'나 '업데이트 클린업'을 체크하고 삭제해야 수십 기가의 공간이 나옵니다.*

---

## 🚀 Step 3. 2단계 조치: 대용량 AI 앱 캐시 색출

디스크 정리를 해도 용량이 부족하다면, 로컬 AI 앱이 생성한 10GB 이상의 거대 번들 파일을 의심해야 합니다.

![비정상 경로 추적](SOP_Images/media__1775462256323.jpg)
*▲ `C:\Users\사용자명\AppData\Roaming\Claude\vm_bundles` 폴더를 확인하세요.*

![거대 가상 하드 파일(vhdx) 발견](SOP_Images/media__1775462256385.jpg)
*▲ 내부의 `.vhdx` 파일이 10GB가 넘는다면, 이 파일이 C드라이브를 고갈시키는 주범입니다.*

---

## 🏗️ Step 4. 3단계 조치 (반영구적): D드라이브로 '마법의 문' 설치

이 짐덩어리를 텅 빈 D드라이브로 옮기면서, C드라이브가 이를 인식하게 하는 '심볼릭 링크(Junction)' 기술을 적용합니다.

### 🛠️ 자동 해결 스크립트 실행법 (배치 파일)
메모장을 열고 아래 내용을 복사한 뒤 `Claude_이사하기.bat`라는 이름으로 바탕화면에 저장하고 **우클릭 -> 관리자 권한으로 실행** 하세요.

```batch
@echo off
:: 1. 클로드 종료
taskkill /f /im Claude.exe
timeout /t 2

:: 2. D드라이브에 새 집 마련
if not exist "D:\Claude_vm_bundles" mkdir "D:\Claude_vm_bundles"

:: 3. 기존 짐 이사 (C -> D)
move "C:\Users\user\AppData\Roaming\Claude\vm_bundles\*" "D:\Claude_vm_bundles"

:: 4. 가짜 문(Junction) 설치
rmdir "C:\Users\user\AppData\Roaming\Claude\vm_bundles"
mklink /j "C:\Users\user\AppData\Roaming\Claude\vm_bundles" "D:\Claude_vm_bundles"

echo 모든 조치가 완료되었습니다! 이제 C드라이브 용량 걱정은 끝입니다.
pause
```

---

## ✅ Step 5. 완료 및 유지보수

조치가 완료되면 아래와 같이 C드라이브의 숨통이 트이게 됩니다.

![최종 조치 완료 후 공간 확보 보고](SOP_Images/media__1775530048954.jpg)

### 📌 향후 주의 사항
1. **D드라이브 관리:** 이제 Claude 데이터는 D드라이브에 쌓입니다. D드라이브의 여유 공간(현재 약 77GB)을 가끔 체크해 주세요.
2. **동기화 주의:** 옵시디언 동기화 충돌 파일이 다시 생기면, 제가 어제 보내 드린 '충돌 파일 삭제 스크립트'를 다시 한번 실행해 주시면 됩니다.

---
*이 매뉴얼은 사용자님의 PC 환경 최적화를 위해 Gemini(Antigravity) AI 에 의해 작성되었습니다.*
