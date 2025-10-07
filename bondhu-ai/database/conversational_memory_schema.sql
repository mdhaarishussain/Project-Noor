-- =====================================================
-- Conversational Memory System Schema
-- =====================================================
-- This schema adds comprehensive memory management for
-- Bondhu AI, enabling the LLM to reference past
-- conversations and maintain long-term context.
--
-- Created: 2025-10-07
-- =====================================================

-- =====================================================
-- 1. CONVERSATION MEMORIES TABLE
-- =====================================================
-- Stores summarized conversations with topics, emotions, and key points

CREATE TABLE IF NOT EXISTS conversation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session information
    session_id UUID NOT NULL,
    
    -- Conversation summary
    conversation_summary TEXT NOT NULL,
    
    -- Topics discussed (array of strings)
    topics TEXT[] DEFAULT '{}',
    
    -- Emotions detected (array of strings)
    emotions TEXT[] DEFAULT '{}',
    
    -- Key points from the conversation (array of strings)
    key_points TEXT[] DEFAULT '{}',
    
    -- Message IDs included in this memory
    message_ids UUID[] DEFAULT '{}',
    
    -- Time range
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversation_memories
CREATE INDEX IF NOT EXISTS idx_conversation_memories_user 
    ON conversation_memories(user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_session 
    ON conversation_memories(session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_topics 
    ON conversation_memories USING GIN(topics);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_emotions 
    ON conversation_memories USING GIN(emotions);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_time_range 
    ON conversation_memories(user_id, start_time, end_time);

-- Full-text search on conversation summaries
CREATE INDEX IF NOT EXISTS idx_conversation_memories_summary_fts 
    ON conversation_memories USING GIN(to_tsvector('english', conversation_summary));

-- Comments
COMMENT ON TABLE conversation_memories IS 'Stores summarized conversations with extracted topics, emotions, and key points for long-term memory';
COMMENT ON COLUMN conversation_memories.topics IS 'Array of topics discussed (e.g., work, relationships, anxiety)';
COMMENT ON COLUMN conversation_memories.emotions IS 'Array of emotions detected (e.g., anxious, happy, frustrated)';
COMMENT ON COLUMN conversation_memories.key_points IS 'Important statements or topics from the conversation';


-- =====================================================
-- 2. MEMORY INDEX TABLE
-- =====================================================
-- Fast lookup index for topics and entities mentioned in conversations

CREATE TABLE IF NOT EXISTS memory_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session reference
    session_id UUID NOT NULL,
    
    -- Index type: 'topic' or 'entity'
    index_type TEXT NOT NULL CHECK (index_type IN ('topic', 'entity')),
    
    -- For topic index
    topic TEXT,
    
    -- For entity index
    entity_name TEXT,
    entity_type TEXT, -- person, place, anime, game, etc.
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for memory_index
CREATE INDEX IF NOT EXISTS idx_memory_index_user_type 
    ON memory_index(user_id, index_type);

CREATE INDEX IF NOT EXISTS idx_memory_index_topic 
    ON memory_index(user_id, topic) 
    WHERE index_type = 'topic';

CREATE INDEX IF NOT EXISTS idx_memory_index_entity 
    ON memory_index(user_id, entity_name) 
    WHERE index_type = 'entity';

CREATE INDEX IF NOT EXISTS idx_memory_index_session 
    ON memory_index(session_id);

CREATE INDEX IF NOT EXISTS idx_memory_index_timestamp 
    ON memory_index(user_id, timestamp DESC);

-- Comments
COMMENT ON TABLE memory_index IS 'Fast lookup index for topics and entities mentioned in conversations';
COMMENT ON COLUMN memory_index.index_type IS 'Type of index entry: topic or entity';
COMMENT ON COLUMN memory_index.entity_type IS 'Type of entity: person, place, anime, game, etc.';


-- =====================================================
-- 3. UPDATE user_memories TABLE (if not already created)
-- =====================================================
-- Add additional fields to existing user_memories table

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Memory content
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    
    -- Metadata
    importance TEXT DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
    category TEXT DEFAULT 'general',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Future: Vector embeddings for semantic search
    -- embedding VECTOR(1536),
    
    UNIQUE(user_id, key)
);

-- Add columns if they don't exist (safe ALTER TABLE statements)
DO $$ 
BEGIN
    -- Add importance column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_memories' AND column_name = 'importance'
    ) THEN
        ALTER TABLE user_memories ADD COLUMN importance TEXT DEFAULT 'medium' 
            CHECK (importance IN ('high', 'medium', 'low'));
    END IF;
    
    -- Add category column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_memories' AND column_name = 'category'
    ) THEN
        ALTER TABLE user_memories ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    -- Add last_accessed column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_memories' AND column_name = 'last_accessed'
    ) THEN
        ALTER TABLE user_memories ADD COLUMN last_accessed TIMESTAMPTZ;
    END IF;
    
    -- Add access_count column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_memories' AND column_name = 'access_count'
    ) THEN
        ALTER TABLE user_memories ADD COLUMN access_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Indexes for user_memories (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_memories_user 
    ON user_memories(user_id);

CREATE INDEX IF NOT EXISTS idx_user_memories_category 
    ON user_memories(user_id, category);

CREATE INDEX IF NOT EXISTS idx_user_memories_importance 
    ON user_memories(user_id, importance);

CREATE INDEX IF NOT EXISTS idx_user_memories_updated 
    ON user_memories(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_memories_key_search 
    ON user_memories(user_id, key);


-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- conversation_memories policies
DROP POLICY IF EXISTS "Users can view own conversation memories" ON conversation_memories;
CREATE POLICY "Users can view own conversation memories" 
    ON conversation_memories FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversation memories" ON conversation_memories;
CREATE POLICY "Users can insert own conversation memories" 
    ON conversation_memories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation memories" ON conversation_memories;
CREATE POLICY "Users can update own conversation memories" 
    ON conversation_memories FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversation memories" ON conversation_memories;
CREATE POLICY "Users can delete own conversation memories" 
    ON conversation_memories FOR DELETE 
    USING (auth.uid() = user_id);

-- memory_index policies
DROP POLICY IF EXISTS "Users can view own memory index" ON memory_index;
CREATE POLICY "Users can view own memory index" 
    ON memory_index FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memory index" ON memory_index;
CREATE POLICY "Users can insert own memory index" 
    ON memory_index FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memory index" ON memory_index;
CREATE POLICY "Users can delete own memory index" 
    ON memory_index FOR DELETE 
    USING (auth.uid() = user_id);

-- user_memories policies (if not already set)
DROP POLICY IF EXISTS "Users can manage own memories" ON user_memories;
CREATE POLICY "Users can manage own memories" 
    ON user_memories FOR ALL 
    USING (auth.uid() = user_id);


-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for conversation_memories
DROP TRIGGER IF EXISTS update_conversation_memories_updated_at ON conversation_memories;
CREATE TRIGGER update_conversation_memories_updated_at
    BEFORE UPDATE ON conversation_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_memories
DROP TRIGGER IF EXISTS update_user_memories_updated_at ON user_memories;
CREATE TRIGGER update_user_memories_updated_at
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to track memory access
CREATE OR REPLACE FUNCTION track_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be called manually when retrieving memories
-- to avoid triggering on every SELECT. Instead, we'll update in application code.


-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get recent conversation summaries
CREATE OR REPLACE FUNCTION get_recent_conversation_summaries(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    session_id UUID,
    conversation_summary TEXT,
    topics TEXT[],
    emotions TEXT[],
    start_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.session_id,
        cm.conversation_summary,
        cm.topics,
        cm.emotions,
        cm.start_time
    FROM conversation_memories cm
    WHERE cm.user_id = p_user_id
        AND cm.start_time >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY cm.start_time DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search conversations by topic
CREATE OR REPLACE FUNCTION search_conversations_by_topic(
    p_user_id UUID,
    p_topic TEXT,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    session_id UUID,
    conversation_summary TEXT,
    topics TEXT[],
    start_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.session_id,
        cm.conversation_summary,
        cm.topics,
        cm.start_time
    FROM conversation_memories cm
    WHERE cm.user_id = p_user_id
        AND p_topic = ANY(cm.topics)
    ORDER BY cm.start_time DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get topic frequency
CREATE OR REPLACE FUNCTION get_topic_frequency(p_user_id UUID)
RETURNS TABLE (
    topic TEXT,
    frequency BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.topic,
        COUNT(*) as frequency
    FROM memory_index mi
    WHERE mi.user_id = p_user_id
        AND mi.index_type = 'topic'
        AND mi.topic IS NOT NULL
    GROUP BY mi.topic
    ORDER BY frequency DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 7. GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_memories TO authenticated;
GRANT SELECT, INSERT, DELETE ON memory_index TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_memories TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- =====================================================
-- 8. VIEWS (OPTIONAL)
-- =====================================================

-- View: Recent conversations with topic counts
CREATE OR REPLACE VIEW user_conversation_overview AS
SELECT 
    cm.user_id,
    cm.session_id,
    cm.conversation_summary,
    cm.start_time,
    cm.end_time,
    ARRAY_LENGTH(cm.topics, 1) as topic_count,
    ARRAY_LENGTH(cm.emotions, 1) as emotion_count,
    ARRAY_LENGTH(cm.key_points, 1) as key_point_count
FROM conversation_memories cm
ORDER BY cm.start_time DESC;

GRANT SELECT ON user_conversation_overview TO authenticated;

-- View: Memory statistics per user
CREATE OR REPLACE VIEW user_memory_stats AS
SELECT 
    um.user_id,
    COUNT(*) as total_memories,
    COUNT(*) FILTER (WHERE um.importance = 'high') as high_importance_count,
    COUNT(*) FILTER (WHERE um.importance = 'medium') as medium_importance_count,
    COUNT(*) FILTER (WHERE um.importance = 'low') as low_importance_count,
    MAX(um.updated_at) as last_memory_update
FROM user_memories um
GROUP BY um.user_id;

GRANT SELECT ON user_memory_stats TO authenticated;


-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Conversational Memory System schema created successfully!';
    RAISE NOTICE 'Tables created: conversation_memories, memory_index, user_memories';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Helper functions and views created';
END $$;
