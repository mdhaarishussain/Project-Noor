-- QUICK SETUP FOR DASHBOARD STATS
-- Copy this entire file and run it in Supabase SQL Editor

-- Step 0: Drop any existing views or tables with the same name
DROP VIEW IF EXISTS user_activity_stats CASCADE;
DROP TABLE IF EXISTS user_activity_stats CASCADE;

-- Step 1: Create the table
CREATE TABLE user_activity_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Dashboard Progress Stats
  wellness_score INTEGER DEFAULT 0,
  wellness_trend INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  messages_today INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  games_this_week INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_achievements INTEGER DEFAULT 0,
  achievements_this_month INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  active_sessions_today INTEGER DEFAULT 0,
  achievement_list JSONB DEFAULT '[]'::JSONB,
  last_activity_date TIMESTAMPTZ,
  
  -- Entertainment Hub Stats (Recent Activity)
  games_played_count INTEGER DEFAULT 0,
  videos_watched_count INTEGER DEFAULT 0,
  songs_listened_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
DROP POLICY IF EXISTS "Users can view own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can insert own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can update own activity stats" ON user_activity_stats;

CREATE POLICY "Users can view own activity stats" ON user_activity_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity stats" ON user_activity_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity stats" ON user_activity_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION increment_chat_session(user_id UUID, message_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    total_messages = total_messages + message_count,
    messages_today = CASE 
      WHEN last_activity_date::DATE = CURRENT_DATE THEN messages_today + message_count
      ELSE message_count
    END,
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_chat_session.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_game_played(user_id UUID, game_name TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    total_games_played = total_games_played + 1,
    games_played_count = games_played_count + 1,
    games_this_week = CASE 
      WHEN last_activity_date >= DATE_TRUNC('week', CURRENT_DATE) 
      THEN games_this_week + 1
      ELSE 1
    END,
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_game_played.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_video_watched(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    videos_watched_count = videos_watched_count + 1,
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_video_watched.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_song_listened(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    songs_listened_count = songs_listened_count + 1,
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = increment_song_listened.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = update_wellness_score.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    new_streak := 1;
  ELSE
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

CREATE OR REPLACE FUNCTION update_active_sessions(
  user_id UUID,
  session_types TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_activity_stats SET
    active_sessions = array_length(session_types, 1),
    active_sessions_today = array_length(session_types, 1),
    updated_at = NOW()
  WHERE user_activity_stats.user_id = update_active_sessions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT ALL ON user_activity_stats TO authenticated;
GRANT ALL ON user_activity_stats TO service_role;

GRANT EXECUTE ON FUNCTION increment_chat_session(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_game_played(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_video_watched(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_song_listened(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_wellness_score(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_achievement(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_active_sessions(UUID, TEXT[]) TO authenticated;

-- Step 6: Initialize stats for all existing users
INSERT INTO user_activity_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Verify it worked (check your stats)
SELECT * FROM user_activity_stats WHERE user_id = auth.uid();

-- Step 3: Create RLS policies
DROP POLICY IF EXISTS "Users can view own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can insert own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can update own activity stats" ON user_activity_stats;

CREATE POLICY "Users can view own activity stats" ON user_activity_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity stats" ON user_activity_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity stats" ON user_activity_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Initialize stats for all existing users
INSERT INTO user_activity_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify it worked (check your stats)
SELECT * FROM user_activity_stats WHERE user_id = auth.uid();
