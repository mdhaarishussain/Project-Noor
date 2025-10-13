# 🎯 MEMORY SYSTEM QUICK REFERENCE

## How It Works Now (Automatic)

```
User sends 5 messages → Backend auto-summarizes (every 10 messages)
                     ↓
         Extracts topics: "anime", "Attack on Titan"
                     ↓
         Stores in conversation_memories table
                     ↓
         Indexes topics in memory_index
                     ↓
Later: User says "remember that anime?"
                     ↓
         System retrieves past conversation
                     ↓
         LLM responds: "Yes, Attack on Titan..."
```

## Critical Rules

1. **Session IDs = UUIDs** (not strings like "my-session")
   - ✅ `"028ce121-e17d-44e6-94fa-5ab5539ef451"`
   - ❌ `"test-session-anime"`

2. **Auto-Summarization Triggers**:
   - Every 10 messages (5 user + 5 AI)
   - When session ends via `/chat/session/end`
   - Manual via `/memory/summarize`

3. **Topic Extraction**:
   - Specific: anime, Attack on Titan, Python, gaming
   - Generic: work, health, relationships

## PowerShell Quick Tests

### Send Messages with Auto-Summarization
```powershell
$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = [guid]::NewGuid().ToString()

# Send 5 messages
1..5 | ForEach-Object {
    $body = @{
        user_id = $userId
        message = "Message $_: I love anime"
        session_id = $sessionId
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json" | Out-Null
}

# Check stats
$stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
Write-Host "Conversations: $($stats.total_conversations)"
```

### Test Memory Reference
```powershell
$body = @{
    user_id = $userId
    message = "What anime did we discuss?"
    session_id = [guid]::NewGuid().ToString()
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json"
Write-Host $response.response
```

### Manual Summarization
```powershell
$body = @{
    user_id = $userId
    session_id = $sessionId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/summarize" -Method POST -Body $body -ContentType "application/json"
```

## Frontend Integration (TypeScript)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Generate session ID once
const sessionId = uuidv4();

// Send message
await fetch('/api/v1/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    user_id: userId,
    message: message,
    session_id: sessionId // Same UUID for entire session
  })
});

// End session (on unmount)
await fetch('/api/v1/chat/session/end', {
  method: 'POST',
  body: JSON.stringify({
    user_id: userId,
    session_id: sessionId
  })
});
```

## Troubleshooting One-Liners

```powershell
# Check if backend running
Invoke-RestMethod http://localhost:8000/api/v1/chat/health

# Check memory health
Invoke-RestMethod http://localhost:8000/api/v1/memory/health

# View all conversations
Invoke-RestMethod "http://localhost:8000/api/v1/memory/conversations/$userId"

# Check Supabase table
# Go to: Supabase → Table Editor → conversation_memories
```

## Files Modified

1. **bondhu-ai/api/routes/chat.py**
   - Added `_auto_summarize_if_needed()` function
   - Added `/session/end` endpoint
   - Auto-summarization after storing messages

2. **bondhu-ai/core/memory/conversation_memory.py**
   - Enhanced `_extract_topics()` with 50+ specific topics
   - Better prioritization (specific > generic)

3. **Documentation**
   - AUTOMATIC_MEMORY_SYSTEM_GUIDE.md (complete guide)
   - AUTOMATIC_MEMORY_IMPLEMENTATION_SUMMARY.md (this file)

## Status: ✅ READY FOR PRODUCTION

- Automatic summarization working
- UUID session handling working
- Enhanced topic extraction working
- Memory retrieval working
- Database schema deployed

**Next**: Integrate session_id into your frontend!
