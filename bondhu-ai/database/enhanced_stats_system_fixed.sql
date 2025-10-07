-- Enhanced User Activity Stats System (FIXED VERSION)
-- Comprehensive tracking for dashboard metrics
-- This version drops existing functions first to avoid conflicts

-- ============================================
-- 0. DROP EXISTING FUNCTIONS (IF ANY)
-- ============================================

DROP FUNCTION IF EXISTS calculate_wellness_score(UUID);
DROP FUNCTION IF EXISTS update_user_streak(UUID);
DROP FUNCTION IF EXISTS check_achievements(UUID);
DROP FUNCTION IF EXISTS increment_activity_stats(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_user_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS trigger_chat_activity();

-- Drop existing trigger
DROP TRIGGER IF EXISTS chat_message_activity_trigger ON chat_messages;

-- ============================================
-- 1. UPDATE user_activity_stats TABLE STRUCTURE
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE user_activity_stats
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS current_streak_start_date DATE,
ADD COLUMN IF NOT EXISTS longest_streak_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chat_messages INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS wellness_score_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_wellness_calculation TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS achievement_unlocks JSONB DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN user_activity_stats.last_activity_date IS 'Last date user had any activity';
COMMENT ON COLUMN user_activity_stats.current_streak_start_date IS 'Date when current streak started';
COMMENT ON COLUMN user_activity_stats.longest_streak_days IS 'Best streak ever achieved';
COMMENT ON COLUMN user_activity_stats.total_chat_messages IS 'Total messages sent by user';
COMMENT ON COLUMN user_activity_stats.wellness_score_history IS 'Array of {date, score} objects';
COMMENT ON COLUMN user_activity_stats.achievement_unlocks IS 'Array of unlocked achievements';

-- ============================================
-- 2. CREATE ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    requirement_value INT NOT NULL, -- e.g., 5 for "5 day streak"
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(achievement_type, requirement_value)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can see achievements)
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements
    FOR SELECT USING (true);

-- Insert achievement definitions
INSERT INTO achievements (achievement_type, achievement_name, description, requirement_value, icon_name) VALUES
    ('streak', '🔥 5 Day Warrior', 'Maintained a 5-day activity streak', 5, 'fire'),
    ('streak', '💪 10 Day Champion', 'Maintained a 10-day activity streak', 10, 'muscle'),
    ('streak', '⭐ 25 Day Legend', 'Maintained a 25-day activity streak', 25, 'star'),
    ('streak', '🏆  50 Day Master', 'Maintained a 50-day activity streak', 50, 'trophy'),
    ('streak', '👑 100 Day King', 'Maintained a 100-day activity streak', 100, 'crown'),
    ('streak', '💎 250 Day Diamond', 'Maintained a 250-day activity streak', 250, 'gem'),
    ('streak', '🚀 500 Day Rocket', 'Maintained a 500-day activity streak', 500, 'rocket'),
    ('streak', '🌟 1000 Day Celestial', 'Maintained a 1000-day activity streak', 1000, 'sparkles')
ON CONFLICT (achievement_type, requirement_value) DO NOTHING;

