# Automatic Conversation Memory System - Complete Guide

## 🎯 Overview

The conversation memory system now works **automatically** with three trigger mechanisms:

1. **Auto-summarization every 10 messages** (5 user + 5 AI responses)
2. **Manual session end** via `/api/v1/chat/session/end` endpoint
3. **Manual trigger** via `/api/v1/memory/summarize` endpoint

---

## ⚠️ CRITICAL: Session ID Requirements

### The Problem
The `session_id` column in Supabase is **UUID type**, which means:
- ❌ Strings like `"my-session"` will fail
- ✅ UUIDs like `"028ce121-e17d-44e6-94fa-5ab5539ef451"` will work

### The Solution

**Backend automatically generates UUID if none provided:**
```python
# In chat.py - this happens automatically
session_id = request.session_id or str(uuid.uuid4())
```

**Frontend should either:**

**Option 1: Let backend generate it (easiest)**
```typescript
// Don't send session_id - let backend create it
const response = await fetch('/api/v1/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    user_id: userId,
    message: userMessage
    // No session_id - backend will auto-generate UUID
  })
});
```

**Option 2: Generate UUID on frontend**
```typescript
import { v4 as uuidv4 } from 'uuid';

// Generate once when chat opens
const [sessionId] = useState(() => uuidv4());

// Use in all requests during this chat session
const response = await fetch('/api/v1/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    user_id: userId,
    message: userMessage,
    session_id: sessionId  // Reuse same UUID for entire session
  })
});
```

**PowerShell Testing:**
```powershell
# Generate UUID
$sessionId = [guid]::NewGuid().ToString()

# Use in requests
$body = @{
    user_id = "your-user-id"
    message = "Your message"
    session_id = $sessionId
} | ConvertTo-Json
```

---

## 🤖 How Automatic Summarization Works

### Trigger #1: Every 10 Messages
When a conversation reaches 10 messages (5 exchanges), it automatically:
1. ✅ Extracts topics from user messages
2. ✅ Identifies emotions from messages
3. ✅ Generates conversation summary
4. ✅ Stores in `conversation_memories` table
5. ✅ Indexes topics in `memory_index` table

**Example:**
```
Message 1: "I love anime"
Message 2: AI response
Message 3: "Attack on Titan is amazing"
Message 4: AI response
Message 5: "Eren is complex"
Message 6: AI response
Message 7: "The plot twists are insane"
Message 8: AI response
Message 9: "Character development is incredible"
Message 10: AI response  ← AUTO-SUMMARIZATION TRIGGERS HERE
```

### Trigger #2: Session End (Recommended)
When user closes chat or navigates away:
```typescript
// Frontend: Call when chat closes
async function handleChatClose() {
  await fetch('/api/v1/chat/session/end', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId
    })
  });
}
```

**PowerShell:**
```powershell
$body = @{
    user_id = "your-user-id"
    session_id = "your-session-uuid"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/session/end" `
    -Method POST -Body $body -ContentType "application/json"
