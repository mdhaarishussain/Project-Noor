# Test Chat API with Memory System
# PowerShell script for testing conversational memory

Write-Host "=== Testing Bondhu AI Memory System ===" -ForegroundColor Cyan
Write-Host ""

$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$baseUrl = "http://localhost:8000"

# Test 1: Send initial message with facts
Write-Host "Test 1: Sending message with facts about anime..." -ForegroundColor Yellow
$body1 = @{
    user_id = $userId
    message = "My favorite anime is Re:Zero and my favorite character is Natsuki Subaru. I love how he never gives up!"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/chat/send" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✓ AI Response:" -ForegroundColor Green
    Write-Host $response1.response
    Write-Host ""
    Write-Host "Session ID: $($response1.message_id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# Test 2: Check memory stats
Write-Host "Test 2: Checking memory stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/v1/memory/stats/$userId" -Method GET
    Write-Host "✓ Memory Stats:" -ForegroundColor Green
    Write-Host "  Total Conversations: $($stats.total_conversations)" -ForegroundColor Gray
    Write-Host "  Total Facts: $($stats.total_user_facts)" -ForegroundColor Gray
    Write-Host "  Top Topics: $($stats.top_topics -join ', ')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Error checking stats: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 3: Reference previous conversation
Write-Host "Test 3: Testing memory reference..." -ForegroundColor Yellow
$body2 = @{
    user_id = $userId
    message = "Remember that anime character I mentioned earlier?"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/v1/chat/send" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✓ AI Response (should reference Natsuki Subaru):" -ForegroundColor Green
    Write-Host $response2.response
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
