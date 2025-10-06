-- Create user activity stats table to track dashboard metrics
-- This table stores aggregated statistics for each user

CREATE TABLE IF NOT EXISTS user_activity_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Wellness Score (calculated from mood tracking)
  wellness_score INTEGER DEFAULT 0 CHECK (wellness_score >= 0 AND wellness_score <= 100),
  wellness_trend INTEGER DEFAULT 0, -- +/- change this week
  last_mood_update TIMESTAMPTZ,
  
  -- Chat Sessions
  total_chat_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  messages_today INTEGER DEFAULT 0,
  last_chat_date TIMESTAMPTZ,
  
  -- Games Played
  total_games_played INTEGER DEFAULT 0,
  games_this_week INTEGER DEFAULT 0,
  last_game_date TIMESTAMPTZ,
  favorite_game TEXT,
  
  -- Growth Streak
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date TIMESTAMPTZ,
  
  -- Achievements
  total_achievements INTEGER DEFAULT 0,
  achievements_this_month INTEGER DEFAULT 0,
  achievement_list JSONB DEFAULT '[]'::JSONB,
  
  -- Active Sessions (current ongoing activities)
  active_sessions INTEGER DEFAULT 0,
  active_sessions_today INTEGER DEFAULT 0,
  active_session_types JSONB DEFAULT '[]'::JSONB, -- ['chat', 'game', 'video', 'music']
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one row per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own activity stats" ON user_activity_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity stats" ON user_activity_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity stats" ON user_activity_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_stats_user_id ON user_activity_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_stats_updated_at ON user_activity_stats(updated_at);

-- Create trigger for updated_at
CREATE TRIGGER update_user_activity_stats_updated_at
  BEFORE UPDATE ON user_activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user activity stats on first login
CREATE OR REPLACE FUNCTION initialize_user_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_activity_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create activity stats when user profile is created
CREATE TRIGGER on_profile_created_init_stats
  AFTER INSERT ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION initialize_user_activity_stats();

-- Function to increment chat session count
CREATE OR REPLACE FUNCTION increment_chat_session(user_id UUID, message_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    total_chat_sessions = total_chat_sessions + 1,
    total_messages = total_messages + message_count,
    messages_today = CASE 
      WHEN last_chat_date::DATE = CURRENT_DATE THEN messages_today + message_count
      ELSE message_count
    END,
    last_chat_date = NOW(),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_chat_session.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment game played count
CREATE OR REPLACE FUNCTION increment_game_played(user_id UUID, game_name TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    total_games_played = total_games_played + 1,
    games_this_week = CASE 
      WHEN last_game_date >= DATE_TRUNC('week', CURRENT_DATE) 
      THEN games_this_week + 1
      ELSE 1
    END,
    last_game_date = NOW(),
    favorite_game = COALESCE(game_name, favorite_game),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_game_played.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update wellness score
CREATE OR REPLACE FUNCTION update_wellness_score(
  user_id UUID, 
  new_score INTEGER,
  trend_change INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    wellness_score = new_score,
    wellness_trend = trend_change,
    last_mood_update = NOW(),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = update_wellness_score.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  days_since_last_activity INTEGER;
  new_streak INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - last_activity_date))::INTEGER 
  INTO days_since_last_activity
  FROM user_activity_stats 
  WHERE user_activity_stats.user_id = update_streak.user_id;
  
  IF days_since_last_activity IS NULL OR days_since_last_activity > 1 THEN
    -- Streak broken, reset to 1
    new_streak := 1;
  ELSE
    -- Continue streak
    SELECT current_streak_days + 1 INTO new_streak
    FROM user_activity_stats 
    WHERE user_activity_stats.user_id = update_streak.user_id;
  END IF;
  
  UPDATE user_activity_stats SET
    current_streak_days = new_streak,
    longest_streak_days = GREATEST(longest_streak_days, new_streak),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = update_streak.user_id;
  
  RETURN new_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add achievement
CREATE OR REPLACE FUNCTION add_achievement(
  user_id UUID,
  achievement_name TEXT,
  achievement_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  new_achievement JSONB;
BEGIN
  new_achievement := jsonb_build_object(
    'name', achievement_name,
    'description', achievement_description,
    'earned_at', NOW()
  );
  
  UPDATE user_activity_stats SET
    total_achievements = total_achievements + 1,
    achievements_this_month = CASE 
      WHEN updated_at >= DATE_TRUNC('month', CURRENT_DATE) 
      THEN achievements_this_month + 1
      ELSE 1
    END,
    achievement_list = achievement_list || new_achievement,
    updated_at = NOW()
  WHERE user_activity_stats.user_id = add_achievement.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update active sessions
CREATE OR REPLACE FUNCTION update_active_sessions(
  user_id UUID,
  session_types TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    active_sessions = array_length(session_types, 1),
    active_sessions_today = array_length(session_types, 1),
    active_session_types = to_jsonb(session_types),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = update_active_sessions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON user_activity_stats TO authenticated;
GRANT ALL ON user_activity_stats TO service_role;

GRANT EXECUTE ON FUNCTION increment_chat_session(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_game_played(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_wellness_score(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_achievement(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_active_sessions(UUID, TEXT[]) TO authenticated;

-- Insert default stats for existing users (run once)
INSERT INTO user_activity_stats (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

