# Quick Stats API Test Script
# Tests all stats endpoints after server restart

Write-Host "`n[Testing Stats System]" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/health" -Method Get
    Write-Host "[SUCCESS] Health Check: $($health.status)" -ForegroundColor Green
    Write-Host "   Service: $($health.service)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "[FAILED] Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Dashboard Stats
Write-Host "`n2. Testing Dashboard Stats..." -ForegroundColor Yellow
$testUserId = "550e8400-e29b-41d4-a716-446655440000"
try {
    $dashboard = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/dashboard/$testUserId" -Method Get
    Write-Host "[SUCCESS] Dashboard Stats Retrieved:" -ForegroundColor Green
    Write-Host "   Wellness Score: $($dashboard.wellness_score)/100 ($($dashboard.wellness_change_text))" -ForegroundColor Cyan
    Write-Host "   Chat Sessions: $($dashboard.chat_sessions) ($($dashboard.chat_sessions_change))" -ForegroundColor Cyan
    Write-Host "   Growth Streak: $($dashboard.growth_streak_days) days ($($dashboard.growth_streak_status))" -ForegroundColor Cyan
    Write-Host "   Games Played: $($dashboard.games_played) ($($dashboard.games_change))" -ForegroundColor Cyan
    Write-Host "   Achievements: $($dashboard.achievements) ($($dashboard.achievements_change))" -ForegroundColor Cyan
    Write-Host "   Active Sessions: $($dashboard.active_sessions_text)" -ForegroundColor Cyan
    Write-Host "   Longest Streak: $($dashboard.longest_streak) days" -ForegroundColor Cyan
} catch {
    Write-Host "[FAILED] Dashboard stats failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Wellness Score
Write-Host "`n3. Testing Wellness Score..." -ForegroundColor Yellow
try {
    $wellness = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/wellness/$testUserId" -Method Get
    Write-Host "[SUCCESS] Wellness Score: $($wellness.score)/100" -ForegroundColor Green
    Write-Host "   Change: $($wellness.change_text)" -ForegroundColor Gray
} catch {
    Write-Host "[FAILED] Wellness score failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Achievements List
Write-Host "`n4. Testing Achievements..." -ForegroundColor Yellow
try {
    $achievements = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/achievements/$testUserId" -Method Get
    Write-Host "[SUCCESS] Achievements: $($achievements.total_unlocked)/$($achievements.total_available) unlocked" -ForegroundColor Green
    
    if ($achievements.achievements.Count -gt 0) {
        Write-Host "`n   Available Achievements:" -ForegroundColor Gray
        foreach ($achievement in $achievements.achievements | Select-Object -First 5) {
            if ($achievement.unlocked) {
                $status = "[UNLOCKED]"
            } else {
                $status = "[Locked]  "
            }
            $name = $achievement.achievement_name
            $days = $achievement.requirement_value
            Write-Host "   $status $name - $days days" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[FAILED] Achievements failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Streak Info
Write-Host "`n5. Testing Streak Info..." -ForegroundColor Yellow
try {
    $streak = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats/streak/$testUserId" -Method Get
    Write-Host "[SUCCESS] Current Streak: $($streak.current_streak_days) days" -ForegroundColor Green
    Write-Host "   Longest Streak: $($streak.longest_streak_days) days" -ForegroundColor Gray
    Write-Host "   Started: $($streak.streak_start_date)" -ForegroundColor Gray
} catch {
    Write-Host "[FAILED] Streak info failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[All tests complete!]" -ForegroundColor Green
Write-Host "`n[INFO] To track activity, use:" -ForegroundColor Cyan
Write-Host "   POST http://localhost:8000/api/v1/stats/activity/$testUserId`?activity_type=chat" -ForegroundColor White
Write-Host "   POST http://localhost:8000/api/v1/stats/activity/$testUserId`?activity_type=game" -ForegroundColor White
