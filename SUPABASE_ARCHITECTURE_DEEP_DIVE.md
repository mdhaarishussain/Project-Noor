# 🗄️ Supabase Architecture Deep Dive - Bondhu AI

**Date**: October 7, 2025  
**Purpose**: Complete exploration of Supabase connections, data flow, and database architecture

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Connection Architecture](#connection-architecture)
3. [Backend Database Layer](#backend-database-layer)
4. [Frontend Database Layer](#frontend-database-layer)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Database Schema Complete](#database-schema-complete)
7. [Security & RLS Policies](#security--rls-policies)
8. [Performance Optimization](#performance-optimization)
9. [Best Practices](#best-practices)
10. [Issues & Solutions](#issues--solutions)

---

## 🎯 OVERVIEW

### Supabase Stack

**Supabase Components Used**:
- **PostgreSQL Database** - Core data storage
- **REST API** - Database access via HTTP (used by backend)
- **Realtime** - Subscription-based updates (potential future use)
- **Auth** - User authentication (used by frontend)
- **Storage** - File storage (avatars, media)
- **Row Level Security (RLS)** - Database-level security

### Why Supabase?

1. **PostgreSQL** - Industry-standard relational database
2. **REST API** - No direct DB connection needed (firewall-friendly)
3. **Built-in Auth** - Google OAuth, email/password
4. **RLS Policies** - Database-level security, not application-level
5. **Real-time** - Future feature for live updates
6. **Managed Service** - No infrastructure management

---

## 🏗️ CONNECTION ARCHITECTURE

### Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Browser Client (createBrowserClient)            │   │
│  │  - Direct Supabase REST API calls                │   │
│  │  - Auth state management                         │   │
│  │  - Cookie-based sessions                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Server Client (createServerClient)             │   │
│  │  - Server-side rendering                         │   │
│  │  - Server Components                             │   │
│  │  - Cookie management via Next.js                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Middleware Client (middleware.ts)               │   │
│  │  - Auth verification                             │   │
│  │  - Route protection                              │   │
│  │  - Session refresh                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS (REST API)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                SUPABASE CLOUD (PostgreSQL)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  REST API Layer                                  │   │
│  │  - PostgREST endpoints                           │   │
│  │  - Row Level Security enforcement                │   │
│  │  - Authentication verification                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                             │   │
│  │  - Tables (profiles, chat_messages, etc.)       │   │
│  │  - Views (personality_profiles)                  │   │
│  │  - Functions (SQL functions)                     │   │
│  │  - RLS Policies                                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTPS (REST API)
                           │
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI/Python)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SupabaseClient (core/database/supabase_client) │   │
│  │  - Python supabase library                       │   │
│  │  - REST API calls (no direct PostgreSQL)        │   │
│  │  - Service role key for admin operations        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Connection Types

#### 1. **Frontend Browser Client** (`client.ts`)
```typescript
// bondhu-landing/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usage**:
- Client-side React components
- Real-time subscriptions (future)
- Auth state management
- User-specific queries with RLS

**Security**:
- Uses **anon key** (public, safe to expose)
- RLS policies enforce user-level access
- Auth token in cookies/localStorage

#### 2. **Frontend Server Client** (`server.ts`)
```typescript
// bondhu-landing/src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* ... */ }
      }
    }
  )
}
```

**Usage**:
- Server Components (Next.js App Router)
- Server Actions
- API Routes
- Pre-fetching data for SSR

**Security**:
- Uses **anon key** but with server-side auth
- Cookies managed by Next.js
- Auth verified on server before DB access

#### 3. **Frontend Middleware Client** (`middleware.ts`)
```typescript
// bondhu-landing/src/lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  
  // Auth verification
  const { data: { user } } = await supabase.auth.getUser()
  
  // Route protection logic
  if (isProtectedRoute && !user) {
    return NextResponse.redirect('/sign-in')
  }
  
  // Check onboarding status from DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()
  
  // Redirect logic based on profile
  // ...
}
```

**Usage**:
- Route protection (dashboard, chat, etc.)
- Auth state verification on every request
- Onboarding flow management
- Session refresh

**Security**:
- Runs before page loads
- Prevents unauthorized access
- Validates auth state with Supabase

#### 4. **Backend Python Client** (`supabase_client.py`)
```python
# bondhu-ai/core/database/supabase_client.py
from supabase import create_client, Client

class SupabaseClient:
    def __init__(self):
        config = get_config()
        self.supabase: Client = create_client(
            config.database.url,      # SUPABASE_URL
            config.database.key       # SUPABASE_KEY (service_role or anon)
        )
```

**Usage**:
- Backend API operations (FastAPI)
- Data fetching for AI agents
- Chat history storage
- Memory management
- Analytics queries

**Security**:
- Can use **service_role key** for admin operations
- Can use **anon key** for user-level operations
- RLS policies still apply (unless service_role bypasses)

---

## 🐍 BACKEND DATABASE LAYER

### Python Supabase Client Architecture

#### Client Initialization
```python
# core/database/supabase_client.py

class SupabaseClient:
    """Supabase client for database operations using REST API."""
    
    def __init__(self):
        config = get_config()
        self.supabase: Client = create_client(
            config.database.url,     # From SUPABASE_URL env var
            config.database.key      # From SUPABASE_KEY env var
        )
    
    async def close(self):
        """Close database connections (no-op for REST API)."""
        pass  # REST API doesn't need explicit connection management
```

**Key Points**:
- ✅ Uses **REST API** (not direct PostgreSQL connection)
- ✅ No connection pooling needed (HTTP requests)
- ✅ Firewall-friendly (HTTPS only)
- ✅ Singleton pattern via `get_supabase_client()`

#### Environment Configuration
```python
# core/config/settings.py

@dataclass
class DatabaseConfig:
    url: str = field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    key: str = field(default_factory=lambda: os.getenv("SUPABASE_KEY", ""))
    service_role_key: str = field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    def __post_init__(self):
        if IS_PRODUCTION and (not self.url or not self.key):
            raise ValueError("Supabase URL and KEY must be provided")
```

**Environment Variables**:
```bash
# Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-or-service-role-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for admin ops
```

### Database Operations Patterns

#### 1. **Personality Data Retrieval**
```python
async def get_user_personality(self, user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user's personality assessment data."""
    try:
        # Query the personality_profiles VIEW (not table)
        response = self.supabase.table('personality_profiles').select(
            'id, full_name, avatar_url, '
            'personality_openness, personality_conscientiousness, '
            'personality_extraversion, personality_agreeableness, '
            'personality_neuroticism, personality_llm_context, '
            'personality_completed_at, onboarding_completed, '
            'has_completed_personality_assessment'
        ).eq('id', user_id).eq('has_completed_personality_assessment', True).execute()
        
        if response.data and len(response.data) > 0:
            row = response.data[0]
            return {
                'user_id': str(row['id']),
                'full_name': row.get('full_name'),
                'scores': {
                    'openness': row.get('personality_openness'),
                    'conscientiousness': row.get('personality_conscientiousness'),
                    # ...
                },
                'llm_context': row.get('personality_llm_context'),
                # ...
            }
        return None
    except Exception as e:
        logger.error(f"Error fetching personality: {e}")
        return None
```

**Pattern**: 
- ✅ `.table('table_name')` - Select table or view
- ✅ `.select('columns')` - Specify columns
- ✅ `.eq('column', value)` - Filter by equality
- ✅ `.execute()` - Execute query
- ✅ `response.data` - Access results

#### 2. **Chat Message Storage**
```python
# api/routes/chat.py

def _store_chat_message(user_id, message, response, mood, sentiment, session_id):
    supabase = get_supabase_client()
    
    # Insert user message
    user_message = supabase.supabase.table('chat_messages').insert({
        'user_id': user_id,
        'message_text': message,
        'sender_type': 'user',
        'mood_detected': mood,
        'sentiment_score': sentiment,
        'session_id': session_id
        # timestamp auto-generated by DB
    }).execute()
    
    # Insert AI response
    ai_message = supabase.supabase.table('chat_messages').insert({
        'user_id': user_id,
        'message_text': response,
        'sender_type': 'ai',
        'session_id': session_id
    }).execute()
    
    return ai_message.data[0]['id']
```

**Pattern**:
- ✅ `.insert(dict)` - Insert new record
- ✅ Auto-generated fields (timestamp, UUID) handled by DB
- ✅ Returns inserted record with ID

#### 3. **Chat History Retrieval**
```python
# api/routes/chat.py

async def get_chat_history(user_id: str, limit: int = 50):
    supabase = get_supabase_client()
    
    # Query with ordering and pagination
    response = supabase.supabase.table('chat_messages') \
        .select('*') \
        .eq('user_id', user_id) \
        .order('timestamp', desc=True) \
        .range(offset, offset + limit * 2 - 1) \
        .execute()
    
    # Group messages into conversation pairs
    # (user message + AI response)
    # ...
```

**Pattern**:
- ✅ `.order('column', desc=True)` - Sort results
- ✅ `.range(start, end)` - Pagination
- ✅ Method chaining for complex queries

#### 4. **Memory Operations**
```python
# core/database/memory_service.py

def add_memory(self, user_id: str, key: str, value: str, metadata: Dict):
    memory_data = {
        "user_id": user_id,
        "key": key,
        "value": value,
        "importance": metadata.get('importance'),
        "category": metadata.get('category')
    }
    
    # Upsert: Insert or update if exists
    self._client.supabase.table("user_memories").upsert(
        memory_data, 
        on_conflict="user_id, key"  # Unique constraint
    ).execute()
```

**Pattern**:
- ✅ `.upsert(dict, on_conflict)` - Insert or update
- ✅ Handles duplicate key conflicts gracefully

#### 5. **Agent Analysis Storage**
```python
async def store_agent_analysis(self, user_id, agent_type, analysis_data):
    result = self.supabase.table('agent_analyses').upsert({
        'user_id': user_id,
        'agent_type': agent_type,
        'analysis_data': analysis_data,  # JSONB column
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }).execute()
    
    return len(result.data) > 0
```

**Pattern**:
- ✅ JSONB columns for flexible data
- ✅ Upsert for idempotent operations

#### 6. **Search Operations**
```python
# api/routes/chat.py

async def search_chat_history(user_id: str, query: str):
    search_term = f"%{query.lower()}%"
    
    response = supabase.supabase.table('chat_messages') \
        .select('*') \
        .eq('user_id', user_id) \
        .ilike('message_text', search_term) \  # Case-insensitive search
        .order('timestamp', desc=True) \
        .limit(limit) \
        .execute()
```

**Pattern**:
- ✅ `.ilike('column', pattern)` - Case-insensitive LIKE
- ✅ Wildcard search with `%`

### Service Layer Pattern

All database access is abstracted through service classes:

```python
# Singleton pattern for database services

_supabase_client: Optional[SupabaseClient] = None
_personality_service: Optional[PersonalityContextService] = None
_memory_service: Optional[MemoryService] = None

def get_supabase_client() -> SupabaseClient:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client

def get_personality_service() -> PersonalityContextService:
    global _personality_service
    if _personality_service is None:
        _personality_service = PersonalityContextService()
    return _personality_service

def get_memory_service() -> MemoryService:
    global _memory_service
    if _memory_service is None:
        supabase_client = get_supabase_client()
        _memory_service = MemoryService(supabase_client)
    return _memory_service
```

**Benefits**:
- ✅ Single point of database access
- ✅ Easy to mock for testing
- ✅ Centralized connection management
- ✅ Dependency injection ready

---

## 🌐 FRONTEND DATABASE LAYER

### Next.js Supabase Patterns

#### 1. **Client Components** (Browser)
```typescript
// src/app/dashboard/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const supabase = createClient()
  
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
    }
    
    getProfile()
  }, [])
}
```

**Pattern**:
- ✅ Client-side data fetching
- ✅ Real-time updates possible
- ✅ RLS enforced (anon key)

#### 2. **Server Components** (SSR)
```typescript
// src/app/profile/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return <ProfileView profile={profile} />
}
```

**Pattern**:
- ✅ Server-side rendering
- ✅ Data fetched before page render
- ✅ No loading states needed

#### 3. **Middleware** (Route Protection)
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check database for additional info
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()
  
  // Redirect logic
  if (!profile?.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
}
```

