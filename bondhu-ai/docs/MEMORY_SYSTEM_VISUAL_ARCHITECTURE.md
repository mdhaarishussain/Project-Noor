# 🎨 Conversational Memory System - Visual Architecture

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  USER                                        │
│                           (Chat Dashboard)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Request
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Enhanced Chat Component                                            │    │
│  │  • Loads chat history from /api/v1/chat/history                    │    │
│  │  • Sends messages to /api/v1/chat/send                             │    │
│  │  • Displays conversation with personality context badge            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/v1/chat/send
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API (FastAPI)                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Chat Route Handler (/api/v1/chat/send)                             │  │
│  │                                                                       │  │
│  │  1. Memory Extraction                                                │  │
│  │     ├─ MemoryExtractor.extract_memories(message)                    │  │
│  │     └─ Store in: user_memories table                                │  │
│  │                                                                       │  │
│  │  2. Memory Retrieval                                                 │  │
│  │     ├─ MemoryRetriever.retrieve_relevant_context()                  │  │
│  │     │   ├─ Get user facts (favorite_anime, etc.)                    │  │
│  │     │   ├─ Get recent conversations (last 7 days)                   │  │
│  │     │   └─ Detect references ("remember when...")                   │  │
│  │     └─ Combine into comprehensive_context                           │  │
│  │                                                                       │  │
│  │  3. Context Enrichment                                               │  │
│  │     ├─ Personality context (Big Five scores)                        │  │
│  │     ├─ User facts context                                           │  │
│  │     ├─ Conversation history context                                 │  │
│  │     └─ Reference detection context                                  │  │
│  │                                                                       │  │
│  │  4. LLM Generation                                                   │  │
│  │     └─ Gemini.send_message(enriched_context + current_message)     │  │
│  │                                                                       │  │
│  │  5. Storage                                                          │  │
│  │     ├─ Store user message → chat_messages                           │  │
│  │     └─ Store AI response → chat_messages                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MEMORY MANAGEMENT LAYER                                 │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  MemoryExtractor     │  │  MemoryRetriever     │  │ ConversationMgr  │ │
│  │  ──────────────────  │  │  ──────────────────  │  │ ──────────────── │ │
│  │  • Regex patterns    │  │  • Combine sources   │  │ • Summarize      │ │
│  │  • Extract facts     │  │  • Smart retrieval   │  │ • Store summaries│ │
│  │  • Categorize        │  │  • Detect references │  │ • Index topics   │ │
│  │  • Set importance    │  │  • Build context     │  │ • Track emotions │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
│             │                        │                        │             │
│             │                        │                        │             │
│             ▼                        ▼                        ▼             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                         MemoryService                               │   │
│  │  • add_memory()          • get_memories()                          │   │
│  │  • add_memories_batch()  • search_memories()                       │   │
│  │  • get_important_memories() • generate_session_context()           │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Table: user_memories                                                │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  | user_id | key              | value         | importance | ... |  │  │
│  │  |---------|------------------|---------------|------------|-----|  │  │
│  │  | abc-123 | favorite_anime   | Re:Zero       | high       | ... |  │  │
│  │  | abc-123 | favorite_character| Natsuki      | high       | ... |  │  │
│  │  | abc-123 | occupation       | Engineer      | high       | ... |  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Table: conversation_memories                                        │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  | session_id | summary                    | topics    | emotions | │  │
│  │  |------------|----------------------------|-----------|----------|  │  │
│  │  | def-456    | Discussion about anime... | [anime]   | [happy]  |  │  │
│  │  | ghi-789    | Work stress conversation  | [work]    | [anxious]|  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Table: memory_index                                                 │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  | user_id | session_id | index_type | topic    | entity_name |    │  │
│  │  |---------|------------|------------|----------|-------------|    │  │
│  │  | abc-123 | def-456    | topic      | anime    | NULL        |    │  │
│  │  | abc-123 | def-456    | entity     | NULL     | Natsuki     |    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Table: chat_messages                                                │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  | id  | user_id | message_text      | sender_type | session_id |  │  │
│  │  |-----|---------|-------------------|-------------|------------|  │  │
│  │  | m1  | abc-123 | My favorite anime...| user      | def-456    |  │  │
│  │  | m2  | abc-123 | That sounds great!  | ai        | def-456    |  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Memory Flow Sequence

### Scenario: User References Past Conversation

