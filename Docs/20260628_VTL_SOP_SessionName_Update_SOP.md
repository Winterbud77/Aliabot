# 📋 SOP: 기존 VTL/SOP YAML Frontmatter 세션 정보 일괄 보완 절차서 (VSOP)

---
title: "SOP: 기존 VTL/SOP YAML Frontmatter 세션 정보 일괄 보완 절차서 (VSOP)"
date: 2026-06-28
type: standard-procedure-log
category: Documentation
subcategory: Maintenance
tags: [sop, metadata, frontmatter, powershell, automator, bulk-update]
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
summary: "기존에 작성된 모든 VTL/SOP 마크다운 문서 최상단의 YAML 영역에 대화 세션 이름(Session Name)과 세션 UUID(Session ID)를 안전하고 편리하게 일괄 주입하는 표준 절차 및 자동화 스크립트 가이드"
---

> **목적 (Purpose)**:
> 과거 작성된 VTL(기술로그) 및 SOP(절차서) 파일들은 대화 세션과 동떨어지기 쉬우므로, 마크다운 YAML Frontmatter에 실제 대화방 이름(예: `session_name: "Restoring Session Test09"`)과 물리 디렉토리 경로에 매칭되는 세션 식별 아이디(예: `session_id: "4a121658-e924-48e9-9455-497feba68766"`)를 동시에 기입하여 나중에 깃허브나 옵시디언에서 맥락을 신속하게 역추적할 수 있도록 돕습니다. 수작업의 번거로움을 제거하기 위한 PowerShell 기반 일괄 자동 주입 방안을 정의합니다.

---

## 1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)

### ① YAML Frontmatter (YAML 프론트매터)
* **개념**: 마크다운 파일 최상단에 세 개의 대시(`---`)로 둘러싸인 구역으로, 문서의 제목, 날짜, 태그 등 기계가 파싱할 수 있는 정형화된 메타데이터를 저장하는 메커니즘입니다.
* **작동 원리**: 옵시디언이나 정적 웹 빌더는 이 영역을 해석하여 데이터베이스 인덱스를 구축합니다. 여기에 `session_name`과 `session_id` 속성을 추가하면 특정 대화 맥락별로 노트를 필터링하고 그룹화할 수 있게 됩니다.

### ② Traceability Retrofitting (사후 추적 가능성 보완)
* **개념**: 과거에 생성된 다수의 텍스트 파일 내용을 읽어 특정 패턴을 탐색한 뒤, 그 바로 아래 줄에 누락된 필드를 일제히 밀어 넣어 보완하는 기법입니다.
* **작동 원리**: 파워쉘(PowerShell)의 텍스트 스트림 치환 기술을 활용하여, 각 파일의 YAML 경계선 내부 구조를 파괴하지 않고 안전하게 한 줄의 속성만 삽입하여 저장합니다.

---

## 2. 🗂️ YAML 세션명 보완 자동화 절차 (Step-by-Step)

이 보완 작업은 수동으로 파일을 하나씩 열어 고치면 실수가 잦고 번거롭지만, 아래 절차대로 **전용 파워쉘 스크립트**를 활용하면 5초 만에 완수할 수 있습니다.

### Step 1: 자동 보완 스크립트 파일 생성
1. 프로젝트 루트의 `Docs/` 폴더 내에 `Docs/inject-session-name.ps1` 파일을 생성합니다.
2. 아래의 파워쉘 스크립트 코드를 그대로 붙여넣고 저장합니다:

```powershell
# Docs/inject-session-name.ps1
# 사용법: .\Docs\inject-session-name.ps1 -SessionName "Restoring Session Test09" -SessionId "4a121658-e924-48e9-9455-497feba68766" -TargetFiles "20260627_AliaBot*.md"

param (
    [Parameter(Mandatory=$true)]
    [string]$SessionName,       # 주입할 대화 세션 한글 명칭
    [Parameter(Mandatory=$true)]
    [string]$SessionId,         # 주입할 대화 세션 UUID (저장소 명칭)
    [string]$TargetFiles = "*.md" # 대상 파일 패턴 (예: 특정 일자나 전체 대상)
)

# PSScriptRoot가 정의되지 않은 콘솔 환경을 대비한 폴백 처리
$DocsPath = $PSScriptRoot
if (-not $DocsPath) {
    $DocsPath = Join-Path (Get-Location) "Docs"
}

Write-Output "🔍 대상 경로: $DocsPath"
Write-Output "🏷️ 주입할 세션명: $SessionName"
Write-Output "🆔 주입할 세션 ID: $SessionId"

if (-not (Test-Path -Path $DocsPath)) {
    Write-Error "❌ Docs 폴더를 찾을 수 없습니다: $DocsPath"
    exit
}

# Docs 폴더 내 조건에 맞는 마크다운 파일 검색
$Files = Get-ChildItem -Path $DocsPath -Filter $TargetFiles | Where-Object { $_.Name -ne "inject-session-name.ps1" }

if ($Files.Count -eq 0) {
    Write-Output "⚠️ 조건에 맞는 마크다운 파일이 존재하지 않습니다."
    exit
}

foreach ($File in $Files) {
    $FilePath = $File.FullName
    $Content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
    
    # 개행 문자 LF로 일체 통일하여 오동작 방지
    $LfContent = $Content -replace "`r`n", "`n"
    
    # 1) session_name 처리
    if ($LfContent -match '(?m)^session_name:\s*') {
        $LfContent = $LfContent -replace '(?m)^session_name:.*$', "session_name: `"$SessionName`""
    } else {
        $Parts = $LfContent -split '(?m)^---'
        if ($Parts.Length -ge 3) {
            $Parts[1] = $Parts[1].TrimEnd() + "`nsession_name: `"$SessionName`"`n"
            $LfContent = $Parts -join "---"
        } else {
            Write-Output "⚠️ YAML Frontmatter를 찾지 못함 (패스): $($File.Name)"
            continue
        }
    }

    # 2) session_id 처리
    if ($LfContent -match '(?m)^session_id:\s*') {
        $LfContent = $LfContent -replace '(?m)^session_id:.*$', "session_id: `"$SessionId`""
    } else {
        $Parts = $LfContent -split '(?m)^---'
        if ($Parts.Length -ge 3) {
            $Parts[1] = $Parts[1].TrimEnd() + "`nsession_id: `"$SessionId`"`n"
            $LfContent = $Parts -join "---"
        }
    }
    
    Write-Output "✅ 메타데이터 업데이트 성공: $($File.Name)"
    
    # 파일 쓰기 (UTF-8 인코딩 명시)
    [System.IO.File]::WriteAllText($FilePath, $LfContent, [System.Text.Encoding]::UTF8)
}

Write-Output "🎉 모든 대상 VTL/SOP에 세션 정보 주입이 완료되었습니다!"
```

---

### Step 2: 터미널에서 스크립트 구동
1. VSCode 터미널(PowerShell)을 엽니다.
2. 보완하고자 하는 타겟 파일명 패턴과 실제 대화 세션 명칭 및 UUID를 인자로 주어 아래 명령어를 실행합니다.
   * **예시 1: 특정 일자 VTL/SOP 파일에만 주입할 경우**
     ```powershell
     powershell -ExecutionPolicy Bypass -File Docs/inject-session-name.ps1 -SessionName "Restoring Session Test09" -SessionId "4a121658-e924-48e9-9455-497feba68766" -TargetFiles "*20260627*.md"
     ```
   * **예시 2: Docs 폴더 내의 모든 마크다운 파일에 일괄 주입할 경우**
     ```powershell
     powershell -ExecutionPolicy Bypass -File Docs/inject-session-name.ps1 -SessionName "Restoring Session Test09" -SessionId "4a121658-e924-48e9-9455-497feba68766" -TargetFiles "*.md"
     ```

---

### Step 3: Git 변경 내역 검증 및 백업
1. 파일이 정상적으로 수정되었는지 `git diff`를 통해 확인합니다.
   * YAML 내부에 `session_name`과 `session_id` 줄이 제대로 추가되었는지 확인합니다.
2. 검증이 완료되면 원격 저장소에 업로드합니다:
   ```powershell
   git add .
   git commit -m "Docs: Inject session_name and session_id metadata into frontmatter"
   git push
   ```

---

## 3. ❓ 자주 묻는 질문 (FAQ)

* **Q. 실수로 잘못된 세션명/아이디를 주입했어요. 되돌릴 수 있나요?**
  * **A.** Git 커밋 전이라면 터미널에 `git restore Docs/*.md` 명령어를 입력하여 즉시 안전하게 원본 상태로 되돌릴 수(Rollback) 있습니다.
* **Q. 세션 ID(UUID)는 어디서 확인하나요?**
  * **A.** Antigravity의 과거 세션 백업 폴더 경로명인 `C:\Users\eugene\.gemini\antigravity\brain\<UUID>`에서 해당 폴더의 36자리 알파벳/숫자 혼합명을 확인하여 입력하시면 됩니다.
