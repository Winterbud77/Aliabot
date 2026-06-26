# AliaBot Docs to Obsidian Sync Script
$ErrorActionPreference = "Continue"

$Src = "C:\Users\eugene\Projects\Work01_Anti\Docs"
$Dst = "C:\Users\eugene\OneDrive\Obsidian\Winterbud-03MS\100 Source\AliaBot_Docs"

Write-Host "Sync Starting..."
Write-Host "Source: $Src"
Write-Host "Destination: $Dst"

if (-not (Test-Path $Dst)) {
    New-Item -ItemType Directory -Path $Dst -Force | Out-Null
}

$Files = Get-ChildItem -Path $Src -Filter "*.md" -Recurse

$Copied = 0
$Skipped = 0

foreach ($F in $Files) {
    $Rel = $F.FullName.Substring($Src.Length)
    $Target = Join-Path $Dst $Rel
    $TargetFolder = Split-Path $Target -Parent

    if (-not (Test-Path $TargetFolder)) {
        New-Item -ItemType Directory -Path $TargetFolder -Force | Out-Null
    }

    $CopyFlag = $true

    if (Test-Path $Target) {
        $SrcHash = (Get-FileHash -Path $F.FullName -Algorithm MD5).Hash
        $DstHash = (Get-FileHash -Path $Target -Algorithm MD5).Hash
        if ($SrcHash -eq $DstHash) {
            $CopyFlag = $false
        }
    }

    if ($CopyFlag) {
        Copy-Item -Path $F.FullName -Destination $Target -Force
        Write-Host "Copied: $($F.Name)"
        $Copied++
    } else {
        $Skipped++
    }
}

$SrcImages = Join-Path $Src "Screenshots"
if (Test-Path $SrcImages) {
    Write-Host "Syncing Screenshots..."
    Copy-Item -Path $SrcImages -Destination $Dst -Recurse -Container -Force
}

Write-Host "Sync Finished!"
Write-Host "Copied: $Copied | Skipped: $Skipped"
Start-Sleep -Seconds 2