```
┌────────┐
│ USER   │ "Remember that anime character I mentioned last time?"
└────┬───┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 1: Message Arrives at Chat API                        │
│ • user_id: abc-123                                         │
│ • message: "Remember that anime character..."              │
│ • session_id: generated or provided                        │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 2: Memory Extraction (MemoryExtractor)                │
│ • Scans message for facts: NONE found                      │
│ • (No new memories to extract from this message)           │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 3: Memory Retrieval (MemoryRetriever)                 │
│                                                             │
│ 3a. Detect Reference Phrase                                │
│     ├─ Found: "remember" ✓                                 │
│     ├─ Found: "mentioned" ✓                                │
│     └─ Found: "last time" ✓                                │
│                                                             │
│ 3b. Extract Topics from Message                            │
│     └─ Detected: "anime", "character"                      │
│                                                             │
│ 3c. Search Memory Index                                    │
│     ├─ Query: topic = "anime"                              │
│     ├─ Found: 2 sessions with anime topic                  │
│     └─ Retrieved: [def-456, ghi-789]                       │
│                                                             │
│ 3d. Get Conversation Memories                              │
│     ├─ Query: session_id IN [def-456, ghi-789]            │
│     └─ Retrieved conversation summaries                    │
│                                                             │
│ 3e. Get User Facts                                         │
│     ├─ Query: user_memories WHERE key LIKE '%anime%'       │
│     └─ Found: favorite_anime = "Re:Zero"                   │
│              favorite_character = "Natsuki Subaru"         │
│                                                             │
│ 3f. Build Comprehensive Context                            │
│     ├─ User Facts Section                                  │
│     ├─ Past Conversations Section                          │
│     └─ Reference Detection Section                         │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 4: Context Enrichment                                 │
│                                                             │
│ Combined Context:                                          │
│ ──────────────────────────────────────────────────────────│
│                                                             │
│ [PERSONALITY CONTEXT]                                       │
│ User's personality: Openness: 75, Conscientiousness: 82... │
│                                                             │
│ [USER FACTS]                                               │
│ Important things to remember:                              │
│ - Favorite Anime: Re:Zero                                  │
│ - Favorite Character: Natsuki Subaru                       │
│                                                             │
│ [PAST CONVERSATIONS]                                        │
│ 1. Conversation from October 5th at 2:30 PM:              │
│    Summary: User discussed favorite anime and characters   │
│    Topics: anime, entertainment                            │
│    Key Points:                                             │
│    • My favorite anime is Re:Zero                          │
│    • My favorite character is Natsuki Subaru              │
│                                                             │
│ [REFERENCE DETECTED]                                        │
│ User is referencing: "character I mentioned last time"     │
│ Use the conversation from October 5th to provide context   │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 5: LLM Generation (Gemini)                            │
│                                                             │
│ Input to LLM:                                              │
│ • System Prompt: [Personality + Context above]            │
│ • User Message: "Remember that anime character..."         │
│                                                             │
│ LLM Processing:                                            │
│ ├─ Reads context about Re:Zero                            │
│ ├─ Sees Natsuki Subaru mentioned in past conversation     │
│ └─ Generates response with continuity                      │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 6: Response Generated                                 │
│                                                             │
│ AI Response:                                               │
│ "Yes! You mentioned that your favorite character is        │
│  Natsuki Subaru from Re:Zero. He's known for his Return   │
│  by Death ability and determination. What would you like   │
│  to discuss about him?"                                    │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 7: Storage                                            │
│                                                             │
│ Store in chat_messages:                                    │
│ ├─ User message (sender_type: user)                        │
│ └─ AI response (sender_type: ai)                           │
│                                                             │
│ Both linked by: session_id                                 │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 8: Return Response to Frontend                        │
│                                                             │
│ JSON Response:                                             │
│ {                                                          │
│   "response": "Yes! You mentioned...",                     │
│   "has_personality_context": true,                         │
│   "timestamp": "2025-10-07T...",                           │
│   "message_id": "xyz-789"                                  │
│ }                                                          │
└────┬───────────────────────────────────────────────────────┘
     │
     ▼
┌────────┐
│ USER   │ Sees response with continuity! ✓
└────────┘
```

## 🔍 Memory Retrieval Strategy

```
┌────────────────────────────────────────────────────────────┐
│              MemoryRetriever Decision Tree                  │
└────────────────────────────────────────────────────────────┘

Does message contain reference phrase?
├─ YES: "remember", "last time", "you said", etc.
│   │
│   ├─ Extract topics from message
│   │   ├─ Search memory_index for matching topics
│   │   └─ Get conversation_memories for found sessions
│   │
│   ├─ Search user_memories for related facts
│   │
│   └─ Build REFERENCE DETECTION context
│       ├─ "User is referencing past conversation"
│       ├─ Include relevant conversation summaries
│       └─ Include related user facts
│
└─ NO: Normal message
    │
    ├─ Get recent conversations (last 7 days)
    │   └─ Limit to 3 most recent
    │
    ├─ Get important user facts
    │   └─ Prioritize high-importance memories
    │
    └─ Build GENERAL context
        ├─ User facts section
        └─ Recent conversations section

Result: Comprehensive context for LLM
```