-- ============================================
-- 3. WELLNESS SCORE CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_wellness_score(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_score INT := 0;
    v_activity_score INT := 0;
    v_consistency_score INT := 0;
    v_engagement_score INT := 0;
    v_growth_score INT := 0;
    v_recent_days INT := 7;
BEGIN
    -- Component 1: Activity Score (0-25 points)
    -- Based on recent activity (last 7 days)
    SELECT 
        LEAST(25, COUNT(DISTINCT DATE(timestamp)) * 5)
    INTO v_activity_score
    FROM chat_messages
    WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '7 days';

    -- Component 2: Consistency Score (0-25 points)
    -- Based on current streak
    SELECT 
        LEAST(25, COALESCE(current_streak_days, 0) * 2)
    INTO v_consistency_score
    FROM user_activity_stats
    WHERE user_id = p_user_id;

    -- Component 3: Engagement Score (0-25 points)
    -- Based on chat sessions and messages
    SELECT 
        LEAST(25, (COUNT(*) / 10))
    INTO v_engagement_score
    FROM chat_messages
    WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '7 days';

    -- Component 4: Growth Score (0-25 points)
    -- Based on games played and activities completed
    SELECT 
        LEAST(25, 
            (COALESCE(total_games_played, 0) * 2) + 
            (COALESCE(total_achievements, 0) * 5)
        )
    INTO v_growth_score
    FROM user_activity_stats
    WHERE user_id = p_user_id;

    -- Calculate total (0-100)
    v_score := v_activity_score + v_consistency_score + v_engagement_score + v_growth_score;
    
    -- Store in history
    UPDATE user_activity_stats
    SET 
        wellness_score = v_score,
        last_wellness_calculation = NOW(),
        wellness_score_history = wellness_score_history || 
            jsonb_build_object('date', CURRENT_DATE, 'score', v_score)
    WHERE user_id = p_user_id;

    RETURN v_score;
END;
$$;

COMMENT ON FUNCTION calculate_wellness_score IS 'Calculates wellness score based on activity, consistency, engagement, and growth (0-100)';

-- ============================================
-- 4. STREAK UPDATE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_activity DATE;
    v_today DATE := CURRENT_DATE;
    v_current_streak INT;
    v_streak_start DATE;
    v_days_diff INT;
BEGIN
    -- Get current stats
    SELECT 
        last_activity_date,
        current_streak_days,
        current_streak_start_date
    INTO 
        v_last_activity,
        v_current_streak,
        v_streak_start
    FROM user_activity_stats
    WHERE user_id = p_user_id;

    -- Calculate days since last activity
    v_days_diff := v_today - COALESCE(v_last_activity, v_today - 1);

    IF v_days_diff = 0 THEN
        -- Same day - no change to streak
        RETURN;
    ELSIF v_days_diff = 1 THEN
        -- Consecutive day - increment streak
        UPDATE user_activity_stats
        SET 
            current_streak_days = COALESCE(current_streak_days, 0) + 1,
            current_streak_start_date = COALESCE(current_streak_start_date, v_today),
            longest_streak_days = GREATEST(COALESCE(longest_streak_days, 0), COALESCE(current_streak_days, 0) + 1),
            last_activity_date = v_today
        WHERE user_id = p_user_id;
    ELSE
        -- Streak broken - reset
        UPDATE user_activity_stats
        SET 
            current_streak_days = 1,
            current_streak_start_date = v_today,
            last_activity_date = v_today
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

COMMENT ON FUNCTION update_user_streak IS 'Updates user activity streak - increments if consecutive, resets if broken';

-- ============================================
-- 5. CHECK AND UNLOCK ACHIEVEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS TABLE(newly_unlocked_achievement_id UUID, achievement_name VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_streak INT;
    v_achievement RECORD;
    v_unlocked_achievements JSONB;
BEGIN
    -- Get current streak
    SELECT current_streak_days, achievement_unlocks
    INTO v_current_streak, v_unlocked_achievements
    FROM user_activity_stats
    WHERE user_id = p_user_id;

    -- Check each streak achievement
    FOR v_achievement IN 
        SELECT id, achievement_name, requirement_value
        FROM achievements
        WHERE achievement_type = 'streak'
            AND requirement_value <= v_current_streak
        ORDER BY requirement_value DESC
    LOOP
        -- Check if already unlocked
        IF NOT (v_unlocked_achievements ? v_achievement.id::TEXT) THEN
            -- Unlock achievement
            UPDATE user_activity_stats
            SET 
                achievement_unlocks = COALESCE(achievement_unlocks, '{}'::jsonb) || 
                    jsonb_build_object(
                        v_achievement.id::TEXT, 
                        jsonb_build_object(
                            'unlocked_at', NOW(),
                            'achievement_name', v_achievement.achievement_name,
                            'streak_value', v_current_streak
                        )
                    ),
                total_achievements = COALESCE(total_achievements, 0) + 1
            WHERE user_id = p_user_id;

            -- Return newly unlocked achievement
            newly_unlocked_achievement_id := v_achievement.id;
            achievement_name := v_achievement.achievement_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION check_achievements IS 'Checks and unlocks achievements based on current stats';

-- ============================================
-- 6. INCREMENT CHAT SESSION (ACTIVITY TRIGGER)
-- ============================================

CREATE OR REPLACE FUNCTION increment_activity_stats(
    p_user_id UUID,
    p_activity_type VARCHAR DEFAULT 'chat' -- 'chat', 'game', 'login'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert or update stats
    INSERT INTO user_activity_stats (
        user_id,
        total_messages,
        last_activity_date,
        current_streak_days,
        current_streak_start_date
    ) VALUES (
        p_user_id,
        CASE WHEN p_activity_type = 'chat' THEN 1 ELSE 0 END,
        CURRENT_DATE,
        1,
        CURRENT_DATE
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_messages = CASE 
            WHEN p_activity_type = 'chat' 
            THEN user_activity_stats.total_messages + 1 
            ELSE user_activity_stats.total_messages 
        END,
        total_games_played = CASE 
            WHEN p_activity_type = 'game' 
            THEN COALESCE(user_activity_stats.total_games_played, 0) + 1 
            ELSE user_activity_stats.total_games_played 
        END;

    -- Update streak
    PERFORM update_user_streak(p_user_id);
    
    -- Check for new achievements
    PERFORM check_achievements(p_user_id);
    
    -- Recalculate wellness score
    PERFORM calculate_wellness_score(p_user_id);
END;
$$;

COMMENT ON FUNCTION increment_activity_stats IS 'Main function to track any user activity and update all related stats';

-- ============================================
-- 7. AUTOMATIC TRIGGERS
-- ============================================

-- Trigger on chat message insert
CREATE OR REPLACE FUNCTION trigger_chat_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only count user messages (not AI responses)
    IF NEW.sender_type = 'user' THEN
        PERFORM increment_activity_stats(NEW.user_id, 'chat');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER chat_message_activity_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_chat_activity();

COMMENT ON TRIGGER chat_message_activity_trigger ON chat_messages IS 'Automatically updates stats when user sends a message';

-- ============================================
-- 8. GET USER DASHBOARD STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
    v_wellness_change INT;
    v_today_messages INT;
    v_active_sessions INT;
BEGIN
    -- Get today's message count
    SELECT COUNT(*)
    INTO v_today_messages
    FROM chat_messages
    WHERE user_id = p_user_id
        AND DATE(timestamp) = CURRENT_DATE
        AND sender_type = 'user';

    -- Count active sessions (sessions with activity in last 30 minutes)
    SELECT COUNT(DISTINCT session_id)
    INTO v_active_sessions
    FROM chat_messages
    WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '30 minutes';

    -- Calculate wellness change (compared to yesterday)
    WITH yesterday_score AS (
        SELECT (wellness_score_history->-2->>'score')::INT as score
        FROM user_activity_stats
        WHERE user_id = p_user_id
    )
    SELECT 
        COALESCE(uas.wellness_score, 0) - COALESCE(ys.score, 0)
    INTO v_wellness_change
    FROM user_activity_stats uas
    LEFT JOIN yesterday_score ys ON true
    WHERE uas.user_id = p_user_id;

    -- Build result JSON
    SELECT json_build_object(
        'wellness_score', COALESCE(uas.wellness_score, 0),
        'wellness_change', COALESCE(v_wellness_change, 0),
        'wellness_change_text', CASE 
            WHEN v_wellness_change > 0 THEN '+' || v_wellness_change::TEXT || ' this week'
            WHEN v_wellness_change < 0 THEN v_wellness_change::TEXT || ' this week'
            ELSE 'No change'
        END,
        'chat_sessions', COALESCE(uas.total_messages, 0),
        'chat_sessions_change', '+' || COALESCE(v_today_messages, 0)::TEXT || ' today',
        'games_played', COALESCE(uas.total_games_played, 0),
        'games_change', '+2 this week', -- TODO: Calculate actual change
        'growth_streak_days', COALESCE(uas.current_streak_days, 0),
        'growth_streak_status', CASE 
            WHEN COALESCE(uas.current_streak_days, 0) >= 20 THEN 'Amazing streak!'
            WHEN COALESCE(uas.current_streak_days, 0) >= 10 THEN 'Great streak!'
            WHEN COALESCE(uas.current_streak_days, 0) >= 5 THEN 'Good streak!'
            ELSE 'Keep going!'
        END,
        'achievements', COALESCE(uas.total_achievements, 0),
        'achievements_change', '+2 this month', -- TODO: Calculate actual change
        'active_sessions', v_active_sessions,
        'active_sessions_text', v_active_sessions::TEXT || ' active now',
        'longest_streak', COALESCE(uas.longest_streak_days, 0),
        'last_activity', uas.last_activity_date
    )
    INTO v_result
    FROM user_activity_stats uas
    WHERE uas.user_id = p_user_id;

    RETURN COALESCE(v_result, json_build_object(
        'wellness_score', 0,
        'chat_sessions', 0,
        'games_played', 0,
        'growth_streak_days', 0,
        'achievements', 0,
        'active_sessions', 0
    ));
END;
$$;

COMMENT ON FUNCTION get_user_dashboard_stats IS 'Returns all dashboard statistics for a user in JSON format';

-- ============================================
-- 9. INITIALIZE STATS FOR EXISTING USERS
-- ============================================

-- Ensure all users have a stats row
INSERT INTO user_activity_stats (user_id, wellness_score, total_messages)
SELECT DISTINCT user_id, 0, 0
FROM chat_messages
WHERE user_id NOT IN (SELECT user_id FROM user_activity_stats)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION calculate_wellness_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_activity_stats(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;

GRANT ALL ON achievements TO authenticated;
GRANT ALL ON achievements TO service_role;

-- ============================================
-- COMPLETE!
-- ============================================

SELECT 'Stats system setup complete! ✅' as status;
