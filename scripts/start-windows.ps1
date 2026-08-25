$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

docker compose up -d --build

Write-Host "Prelegal is running at http://localhost:8000"