## 📊 Data Flow Diagram

```
USER MESSAGE
     │
     ├──────────────────────────┐
     │                          │
     ▼                          ▼
[Extract Facts]          [Retrieve Context]
     │                          │
     │                          ├─ Get user_memories
     │                          ├─ Get conversation_memories
     │                          └─ Get memory_index
     │                          │
     ▼                          ▼
[user_memories]          [Build Context String]
     │                          │
     │                          ▼
     │                    [Personality Context]
     │                          +
     │                    [User Facts Context]
     │                          +
     │                    [Conversation Context]
     │                          │
     └──────────┬───────────────┘
                │
                ▼
           [LLM Prompt]
                │
                ├─ System: enriched_context
                └─ User: current_message
                │
                ▼
           [Gemini LLM]
                │
                ▼
           [AI Response]
                │
                ├─ Store user message
                ├─ Store AI response
                │
                ▼
          [chat_messages]
                │
                └─ (Background)
                   Periodic Summarization
                        │
                        ▼
                   [conversation_memories]
                        +
                   [memory_index]
```

## 🎯 Memory Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                    Memory Lifecycle                       │
└──────────────────────────────────────────────────────────┘

Phase 1: EXTRACTION (Real-time)
├─ User sends message
├─ MemoryExtractor scans for facts
├─ Facts stored in user_memories
└─ Importance level assigned

Phase 2: STORAGE (Real-time)
├─ Message stored in chat_messages
├─ Session ID links conversation
└─ Metadata captured (mood, sentiment)

Phase 3: RETRIEVAL (Real-time)
├─ Next message arrives
├─ MemoryRetriever finds relevant context
│   ├─ User facts (user_memories)
│   ├─ Past conversations (conversation_memories)
│   └─ Topic index (memory_index)
└─ Context injected into LLM prompt

Phase 4: SUMMARIZATION (Background/Periodic)
├─ Session ends or reaches N messages
├─ ConversationMemoryManager analyzes session
│   ├─ Generates conversation summary
│   ├─ Extracts topics discussed
│   ├─ Identifies emotions
│   └─ Captures key points
├─ Stored in conversation_memories
└─ Topics indexed in memory_index

Phase 5: LONG-TERM RETRIEVAL (Ongoing)
├─ User references past conversations
├─ System searches by:
│   ├─ Topic (fast lookup via memory_index)
│   ├─ Time range (recent conversations)
│   └─ Text search (full-text on summaries)
└─ Relevant memories returned
```

## 🔐 Security & Access Control

```
┌──────────────────────────────────────────────────────────┐
│              Row Level Security (RLS)                     │
└──────────────────────────────────────────────────────────┘

Every Query:
├─ Supabase intercepts query
├─ Checks auth.uid() from JWT token
├─ Applies RLS policy:
│   └─ WHERE user_id = auth.uid()
└─ Only returns user's own data

Example:
User abc-123 queries: SELECT * FROM conversation_memories

Supabase executes:
SELECT * FROM conversation_memories 
WHERE user_id = 'abc-123'  -- Enforced by RLS

User abc-123 CANNOT see user xyz-456's memories!

Tables Protected:
✓ user_memories
✓ conversation_memories
✓ memory_index
✓ chat_messages
```

## 📈 Performance Optimization

```
┌──────────────────────────────────────────────────────────┐
│                   Index Strategy                          │
└──────────────────────────────────────────────────────────┘

Fast Queries Enabled by Indexes:

1. User-based lookups
   Index: (user_id, start_time DESC)
   Query: Get recent conversations for user
   Speed: O(log n) instead of O(n)

2. Topic search
   Index: GIN(topics) - array containment
   Query: Find conversations about "work"
   Speed: Instant lookup via inverted index

3. Full-text search
   Index: GIN(to_tsvector(summary))
   Query: Search summaries by keywords
   Speed: Optimized for text search

4. Time-range queries
   Index: (user_id, start_time, end_time)
   Query: Conversations in date range
   Speed: Range scan on indexed columns

Result: Sub-100ms query times even with 1000+ conversations
```

---

**Status**: Visual documentation complete  
**Purpose**: Help developers understand the system at a glance  
**Date**: October 7, 2025
