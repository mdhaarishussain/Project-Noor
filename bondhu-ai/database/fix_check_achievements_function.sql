-- Fix ambiguous column reference in check_achievements function
-- The error occurs because both the table and the loop variable have 'achievement_name'

DROP FUNCTION IF EXISTS check_achievements(UUID);

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
        SELECT id, achievement_name AS ach_name, requirement_value
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
                            'achievement_name', v_achievement.ach_name,
                            'streak_value', v_current_streak
                        )
                    ),
                total_achievements = COALESCE(total_achievements, 0) + 1
            WHERE user_id = p_user_id;

            -- Return newly unlocked achievement (use alias to avoid ambiguity)
            newly_unlocked_achievement_id := v_achievement.id;
            achievement_name := v_achievement.ach_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION check_achievements IS 'Checks and unlocks achievements based on current stats';

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO service_role;

SELECT 'check_achievements function fixed! ✅' as status;