```

### Trigger #3: Manual Summarization
For testing or immediate summarization:
```powershell
$body = @{
    user_id = "your-user-id"
    session_id = "your-session-uuid"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/summarize" `
    -Method POST -Body $body -ContentType "application/json"
```

---

## 🧪 Testing the Automatic System

### Test Script 1: Auto-Summarization After 10 Messages

```powershell
# Generate session ID
$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = [guid]::NewGuid().ToString()

Write-Host "Starting test session: $sessionId" -ForegroundColor Cyan
Write-Host ""

# Function to send message
function Send-TestMessage {
    param($message, $count)
    
    $body = @{
        user_id = $userId
        message = $message
        session_id = $sessionId
    } | ConvertTo-Json
    
    Write-Host "$count. Sending: $message" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" `
        -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "   AI: $($response.response.Substring(0, 60))..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

# Send 5 user messages (= 10 total with AI responses)
Send-TestMessage "I love watching anime" 1
Send-TestMessage "My favorite is Attack on Titan" 2
Send-TestMessage "The character development is amazing" 3
Send-TestMessage "Eren is such a complex character" 4
Send-TestMessage "The plot twists are incredible" 5

Write-Host ""
Write-Host "✓ Sent 5 messages (10 total with AI responses)" -ForegroundColor Green
Write-Host "  Auto-summarization should have triggered!" -ForegroundColor Cyan
Write-Host ""

# Wait a moment for background task
Start-Sleep -Seconds 2

# Check if conversation was summarized
Write-Host "Checking memory stats..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"
Write-Host "Total conversations: $($stats.total_conversations)" -ForegroundColor Green
Write-Host "Top topics: $($stats.top_topics -join ', ')" -ForegroundColor Green
```

### Test Script 2: Session End Trigger

```powershell
$userId = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
$sessionId = [guid]::NewGuid().ToString()

# Send 2 messages (not enough for auto-trigger)
$body = @{ user_id = $userId; message = "I'm learning Python"; session_id = $sessionId } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json"

Start-Sleep -Seconds 1

$body = @{ user_id = $userId; message = "It's really interesting"; session_id = $sessionId } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json"

Write-Host "Sent 2 messages - not enough for auto-trigger" -ForegroundColor Yellow
Write-Host "Manually ending session..." -ForegroundColor Cyan

# End session (triggers immediate summarization)
$endBody = @{ user_id = $userId; session_id = $sessionId } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/session/end" -Method POST -Body $endBody -ContentType "application/json"

Write-Host "✓ $($result.message)" -ForegroundColor Green
```

### Test Script 3: Memory Reference

```powershell
# After summarization, test if AI remembers
$newSessionId = [guid]::NewGuid().ToString()
$body = @{
    user_id = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
    message = "What anime did we discuss earlier?"
    session_id = $newSessionId
} | ConvertTo-Json

Write-Host "Testing memory reference..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/send" -Method POST -Body $body -ContentType "application/json"

Write-Host ""
Write-Host "=== AI Response (should mention Attack on Titan) ===" -ForegroundColor Yellow
Write-Host $response.response
```

---

## 📊 Monitoring and Verification

### Check Memory Stats
```powershell
$userId = "your-user-id"
$stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/stats/$userId"

Write-Host "Total Conversations: $($stats.total_conversations)"
Write-Host "Total Facts: $($stats.total_user_facts)"
Write-Host "Top Topics: $($stats.top_topics)"
```

### View Stored Conversations
```powershell
$conversations = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/memory/conversations/$userId"

$conversations.conversations | ForEach-Object {
    Write-Host "`nSession: $($_.session_id)"
    Write-Host "Summary: $($_.conversation_summary)"
    Write-Host "Topics: $($_.topics -join ', ')"
    Write-Host "Time: $($_.start_time)"
}
```

### Check Supabase Directly
1. Open Supabase Dashboard → Table Editor
2. View `conversation_memories` table
3. You should see rows with:
   - `session_id` (UUID)
   - `conversation_summary` (text)
   - `topics` (array)
   - `emotions` (array)
   - `key_points` (array)

---

## 🔧 Frontend Integration Recommendations

### React/Next.js Example

```typescript
'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function Chat() {
  const [sessionId] = useState(() => uuidv4());
  const userId = "user-id-from-auth";

  // Send message
  async function sendMessage(message: string) {
    const response = await fetch('/api/v1/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        message: message,
        session_id: sessionId  // Same UUID for entire session
      })
    });
    
    return response.json();
  }

  // End session when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup: End session when chat closes
      fetch('/api/v1/chat/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId
        })
      });
    };
  }, [userId, sessionId]);

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

---

## ✅ Verification Checklist

After implementing:

- [ ] Backend generates UUID session_id if none provided
- [ ] Frontend either generates UUID or lets backend handle it
- [ ] Conversations auto-summarize after 10 messages
- [ ] Session end endpoint triggers summarization
- [ ] `conversation_memories` table populates in Supabase
- [ ] `memory_index` table populates with topics
- [ ] Memory stats endpoint returns correct counts
- [ ] AI can reference past conversations when asked
- [ ] Memory retrieval works with "remember when" phrases

---

## 🐛 Troubleshooting

### Issue: "invalid input syntax for type uuid"
**Cause:** Sending non-UUID string as session_id  
**Fix:** Use `[guid]::NewGuid().ToString()` or let backend auto-generate

### Issue: No auto-summarization happening
**Check:**
1. Are you sending 10+ messages in same session?
2. Is same `session_id` being used for all messages?
3. Check backend logs for errors
4. Verify `chat_messages` table has messages with correct `session_id`

### Issue: AI doesn't remember past conversations
**Check:**
1. Is conversation summarized? Check `conversation_memories` table
2. Are topics indexed? Check `memory_index` table
3. Use reference phrases: "remember when", "last time", "we discussed"
4. Check memory stats to verify data exists

---

## 📝 Summary

**Automatic Features:**
✅ UUID session generation (if not provided)  
✅ Auto-summarization every 10 messages  
✅ Background task execution (non-blocking)  
✅ Memory indexing for fast retrieval  
✅ Context injection into LLM prompts  

**Manual Triggers:**
✅ Session end endpoint for immediate summarization  
✅ Manual summarize endpoint for testing  

**Result:**
The LLM can now naturally reference past conversations without any manual intervention! 🚀
