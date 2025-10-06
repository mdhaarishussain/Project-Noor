-- Enhanced Memory System Migration
-- Adds metadata columns to user_memories table for better memory management
-- Add metadata columns to user_memories table
ALTER TABLE user_memories
ADD COLUMN IF NOT EXISTS importance TEXT CHECK (importance IN ('high', 'medium', 'low')) DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON user_memories(importance);
CREATE INDEX IF NOT EXISTS idx_user_memories_category ON user_memories(category);
CREATE INDEX IF NOT EXISTS idx_user_memories_updated_at ON user_memories(updated_at);
-- Add a compound index for efficient session initialization queries
CREATE INDEX IF NOT EXISTS idx_user_memories_user_importance_updated ON user_memories(user_id, importance, updated_at DESC);
-- Update existing memories to have default importance based on key patterns
-- This is a one-time update for existing data
UPDATE user_memories
SET importance = 'high'
WHERE importance = 'low'
    AND (
        key ILIKE '%character%'
        OR key ILIKE '%occupation%'
        OR key ILIKE '%age%'
        OR key ILIKE '%relationship%'
        OR key ILIKE '%favorite_anime%'
        OR key ILIKE '%favorite_game%'
        OR key = 'personal_info'
    );
UPDATE user_memories
SET importance = 'medium'
WHERE importance = 'low'
    AND (
        key ILIKE 'favorite_%'
        OR key ILIKE 'hobby_%'
        OR key ILIKE '%goal%'
    );
-- Update categories based on key patterns
UPDATE user_memories
SET category = 'personal_fact'
WHERE key IN ('occupation', 'age', 'personal_info');
UPDATE user_memories
SET category = 'character_reference'
WHERE key ILIKE '%character%';
UPDATE user_memories
SET category = 'favorite'
WHERE key ILIKE 'favorite_%';
UPDATE user_memories
SET category = 'hobby_interest'
WHERE key ILIKE 'hobby_%';
UPDATE user_memories
SET category = 'relationship'
WHERE key ILIKE 'relationship_%';
UPDATE user_memories
SET category = 'goal_aspiration'
WHERE key ILIKE '%goal%';
-- Add comments for documentation
COMMENT ON COLUMN user_memories.importance IS 'Priority level for memory retrieval: high (always loaded), medium (frequently loaded), low (rarely loaded)';
COMMENT ON COLUMN user_memories.category IS 'Category of memory for organization and filtering';
COMMENT ON COLUMN user_memories.metadata IS 'Additional metadata in JSON format (timestamps, source, etc.)';