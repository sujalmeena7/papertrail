param (
    [int]$Count = 25
)

Write-Host "Generating $Count commits..." -ForegroundColor Green

$messages = @(
    "chore(activity): sync automated background log",
    "docs(activity): update contribution activity metrics",
    "style(activity): refresh daily status timestamp",
    "refactor(activity): optimize workflow execution record",
    "ci(activity): append scheduled heartbeat tick",
    "build(activity): register daily build telemetry update",
    "test(activity): verify heartbeat ping check",
    "chore(logs): update project pulse log"
)

for ($i = 1; $i -le $Count; $i++) {
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss UTC")
    $msgIndex = Get-Random -Minimum 0 -Maximum $messages.Length
    $msg = "$($messages[$msgIndex]) (#$i)"
    
    Add-Content -Path "ACTIVITY.md" -Value "- [$timestamp] Local activity tick #$i - $msg"
    git add ACTIVITY.md
    git commit -m "$msg"
}

Write-Host "Pushing commits to origin main..." -ForegroundColor Cyan
git pull --rebase origin main
git push origin main
Write-Host "Successfully pushed $Count commits!" -ForegroundColor Green
