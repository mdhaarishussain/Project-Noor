-- Chat History Schema for Bondhu AI
-- MVP Launch - October 3rd, 2025

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  personality_context JSONB,
  has_personality_context BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own chats
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_created 
  ON chat_history(user_id, created_at DESC);

-- Create index for personality context queries
CREATE INDEX IF NOT EXISTS idx_chat_history_personality 
  ON chat_history(user_id, has_personality_context);

-- Grant permissions
GRANT ALL ON chat_history TO authenticated;
GRANT ALL ON chat_history TO service_role;

-- Add comment
COMMENT ON TABLE chat_history IS 'Stores chat messages and responses with personality context for each user';
