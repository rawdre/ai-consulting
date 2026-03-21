# Rawbot 🔥 publish helper for Raw AI site
# Canonical site source: ai-consulting/
# Target repo: https://github.com/rawdre/ai-consulting.git

param(
    [switch]$PushMain
)

$ErrorActionPreference = 'Stop'
$root = "C:\Users\Andre Raw\.openclaw\workspace"

Write-Host "[Rawbot] Checking git branch + remotes..." -ForegroundColor Cyan
git -C $root branch -a
git -C $root remote -v

Write-Host "`n[Rawbot] Checking tracked Raw AI site files..." -ForegroundColor Cyan
git -C $root ls-files ai-consulting

Write-Host "`n[Rawbot] Latest local commits..." -ForegroundColor Cyan
git -C $root log --oneline -5

if ($PushMain) {
    Write-Host "`n[Rawbot] Pushing current branch to origin/main..." -ForegroundColor Yellow
    git -C $root push origin HEAD:main
}
else {
    Write-Host "`n[Rawbot] Dry run complete. Re-run with -PushMain to publish." -ForegroundColor Green
}
