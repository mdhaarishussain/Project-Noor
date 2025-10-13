# 🚀 Conversational Memory System - Quick Setup

## What Was Built

A comprehensive memory system that enables Bondhu AI to:
- Remember and reference past conversations
- Track topics discussed over time
- Detect when users reference previous discussions
- Provide LLM with relevant historical context
- Store conversation summaries for long-term memory

## 📁 Files Created/Modified

### New Files Created:
```
bondhu-ai/
├── core/
│   ├── memory/
│   │   ├── __init__.py                    ✅ NEW
│   │   ├── conversation_memory.py         ✅ NEW
│   │   ├── memory_index.py                ✅ NEW
│   │   └── memory_retriever.py            ✅ NEW
│   │
│   └── tasks/
│       └── memory_tasks.py                ✅ NEW
│
├── api/
│   └── routes/
│       └── memory.py                      ✅ NEW
│
└── database/
    └── conversational_memory_schema.sql   ✅ NEW

Documentation:
├── CONVERSATIONAL_MEMORY_COMPLETE_GUIDE.md  ✅ NEW
└── MEMORY_SYSTEM_QUICK_SETUP.md             ✅ NEW (this file)
```

### Files Modified:
```
bondhu-ai/
├── api/routes/chat.py                     📝 UPDATED (memory integration)
└── main.py                                 📝 UPDATED (added memory router)
```

## 🗄️ Database Changes

### New Tables:
1. **conversation_memories** - Stores conversation summaries
2. **memory_index** - Fast lookup for topics and entities
3. **user_memories** - Enhanced with importance/category fields

### Run This in Supabase SQL Editor:

```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the entire content of:
-- bondhu-ai/database/conversational_memory_schema.sql
-- Then click "Run"
```

**What it creates**:
- ✅ 3 tables (conversation_memories, memory_index, user_memories updates)
- ✅ 12+ indexes for fast queries
- ✅ RLS policies for security
- ✅ Helper functions for common operations
- ✅ Views for analytics

## 🔧 Setup Steps

### Step 1: Run Database Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy entire content from `bondhu-ai/database/conversational_memory_schema.sql`
5. Click "Run"
6. Verify success message appears

### Step 2: Verify Tables

In Table Editor, check for:
- ✅ `conversation_memories` table exists
- ✅ `memory_index` table exists  
- ✅ `user_memories` table has new columns (importance, category)

### Step 3: Restart Backend

```bash
cd bondhu-ai
python main.py
```

Look for log messages:
```
INFO - Memory management system initialized
INFO - Conversation memory manager ready
```

### Step 4: Test Basic Functionality

```bash
# Test health check
curl http://localhost:8000/api/v1/memory/health

# Should return:
# {"status": "healthy", "service": "memory", "timestamp": "..."}
```

## 🧪 Testing the Memory System

### Test 1: Extract User Facts

**Send a chat message**:
```bash
curl -X POST http://localhost:8000/api/v1/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "message": "My favorite anime is Re:Zero and my favorite character is Natsuki Subaru"
  }'
```

**Verify memory extraction**:
```bash
curl http://localhost:8000/api/v1/memory/stats/YOUR_USER_ID
```

Expected output:
```json
{
  "user_id": "YOUR_USER_ID",
  "total_user_facts": 2,  // favorite_anime, favorite_character
  "total_conversations": 0,  // None yet (needs summarization)
  "recent_conversations": 0
}
```

### Test 2: Conversation Memory

**Have a conversation** (send 3-5 messages back and forth)

**Manually trigger summarization**:
```bash
curl -X POST http://localhost:8000/api/v1/memory/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "session_id": "YOUR_SESSION_ID"
  }'
```

**View conversation memory**:
```bash
curl http://localhost:8000/api/v1/memory/conversations/YOUR_USER_ID
```

Expected output:
```json
{
  "conversations": [
    {
      "session_id": "...",
      "conversation_summary": "Discussion about favorite anime...",
      "topics": ["anime", "entertainment"],
      "emotions": [],
      "key_points": ["Favorite anime is Re:Zero", "Character: Natsuki"]
    }
  ],
  "total": 1
}
```

### Test 3: Reference Detection

**Send a message referencing past conversation**:
```bash
curl -X POST http://localhost:8000/api/v1/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "message": "Remember that anime character I mentioned before?"
  }'
```

**Expected behavior**:
- ✅ Memory retriever detects "remember" + "mentioned before"
- ✅ Searches for conversations with "anime" topic
- ✅ Retrieves conversation about Re:Zero
- ✅ Injects context into LLM prompt
- ✅ LLM responds: "Yes! You mentioned your favorite character is Natsuki Subaru from Re:Zero..."

## 📊 How It Works in Chat Flow