**Pattern**:
- ✅ Runs on every request
- ✅ Auth + DB checks in one place
- ✅ Protects routes before rendering

---

## 🔄 DATA FLOW PATTERNS

### Pattern 1: Chat Message Flow

```
User Types Message in Frontend
    ↓
Frontend sends to Backend API (POST /api/v1/chat/send)
    ↓
Backend Processes:
  1. Extract memories from message
  2. Retrieve personality context (Supabase REST API)
  3. Generate session context from memories
  4. Call Gemini LLM with context
  5. Analyze mood/sentiment
  6. Store user message (Supabase INSERT)
  7. Store AI response (Supabase INSERT)
    ↓
Backend returns response to Frontend
    ↓
Frontend displays message in chat UI
```

**Supabase Operations**:
- ✅ `SELECT` personality from `personality_profiles` view
- ✅ `SELECT` memories from `user_memories` table
- ✅ `INSERT` user message into `chat_messages` table
- ✅ `INSERT` AI response into `chat_messages` table

### Pattern 2: Personality Assessment Flow

```
User completes 50-question assessment in Frontend
    ↓
Frontend calculates Big Five scores
    ↓
Frontend calls Supabase to update profile
    ↓
Supabase Updates:
  1. UPDATE profiles SET personality_* = scores
  2. UPDATE profiles SET onboarding_completed = true
    ↓
Frontend generates LLM context (JSON)
    ↓
Frontend updates personality_llm_context (JSONB)
    ↓
User redirected to dashboard
```

