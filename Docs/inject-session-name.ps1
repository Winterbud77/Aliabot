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
