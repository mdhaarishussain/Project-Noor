-- Add chat_personality_insights table for storing personality analysis from conversations
-- This table captures personality trait adjustments derived from chat message patterns
CREATE TABLE IF NOT EXISTS chat_personality_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    adjustments JSONB NOT NULL,
    -- Contains trait adjustments: {"openness": 0.3, "conscientiousness": 0.2, ...}
    message_context TEXT,
    -- Snippet of the message that triggered the insights
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Indexes for efficient querying
    INDEX idx_chat_personality_insights_user_id (user_id),
    INDEX idx_chat_personality_insights_timestamp (timestamp),
    INDEX idx_chat_personality_insights_session (session_id)
);
-- Add Row Level Security
ALTER TABLE chat_personality_insights ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only view their own personality insights
CREATE POLICY "Users can view their own chat personality insights" ON chat_personality_insights FOR
SELECT USING (auth.uid() = user_id);
-- Policy: System can insert insights for any user (backend service)
CREATE POLICY "System can insert chat personality insights" ON chat_personality_insights FOR
INSERT WITH CHECK (true);
-- Add comment for documentation
COMMENT ON TABLE chat_personality_insights IS 'Stores personality trait adjustments derived from chat conversation analysis. Used for reinforcement learning and personality profile updates.';
COMMENT ON COLUMN chat_personality_insights.adjustments IS 'JSONB object containing Big Five trait adjustments: openness, conscientiousness, extraversion, agreeableness, neuroticism';
COMMENT ON COLUMN chat_personality_insights.message_context IS 'First 200 characters of the user message that triggered the personality analysis';