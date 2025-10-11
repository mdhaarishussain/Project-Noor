# Simple Automatic Memory Test
$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = [guid]::NewGuid().ToString()

Write-Host "=== AUTOMATIC MEMORY TEST ===" -ForegroundColor Cyan
Write-Host "Session: $sessionId" -ForegroundColor Gray
Write-Host ""

# Send 5 messages
$messages = @(
    "I love watching anime, especially Attack on Titan",
    "The character development is incredible",
    "Eren Yeager is such a complex protagonist",
    "The plot twists in Season 4 blew my mind",
    "I think it's one of the best anime series"
)

Write-Host "Sending 5 messages..." -ForegroundColor Yellow
for ($i = 0; $i -lt $messages.Length; $i++) {
    $body = @{
        user_id = $userId
        message = $messages[$i]
        session_id = $sessionId
    } | ConvertTo-Json
    
    Write-Host "$($i+1). $($messages[$i])" -ForegroundColor White
    Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json" | Out-Null
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Waiting for auto-summarization..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Checking memory stats..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
Write-Host "Total Conversations: $($stats.total_conversations)" -ForegroundColor Green
Write-Host "Top Topics: $($stats.top_topics -join ', ')" -ForegroundColor Green

Write-Host ""
if ($stats.total_conversations -eq 0) {
    Write-Host "Auto-summarization not triggered yet. Trying manual..." -ForegroundColor Yellow
    $sumBody = @{ user_id = $userId; session_id = $sessionId } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/summarize" -Method POST -Body $sumBody -ContentType "application/json" | Out-Null
    Start-Sleep -Seconds 1
    $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
    Write-Host "After manual trigger: $($stats.total_conversations) conversations" -ForegroundColor Green
}

Write-Host ""
Write-Host "Testing memory reference..." -ForegroundColor Yellow
$newSessionId = [guid]::NewGuid().ToString()
$testBody = @{
    user_id = $userId
    message = "What anime did we discuss earlier?"
    session_id = $newSessionId
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $testBody -ContentType "application/json"
Write-Host ""
Write-Host "AI Response:" -ForegroundColor Cyan
Write-Host $response.response

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
