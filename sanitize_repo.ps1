# sanitize_repo.ps1
# Run this locally to back up and untrack config.js and ads.js before pushing.
Write-Host "Sanitizing repository (local only). This script will NOT push anything."

if (Test-Path .\config.js) {
  Write-Host "Backing up config.js -> config.local.js"
  Rename-Item -Path .\config.js -NewName config.local.js -Force
} else { Write-Host "No config.js found" }

if (Test-Path .\ads.js) {
  Write-Host "Backing up ads.js -> ads.local.js"
  Rename-Item -Path .\ads.js -NewName ads.local.js -Force
} else { Write-Host "No ads.js found" }

Write-Host "Removing any tracked config.js or ads.js from git index"
git rm --cached config.js 2>$null; git rm --cached ads.js 2>$null

Write-Host "Committing changes (local)
Please review then push manually if ready."

git add .
git commit -m "chore: remove local config and ads scripts from repo" --allow-empty