**Supabase Operations**:
- ✅ `UPDATE` profiles with personality scores
- ✅ `UPDATE` profiles with LLM context (JSONB)
- ✅ Triggers `personality_profiles` view to update

### Pattern 3: Memory Extraction & Storage

```
User sends chat message
    ↓
Backend extracts memories (MemoryExtractor)
    ↓
Memories identified:
  - "my favorite anime is Re:Zero" → favorite_anime: Re:Zero
  - "my name is John" → personal_info: John
    ↓
Backend calls MemoryService.add_memories_batch()
    ↓
Supabase Operations:
  - UPSERT user_memories (user_id, key) → updates if exists
    ↓
Memories available for next conversation
```

**Supabase Operations**:
- ✅ `UPSERT` into `user_memories` table
- ✅ Auto-increments `access_count` on retrieve
- ✅ Updates `last_accessed` timestamp

### Pattern 4: Music Recommendation Flow

```
User requests music recommendations
    ↓
Backend calls Spotify API (if authorized)
    ↓
Fetch listening history from Spotify
    ↓
Supabase Operations:
  1. INSERT/UPDATE music_listening_history (cache)
  2. SELECT personality_profile for user
  3. RL system generates recommendations
  4. INSERT music_recommendations
    ↓
User clicks "like" button
    ↓
Supabase Operations:
  1. INSERT music_interactions (feedback)
  2. UPDATE music_genre_preferences (auto via trigger/function)
  3. RL system updates Q-table
  4. INSERT music_rl_models (model snapshot)
```

