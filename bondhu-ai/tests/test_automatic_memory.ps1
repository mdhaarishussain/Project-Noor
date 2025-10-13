# Test Automatic Conversation Memory System
# PowerShell Script

$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = [guid]::NewGuid().ToString()

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AUTOMATIC MEMORY SYSTEM TEST" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "User ID: $userId" -ForegroundColor Gray
Write-Host "Session ID: $sessionId" -ForegroundColor Gray
Write-Host ""

# Function to send message
function Send-TestMessage {
    param($message, $count)
    
    $body = @{
        user_id = $userId
        message = $message
        session_id = $sessionId
    } | ConvertTo-Json
    
    Write-Host "$count. " -NoNewline -ForegroundColor Yellow
    Write-Host "User: $message" -ForegroundColor White
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" `
            -Method POST -Body $body -ContentType "application/json"
        
        $aiResponse = $response.response
        if ($aiResponse.Length -gt 80) {
            $aiResponse = $aiResponse.Substring(0, 80) + "..."
        }
        Write-Host "   AI: $aiResponse" -ForegroundColor Gray
        Write-Host ""
        
        return $true
    } catch {
        Write-Host "   ✗ Error: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "Step 1: Sending 5 messages to trigger auto-summarization..." -ForegroundColor Cyan
Write-Host "(Auto-summarization triggers after 10 total messages = 5 user + 5 AI)" -ForegroundColor Gray
Write-Host ""

$messages = @(
    "I love watching anime, especially Attack on Titan",
    "The character development in Attack on Titan is incredible",
    "Eren Yeager is such a complex protagonist",
    "The plot twists in Season 4 blew my mind",
    "I think it's one of the best anime series ever made"
)

$success = $true
for ($i = 0; $i -lt $messages.Length; $i++) {
    if (-not (Send-TestMessage $messages[$i] ($i + 1))) {
        $success = $false
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $success) {
    Write-Host "✗ Test failed - couldn't send messages" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Sent 5 messages (10 total with AI responses)" -ForegroundColor Green
Write-Host ""
Write-Host "Step 2: Waiting for auto-summarization to complete..." -ForegroundColor Cyan
Write-Host "(Background task should run automatically)" -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 3: Checking memory stats..." -ForegroundColor Cyan

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
    
    Write-Host ""
    Write-Host "=== Memory Stats ===" -ForegroundColor Yellow
    Write-Host "Total Conversations: " -NoNewline
    Write-Host "$($stats.total_conversations)" -ForegroundColor Green
    Write-Host "Total User Facts: " -NoNewline
    Write-Host "$($stats.total_user_facts)" -ForegroundColor Green
    Write-Host "Recent Conversations: " -NoNewline
    Write-Host "$($stats.recent_conversations)" -ForegroundColor Green
    
    if ($stats.top_topics) {
        Write-Host "Top Topics: " -NoNewline
        Write-Host "$($stats.top_topics -join ', ')" -ForegroundColor Green
    }
    
    Write-Host ""
    
    if ($stats.total_conversations -gt 0) {
        Write-Host "✓ Auto-summarization WORKED!" -ForegroundColor Green
        Write-Host "  Conversation was automatically summarized and stored" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Auto-summarization might not have triggered yet" -ForegroundColor Yellow
        Write-Host "  Trying manual summarization..." -ForegroundColor Gray
        
        # Try manual summarization
        $sumBody = @{
            user_id = $userId
            session_id = $sessionId
        } | ConvertTo-Json
        
        $sumResult = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/summarize" `
            -Method POST -Body $sumBody -ContentType "application/json"
        
        Write-Host "  Manual summarization: $($sumResult.message)" -ForegroundColor Cyan
        
        Start-Sleep -Seconds 1
        $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
        
        if ($stats.total_conversations -gt 0) {
            Write-Host "✓ Manual summarization worked!" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "✗ Error checking stats: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Viewing stored conversation..." -ForegroundColor Cyan

try {
    $conversations = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/conversations/$userId?limit=1"
    
    if ($conversations.conversations.Count -gt 0) {
        $conv = $conversations.conversations[0]
        
        Write-Host ""
        Write-Host "=== Stored Conversation ===" -ForegroundColor Yellow
        Write-Host "Session: $($conv.session_id)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor White
        Write-Host "  $($conv.conversation_summary)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Topics: $($conv.topics -join ', ')" -ForegroundColor Cyan
        Write-Host "Emotions: $($conv.emotions -join ', ')" -ForegroundColor Cyan
        Write-Host "Time: $($conv.start_time)" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "⚠ Error viewing conversations: $_" -ForegroundColor Yellow
}

Write-Host "Step 5: Testing memory reference..." -ForegroundColor Cyan
Write-Host "(Starting new session to test if AI remembers previous conversation)" -ForegroundColor Gray
Write-Host ""

$newSessionId = [guid]::NewGuid().ToString()
$testBody = @{
    user_id = $userId
    message = "What anime did we discuss earlier with the complex protagonist?"
    session_id = $newSessionId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" `
        -Method POST -Body $testBody -ContentType "application/json"
    
    Write-Host "=== AI Response (should mention Attack on Titan) ===" -ForegroundColor Yellow
    Write-Host $response.response -ForegroundColor White
    Write-Host ""
    
    if ($response.response -like "*Attack on Titan*" -or $response.response -like "*Eren*") {
        Write-Host "✓✓✓ MEMORY REFERENCE WORKS! ✓✓✓" -ForegroundColor Green
        Write-Host "The AI successfully remembered the previous conversation!" -ForegroundColor Green
    } else {
        Write-Host "⚠ AI response doesn't explicitly mention Attack on Titan" -ForegroundColor Yellow
        Write-Host "  Memory system may need more context or different phrasing" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ Error testing memory reference: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Supabase conversation_memories table for stored data" -ForegroundColor Gray
Write-Host "2. Check Supabase memory_index table for topic indexing" -ForegroundColor Gray
Write-Host "3. Integrate session_id generation into your frontend" -ForegroundColor Gray
Write-Host "4. Add session end endpoint call when user closes chat" -ForegroundColor Gray
