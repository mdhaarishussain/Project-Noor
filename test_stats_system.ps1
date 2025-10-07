# Quick Stats System Test
$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"

Write-Host "=== STATS SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/health"
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Backend not running or stats router not registered" -ForegroundColor Red
    exit 1
}

# Test 2: Get Dashboard Stats
Write-Host ""
Write-Host "2. Getting Dashboard Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/dashboard/$userId"
    Write-Host "   Wellness Score: $($stats.wellness_score)" -ForegroundColor Cyan
    Write-Host "   Chat Sessions: $($stats.chat_sessions)" -ForegroundColor Cyan
    Write-Host "   Games Played: $($stats.games_played)" -ForegroundColor Cyan
    Write-Host "   Growth Streak: $($stats.growth_streak_days) days" -ForegroundColor Cyan
    Write-Host "   Achievements: $($stats.achievements)" -ForegroundColor Cyan
    Write-Host "   Active Sessions: $($stats.active_sessions)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Wellness Score Detail
Write-Host ""
Write-Host "3. Getting Wellness Score..." -ForegroundColor Yellow
try {
    $wellness = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/wellness/$userId"
    Write-Host "   Score: $($wellness.score)/100" -ForegroundColor Cyan
    Write-Host "   Change: $($wellness.change_text)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Streak Info
Write-Host ""
Write-Host "4. Getting Streak Info..." -ForegroundColor Yellow
try {
    $streak = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/streak/$userId"
    Write-Host "   Current Streak: $($streak.current_streak) days" -ForegroundColor Cyan
    Write-Host "   Longest Streak: $($streak.longest_streak) days" -ForegroundColor Cyan
    Write-Host "   Status: $($streak.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Achievements
Write-Host ""
Write-Host "5. Getting Achievements..." -ForegroundColor Yellow
try {
    $achievements = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/achievements/$userId"
    Write-Host "   Total: $($achievements.total_unlocked) / $($achievements.total_available) unlocked" -ForegroundColor Cyan
    
    if ($achievements.total_unlocked -gt 0) {
        Write-Host "   Unlocked Achievements:" -ForegroundColor Green
        $achievements.achievements | Where-Object { $_.unlocked } | ForEach-Object {
            Write-Host "     $($_.achievement_name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Track Activity
Write-Host ""
Write-Host "6. Tracking Chat Activity..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/activity/$userId?activity_type=chat" -Method POST
    Write-Host "   Success: $($result.message)" -ForegroundColor Green
    Write-Host "   Current Streak: $($result.current_streak) days" -ForegroundColor Cyan
    Write-Host "   Wellness Score: $($result.wellness_score)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If errors occurred, run database migration (enhanced_stats_system.sql)" -ForegroundColor Gray
Write-Host "2. Send a few chat messages to build up stats" -ForegroundColor Gray
Write-Host "3. Check again tomorrow to see streak increment" -ForegroundColor Gray
Write-Host "4. Integrate into frontend with provided React component" -ForegroundColor Gray