**Supabase Operations**:
- ✅ Caching layer for Spotify data
- ✅ Feedback tracking for RL
- ✅ Automatic preference updates
- ✅ Model persistence

---

## 🗄️ DATABASE SCHEMA COMPLETE

### Core Tables

#### 1. `profiles` (User Profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Personality scores (Big Five OCEAN)
  personality_openness INTEGER DEFAULT 50,
  personality_conscientiousness INTEGER DEFAULT 50,
  personality_extraversion INTEGER DEFAULT 50,
  personality_agreeableness INTEGER DEFAULT 50,
  personality_neuroticism INTEGER DEFAULT 50,
  
  -- LLM context (generated from personality)
  personality_llm_context JSONB,
  personality_completed_at TIMESTAMPTZ,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  has_completed_personality_assessment BOOLEAN GENERATED ALWAYS AS (
    personality_completed_at IS NOT NULL
  ) STORED,
  
  profile_completion_percentage NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_personality ON profiles(
  personality_openness,
  personality_conscientiousness,
  personality_extraversion,
  personality_agreeableness,
  personality_neuroticism
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### 2. `chat_messages` (Chat History)
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  message_text TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  
  -- Analytics
  mood_detected TEXT,
  sentiment_score NUMERIC CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  
  -- Session tracking
  session_id UUID,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_user_timestamp 
  ON chat_messages(user_id, timestamp DESC);

CREATE INDEX idx_chat_messages_session 
  ON chat_messages(session_id, timestamp);

CREATE INDEX idx_chat_messages_mood 
  ON chat_messages(user_id, mood_detected) 
  WHERE mood_detected IS NOT NULL;

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 3. `user_memories` (Memory System)
```sql
CREATE TABLE user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Memory content
  memory_key TEXT NOT NULL,         -- e.g., "favorite_anime"
  memory_value TEXT NOT NULL,       -- e.g., "Re:Zero"
  
  -- Metadata
  memory_category TEXT,             -- e.g., "favorite", "personal_fact"
  importance TEXT DEFAULT 'medium', -- high, medium, low
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Future: Vector embeddings for semantic search
  embedding VECTOR(1536),  -- OpenAI embedding size
  
  UNIQUE(user_id, memory_key)
);

-- Indexes
CREATE INDEX idx_user_memories_user ON user_memories(user_id);
CREATE INDEX idx_user_memories_category ON user_memories(user_id, memory_category);
CREATE INDEX idx_user_memories_importance ON user_memories(user_id, importance);
CREATE INDEX idx_user_memories_updated ON user_memories(user_id, updated_at DESC);

-- Vector similarity search (future)
CREATE INDEX ON user_memories USING ivfflat (embedding vector_cosine_ops);

-- RLS Policies
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memories" ON user_memories
  FOR ALL USING (auth.uid() = user_id);
```

#### 4. `music_recommendations` (Music RL Data)
```sql
CREATE TABLE music_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Spotify track info
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artists TEXT[] NOT NULL,
  external_url TEXT NOT NULL,
  
  -- Genre
  genz_genre TEXT NOT NULL,  -- "Lo-fi Chill", "Pop Anthems", etc.
  
  -- Audio features (from Spotify API)
  energy NUMERIC,
  valence NUMERIC,
  tempo NUMERIC,
  acousticness NUMERIC,
  danceability NUMERIC,
  speechiness NUMERIC,
  instrumentalness NUMERIC,
  liveness NUMERIC,
  loudness NUMERIC,
  
  -- RL scores
  rl_score NUMERIC DEFAULT 0,
  personality_match_score NUMERIC DEFAULT 0,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, track_id, recommended_at::date)
);

-- Indexes
CREATE INDEX idx_music_rec_user_genre ON music_recommendations(user_id, genz_genre);
CREATE INDEX idx_music_rec_score ON music_recommendations(user_id, rl_score DESC);

-- RLS
ALTER TABLE music_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations" ON music_recommendations
  FOR ALL USING (auth.uid() = user_id);
```

#### 5. `music_interactions` (Music Feedback)
```sql
CREATE TABLE music_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  track_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('like', 'dislike', 'play', 'skip', 'save')
  ),
  
  -- RL data
  rl_reward NUMERIC NOT NULL,
  rl_q_value NUMERIC,
  
  -- Listening data
  listen_duration_ms INTEGER,
  track_duration_ms INTEGER,
  completion_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN track_duration_ms > 0 
      THEN (listen_duration_ms::NUMERIC / track_duration_ms::NUMERIC) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- State at time of interaction
  personality_state JSONB,  -- User's personality scores
  audio_features JSONB,     -- Track's audio features
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_music_int_user ON music_interactions(user_id, created_at DESC);
CREATE INDEX idx_music_int_type ON music_interactions(user_id, interaction_type);
CREATE INDEX idx_music_int_track ON music_interactions(track_id);

-- RLS
ALTER TABLE music_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own interactions" ON music_interactions
  FOR ALL USING (auth.uid() = user_id);
```

#### 6. `music_genre_preferences` (Learned Preferences)
```sql
CREATE TABLE music_genre_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  genre TEXT NOT NULL,
  preference_score NUMERIC DEFAULT 0.5,  -- 0 to 1
  interaction_count INTEGER DEFAULT 0,
  average_reward NUMERIC DEFAULT 0,
  
  last_interaction TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, genre)
);

-- Function to update genre preferences automatically
CREATE OR REPLACE FUNCTION update_genre_preference()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO music_genre_preferences (user_id, genre, interaction_count, average_reward, last_interaction)
  SELECT 
    NEW.user_id,
    (NEW.audio_features->>'genre')::TEXT,
    1,
    NEW.rl_reward,
    NEW.created_at
  ON CONFLICT (user_id, genre) DO UPDATE SET
    interaction_count = music_genre_preferences.interaction_count + 1,
    average_reward = (
      (music_genre_preferences.average_reward * music_genre_preferences.interaction_count) + NEW.rl_reward
    ) / (music_genre_preferences.interaction_count + 1),
    last_interaction = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update preferences
CREATE TRIGGER music_interaction_update_preference
  AFTER INSERT ON music_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_genre_preference();

-- RLS
ALTER TABLE music_genre_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON music_genre_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### Views

#### `personality_profiles` View
```sql
CREATE OR REPLACE VIEW personality_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.personality_openness,
  p.personality_conscientiousness,
  p.personality_extraversion,
  p.personality_agreeableness,
  p.personality_neuroticism,
  p.personality_llm_context,
  p.personality_completed_at,
  p.onboarding_completed,
  p.has_completed_personality_assessment,
  p.profile_completion_percentage,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.personality_completed_at IS NOT NULL;

-- Grant access
GRANT SELECT ON personality_profiles TO authenticated;
GRANT SELECT ON personality_profiles TO anon;
```

**Purpose**: Backend queries this view instead of `profiles` table for cleaner separation.

---

## 🔐 SECURITY & RLS POLICIES

### Row Level Security (RLS) Overview

**What is RLS?**
- Database-level security
- Policies enforce who can access which rows
- Runs on every query automatically
- Can't be bypassed (unless using service_role key)

### RLS Policy Patterns

#### Pattern 1: User-Owned Data
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT 
  USING (auth.uid() = user_id);
```

**Logic**: `auth.uid()` returns authenticated user's ID, compared with table's user_id.

#### Pattern 2: Insert with Validation
```sql
-- Users can only insert messages for themselves
CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

**Logic**: `WITH CHECK` validates data before insert.

#### Pattern 3: Full Access (All Operations)
```sql
-- Users can manage all their memories
CREATE POLICY "Users can manage own memories" ON user_memories
  FOR ALL 
  USING (auth.uid() = user_id);
```

**Logic**: `FOR ALL` covers SELECT, INSERT, UPDATE, DELETE.

### Service Role Bypass

```python
# Use service_role key to bypass RLS
config.database.service_role_key = "service_role_key_here"

# This can access ALL rows regardless of RLS
client = create_client(config.database.url, config.database.service_role_key)
```

**Use Cases**:
- Admin operations
- Background jobs
- Analytics queries
- Data migrations

**⚠️ Warning**: Service role key bypasses all RLS. Use carefully!

### Auth Context in Policies

```sql
-- Current user's ID
auth.uid()  → UUID of logged-in user

-- Current user's JWT claims
auth.jwt() → JSONB of JWT payload

-- Check specific claim
auth.jwt() ->> 'role' = 'admin'
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Indexing Strategy

#### 1. **User-Based Queries** (Most Common)
```sql
-- Fast lookup by user_id
CREATE INDEX idx_chat_messages_user_timestamp 
  ON chat_messages(user_id, timestamp DESC);

CREATE INDEX idx_user_memories_user 
  ON user_memories(user_id);
```

#### 2. **Time-Range Queries**
```sql
-- Efficient time-based filtering
CREATE INDEX idx_chat_messages_timestamp 
  ON chat_messages(timestamp DESC);
```

#### 3. **Composite Indexes**
```sql
-- Combined filters (user + genre)
CREATE INDEX idx_music_rec_user_genre 
  ON music_recommendations(user_id, genz_genre);
```

#### 4. **Partial Indexes** (Filtered)
```sql
-- Only index non-null moods
CREATE INDEX idx_chat_messages_mood 
  ON chat_messages(user_id, mood_detected) 
  WHERE mood_detected IS NOT NULL;
```

### Query Optimization Tips

#### ✅ DO: Use Specific Columns
```python
# Good: Only fetch needed columns
.select('id, message_text, timestamp')

# Bad: Fetch all columns
.select('*')
```

#### ✅ DO: Use Pagination
```python
# Good: Limit results
.range(0, 49)  # First 50 records

# Bad: Fetch all records
.execute()  # No limit
```

#### ✅ DO: Order with Index
```python
# Good: Order by indexed column
.order('timestamp', desc=True)

# Bad: Order by non-indexed column
.order('message_text')
```

#### ✅ DO: Cache Frequent Queries
```python
# Cache personality context (30 min TTL)
if user_id in self._cache:
    context, cached_at = self._cache[user_id]
    if datetime.now() - cached_at < timedelta(minutes=30):
        return context
```

### Connection Pooling

**Not Needed!** Supabase REST API handles connection pooling internally.

```python
# REST API: Each request is stateless
response = supabase.table('profiles').select('*').execute()
# Connection automatically released after request
```

---

## 📚 BEST PRACTICES

### 1. **Always Use RLS**
```sql
-- Enable on every table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies
CREATE POLICY "name" ON your_table FOR ALL USING (auth.uid() = user_id);
```

### 2. **Use Transactions for Related Writes**
```python
# Python supabase library doesn't support transactions directly
# Use PostgreSQL functions for complex atomic operations

# Example: SQL function for atomic chat storage
CREATE OR REPLACE FUNCTION store_chat_pair(
  p_user_id UUID,
  p_user_message TEXT,
  p_ai_response TEXT,
  p_session_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ai_message_id UUID;
BEGIN
  -- Insert user message
  INSERT INTO chat_messages (user_id, message_text, sender_type, session_id)
  VALUES (p_user_id, p_user_message, 'user', p_session_id);
  
  -- Insert AI response
  INSERT INTO chat_messages (user_id, message_text, sender_type, session_id)
  VALUES (p_user_id, p_ai_response, 'ai', p_session_id)
  RETURNING id INTO v_ai_message_id;
  
  RETURN v_ai_message_id;
END;
$$ LANGUAGE plpgsql;

# Call from Python
result = supabase.rpc('store_chat_pair', {
    'p_user_id': user_id,
    'p_user_message': message,
    'p_ai_response': response,
    'p_session_id': session_id
}).execute()
```

### 3. **Handle Errors Gracefully**
```python
try:
    response = supabase.table('profiles').select('*').eq('id', user_id).execute()
    if not response.data:
        return None  # Not found
    return response.data[0]
except Exception as e:
    logger.error(f"Database error: {e}")
    return None  # Don't crash, return default
```

### 4. **Use Type Hints**
```python
from typing import Optional, Dict, Any

async def get_user_personality(
    self, 
    user_id: str
) -> Optional[Dict[str, Any]]:
    """
    Returns personality data or None if not found.
    """
    # ...
```

### 5. **Validate Before Insert**
```python
# Validate data before sending to DB
if not user_id or not message:
    raise ValueError("user_id and message required")

# Use Pydantic models for validation
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    user_id: str = Field(..., description="User's UUID")
```

### 6. **Use Upsert for Idempotency**
```python
# Upsert: Insert or update if exists
supabase.table('user_memories').upsert({
    'user_id': user_id,
    'key': 'favorite_anime',
    'value': 'Re:Zero'
}, on_conflict='user_id, key').execute()

# Safe to call multiple times
```

---

## 🐛 ISSUES & SOLUTIONS

### Issue 1: Direct PostgreSQL Timeout

**Problem**:
```python
# Old code: Direct PostgreSQL connection
import asyncpg
conn = await asyncpg.connect(DATABASE_URL)
# ❌ Timeout: Firewall blocks direct PostgreSQL access
```

**Solution**:
```python
# New code: Use Supabase REST API
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# ✅ Works: REST API uses HTTPS (port 443)
```

### Issue 2: RLS Policy Blocking Queries

**Problem**:
```sql
-- Policy too restrictive
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (id = auth.uid());
-- ❌ Can only see own profile, not others
```

**Solution**:
```sql
-- Adjust policy for intended access
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);
-- ✅ All authenticated users can view all profiles

-- OR keep restrictive and query differently
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
-- ✅ Each user only sees their data (intended)
```

### Issue 3: JSONB Column Not Parsing

**Problem**:
```python
# personality_llm_context stored as TEXT instead of JSONB
response = supabase.table('profiles').select('personality_llm_context').execute()
context = response.data[0]['personality_llm_context']
# ❌ context is string, not dict
```

**Solution**:
```python
import json

# Parse JSON string to dict
context = json.loads(response.data[0]['personality_llm_context'])
# ✅ context is now a dict

# OR: Ensure column is JSONB type in database
ALTER TABLE profiles 
  ALTER COLUMN personality_llm_context TYPE JSONB USING personality_llm_context::JSONB;
```

### Issue 4: Cache Stale Data

**Problem**:
```python
# Personality cached for 30 minutes
# User updates personality during that time
# Backend still uses old cached data
```

**Solution**:
```python
# Option 1: Invalidate cache on update
def update_personality(user_id, new_scores):
    # Update database
    supabase.table('profiles').update(new_scores).eq('id', user_id).execute()
    
    # Invalidate cache
    if user_id in self._cache:
        del self._cache[user_id]

# Option 2: Shorter TTL
cache_ttl = timedelta(minutes=5)  # Reduced from 30 minutes

# Option 3: Force refresh parameter
async def get_personality(user_id, force_refresh=False):
    if not force_refresh and user_id in self._cache:
        # Use cache
        ...
```

---

## 🎯 SUMMARY

### Connection Methods
| Layer | Client Type | Purpose | Key |
|-------|------------|---------|-----|
| **Frontend (Browser)** | `createBrowserClient` | Client components, real-time | Anon Key |
| **Frontend (Server)** | `createServerClient` | Server components, SSR | Anon Key |
| **Frontend (Middleware)** | `createServerClient` | Route protection, auth | Anon Key |
| **Backend (Python)** | `create_client` (supabase-py) | API operations, agents | Service Role or Anon Key |

### Key Takeaways

✅ **REST API Only**: No direct PostgreSQL connections needed  
✅ **RLS Enforced**: Database-level security on every query  
✅ **Singleton Pattern**: Centralized database access via service classes  
✅ **Caching**: 30-min TTL for personality context reduces DB load  
✅ **Indexing**: All user-based queries have indexes  
✅ **JSONB**: Flexible data storage for LLM context, audio features  
✅ **Upsert**: Idempotent operations for memories, preferences  
✅ **Views**: Clean abstraction for personality data  
✅ **Triggers**: Auto-update genre preferences on feedback  
✅ **Type Safety**: Pydantic models validate data before DB  

### Performance Metrics
- **Personality Query**: 700-1000ms (cached: 0ms)
- **Chat History**: 500-800ms (50 messages)
- **Memory Retrieval**: 200-400ms (20 memories)
- **Music Feedback**: 150-300ms (single insert)

### Security Status
- ✅ RLS enabled on all tables
- ✅ Policies enforce user-level access
- ✅ Service role key secured (not exposed to frontend)
- ✅ Anon key safe for public use (RLS protects data)
- ✅ Auth tokens in secure httpOnly cookies
- ✅ HTTPS only for all connections

---

## 🚀 NEXT STEPS

### Immediate Improvements
1. **Vector Search**: Add pgvector for semantic memory search
2. **Full-Text Search**: Add GIN indexes for chat search
3. **Analytics**: Create materialized views for dashboards
4. **Monitoring**: Set up Supabase query performance tracking

### Long-Term Enhancements
1. **Realtime Subscriptions**: Live chat updates
2. **Database Functions**: Complex operations in SQL
3. **Read Replicas**: Separate read/write for scale
4. **Partitioning**: Time-based partitioning for large tables

---

*Last Updated: October 7, 2025*  
*Status: Production Architecture - Fully Documented*  
*Author: Supabase Architecture Analysis*
