# Docs/inject-session-name.ps1
# 사용법 (Antigravity): .\Docs\inject-session-name.ps1 -SessionName "Restoring Session Test09" -SessionId "4a121658-e924-48e9-9455-497feba68766"
# 사용법 (Claude):      .\Docs\inject-session-name.ps1 -SessionName "Claude Phase 1 Debug" -SessionId "claude-session-uuid" -AiProvider "Claude" -SessionPath "C:\Users\eugene\AppData\Roaming\Claude\Conversations"

param (
    [Parameter(Mandatory=$true)]
    [string]$SessionName,
    
    [Parameter(Mandatory=$true)]
    [string]$SessionId,
    
    [string]$AiProvider = "Antigravity",
    
    [string]$SessionPath = "C:\Users\eugene\.gemini\antigravity\brain"
)

# 스크립트가 있는 Docs 디렉토리 내의 python 스크립트 물리 경로 탐색
$PSScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $PSScriptDir) {
    $PSScriptDir = Join-Path (Get-Location) "Docs"
}
$PythonScriptPath = Join-Path $PSScriptDir "inject_session_info.py"

Write-Output "🚀 [Wrapper] Running metadata injector via Python..."

# 파이썬 실행
python $PythonScriptPath "$SessionName" "$SessionId" --provider "$AiProvider" --path "$SessionPath"
