#!/usr/bin/env powershell
# Docker Compose Deployment Script for Bondhu AI
# Handles clean rebuild and deployment with verification

param(
    [switch]$Clean,
    [switch]$Build,
    [switch]$NoBuild,
    [switch]$Logs
)

Write-Host "🚀 Bondhu AI Docker Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to bondhu-ai directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Clean up old containers and volumes if requested
if ($Clean) {
    Write-Host "🧹 Cleaning up old containers and volumes..." -ForegroundColor Yellow
    docker compose down -v
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
    Write-Host ""
}

# Build images if requested or if not explicitly disabled
if ($Build -or (-not $NoBuild)) {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    if ($Build) {
        # Force rebuild without cache
        docker compose build --no-cache
    } else {
        # Normal build (uses cache)
        docker compose build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
}

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "bondhu"

# Check Redis connection
Write-Host ""
Write-Host "🔌 Testing Redis connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker exec bondhu-api python test_redis_connection.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis connection test passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis connection test had issues" -ForegroundColor Yellow
}

# Test API health endpoint
Write-Host ""
Write-Host "❤️  Testing API health endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 10
    Write-Host "✅ API is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  API health check failed: $_" -ForegroundColor Yellow
}

# Test Celery
Write-Host ""
Write-Host "🌾 Testing Celery worker..." -ForegroundColor Yellow
docker exec bondhu-celery-worker celery -A core.celery_app inspect ping 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Celery worker is responding" -ForegroundColor Green
} else {
    Write-Host "⚠️  Celery worker is not responding yet (this is normal on first start)" -ForegroundColor Yellow
}

# Show recent logs
Write-Host ""
Write-Host "📋 Recent logs (last 10 lines each):" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- Redis ---" -ForegroundColor Gray
docker logs --tail 10 bondhu-redis
Write-Host ""
Write-Host "--- API ---" -ForegroundColor Gray
docker logs --tail 10 bondhu-api
Write-Host ""
Write-Host "--- Celery ---" -ForegroundColor Gray
docker logs --tail 10 bondhu-celery-worker

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Services:" -ForegroundColor White
Write-Host "   Backend API:  http://localhost:8000" -ForegroundColor Gray
Write-Host "   API Docs:     http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "   Redis:        localhost:6379" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor White
Write-Host "   View logs:           docker compose logs -f" -ForegroundColor Gray
Write-Host "   View API logs:       docker logs -f bondhu-api" -ForegroundColor Gray
Write-Host "   View Celery logs:    docker logs -f bondhu-celery-worker" -ForegroundColor Gray
Write-Host "   Monitor resources:   docker stats" -ForegroundColor Gray
Write-Host "   Stop services:       docker compose down" -ForegroundColor Gray
Write-Host "   Restart API:         docker compose restart bondhu-api" -ForegroundColor Gray
Write-Host ""

# Follow logs if requested
if ($Logs) {
    Write-Host "📋 Following logs (Ctrl+C to stop)..." -ForegroundColor Yellow
    docker compose logs -f
}
