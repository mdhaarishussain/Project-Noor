#!/usr/bin/env powershell
# Quick rebuild script - stops containers, rebuilds, and restarts

Write-Host "🔄 Quick Rebuild - Redis Fix" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker compose down

# Rebuild only the API (faster than rebuilding everything)
Write-Host "🔨 Rebuilding bondhu-api..." -ForegroundColor Yellow
docker compose build bondhu-api

# Start all services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker compose up -d

# Wait a moment
Start-Sleep -Seconds 5

# Check status
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
docker compose ps

# Check logs for Redis connection
Write-Host ""
Write-Host "📋 Recent logs (checking Redis connection):" -ForegroundColor Cyan
Start-Sleep -Seconds 2
docker logs bondhu-api --tail 20 | Select-String -Pattern "Redis|redis"

Write-Host ""
Write-Host "✅ Rebuild complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To follow logs: docker compose logs -f" -ForegroundColor Gray
Write-Host "💡 To test API: curl http://localhost:8000/health" -ForegroundColor Gray