### Before (Without Memory System):
```
User: "My favorite anime is Re:Zero"
→ Stored in chat_messages
→ LLM generates response
→ End

[Later]
User: "Remember that anime I mentioned?"
→ LLM has no context
→ Response: "I'm not sure which anime you're referring to"
```

### After (With Memory System):
```
User: "My favorite anime is Re:Zero"
→ MemoryExtractor: extracts favorite_anime = "Re:Zero"
→ Stored in user_memories table
→ Stored in chat_messages table
→ LLM generates response

[Background task after session]
→ ConversationMemoryManager: summarizes conversation
→ Stored in conversation_memories table
→ Topics indexed in memory_index table

[Later]
User: "Remember that anime I mentioned?"
→ MemoryRetriever: detects "remember" + "mentioned"
→ Searches memory_index for topic="anime"
→ Finds conversation_memories entry
→ Retrieves user_memories: favorite_anime = "Re:Zero"
→ Injects context into LLM prompt:
   """
   CONTEXT & MEMORY:
   ============================================================
   Important things to remember:
   - Favorite Anime: Re:Zero
   
   RELEVANT PAST CONVERSATIONS:
   1. Conversation from October 7th:
      Summary: User discussed favorite anime and characters
      Topics: anime, entertainment
      Key Points:
      • My favorite anime is Re:Zero
   ============================================================
   """
→ LLM generates response: "Yes! You mentioned Re:Zero is your favorite anime..."
```

## 🎯 Key Features Enabled

### 1. **Continuity Across Sessions**
Users can reference previous conversations days/weeks later:
- "As we discussed last week..."
- "Remember when I told you about..."
- "That character I mentioned before..."

### 2. **Topic Tracking**
System tracks what topics user discusses most:
- Work stress (15 conversations)
- Relationships (8 conversations)
- Anxiety (12 conversations)

### 3. **Emotion Patterns**
Tracks emotional patterns over time:
- User often feels anxious when discussing work
- Feels hopeful when discussing goals

### 4. **Smart Context Injection**
LLM automatically gets relevant past context without:
- Loading entire chat history (expensive)
- Overwhelming LLM with too much info
- Missing important references

## 🚨 Common Issues & Solutions

### Issue: "Table conversation_memories does not exist"

**Solution**: Run the database migration
```bash
# In Supabase SQL Editor:
# Run: bondhu-ai/database/conversational_memory_schema.sql
```

### Issue: "ModuleNotFoundError: No module named 'core.memory'"

**Solution**: Restart Python server
```bash
cd bondhu-ai
python main.py
```

### Issue: Memory not being extracted

**Check**:
1. User facts in database:
   ```sql
   SELECT * FROM user_memories WHERE user_id = 'your-user-id';
   ```
2. Chat logs for memory extraction:
   ```
   INFO - Successfully saved memory 'favorite_anime' for user...
   ```

### Issue: LLM not referencing past conversations

**Check**:
1. Conversation memories exist:
   ```bash
   curl http://localhost:8000/api/v1/memory/conversations/YOUR_USER_ID
   ```
2. Reference detection working (check logs):
   ```
   INFO - Detected reference phrase in user's message
   INFO - Added conversational memory context
   ```

## 📈 Next Steps

1. **Test with Real Users**: Have users chat and try referencing past conversations
2. **Monitor Performance**: Check API response times with memory context
3. **Tune Parameters**: Adjust `max_memories` in retrieval (currently 3)
4. **Add Auto-Summarization**: Trigger summarization every N messages
5. **Implement Vector Search**: Add pgvector for semantic memory search

## 🎓 Learning Resources

**Read the Full Guide**: `CONVERSATIONAL_MEMORY_COMPLETE_GUIDE.md`
- Complete architecture documentation
- All API endpoints explained
- Detailed testing guide
- Troubleshooting section

**Explore the Code**:
```
core/memory/conversation_memory.py  # Conversation summarization
core/memory/memory_retriever.py     # Smart context retrieval
api/routes/memory.py                # Memory API endpoints
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Database tables created (conversation_memories, memory_index)
- [ ] Backend starts without errors
- [ ] `/api/v1/memory/health` returns healthy
- [ ] Can send chat messages successfully  
- [ ] User facts extracted and stored
- [ ] Can manually trigger summarization
- [ ] Conversation memories appear in database
- [ ] Reference detection works ("remember...")
- [ ] LLM references past conversations in responses

## 🎉 Success!

If all checks pass, your conversational memory system is live!

Users can now:
✅ Reference past conversations naturally  
✅ Build long-term relationships with AI  
✅ Experience continuity across sessions  
✅ Get context-aware responses  

---

**Questions or Issues?**
- Check `CONVERSATIONAL_MEMORY_COMPLETE_GUIDE.md` for detailed docs
- Review error logs in terminal
- Verify database schema in Supabase
- Test each component individually

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Date**: October 7, 2025
