# Simple PowerShell script to manually create a test conversation memory
# This bypasses the summarization to test if table insertion works

$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = "manual-test-session-001"

Write-Host "=== Manual Conversation Memory Creation Test ===" -ForegroundColor Cyan
Write-Host ""

# First, let's check if the Supabase connection works by checking memory stats
Write-Host "1. Testing memory stats endpoint..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId" -Method GET
    Write-Host "✓ Stats endpoint works" -ForegroundColor Green
    Write-Host "  Current conversations: $($stats.total_conversations)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Stats endpoint failed: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "2. Checking if test summarization endpoint exists..." -ForegroundColor Yellow
Write-Host "   (This will likely fail, but let's try)" -ForegroundColor Gray

# The issue is that summarize_session is failing
# Let's see if we can get more details about WHY it's failing

Write-Host ""
Write-Host "=== Analysis ===" -ForegroundColor Cyan
Write-Host "The summarization endpoint is failing with 'Failed to summarize conversation'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Possible reasons:" -ForegroundColor Yellow
Write-Host "1. No messages found for the session_id" -ForegroundColor Gray
Write-Host "2. Error in _extract_topics() or _extract_emotions() methods" -ForegroundColor Gray  
Write-Host "3. Error in database write operation" -ForegroundColor Gray
Write-Host "4. Missing imports or dependencies" -ForegroundColor Gray
Write-Host ""
Write-Host "Next step: We need to check the backend logs for detailed error messages" -ForegroundColor Cyan
